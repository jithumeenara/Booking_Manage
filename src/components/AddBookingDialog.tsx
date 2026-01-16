import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";
import { Calendar as CalendarIcon, Users, Phone, Building } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn, getFinancialYear } from "@/lib/utils";
import { Booking } from "./BookingCard";

interface AddBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBookingAdded: () => void;
  booking?: Booking;
}

export const AddBookingDialog = ({ open, onOpenChange, onBookingAdded, booking }: AddBookingDialogProps) => {
  const [departmentAgency, setDepartmentAgency] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonEmail, setContactPersonEmail] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numParticipants, setNumParticipants] = useState(1);
  const [needsAccommodation, setNeedsAccommodation] = useState(false);
  const [needsFood, setNeedsFood] = useState(false);
  const [needsTrainingHall, setNeedsTrainingHall] = useState(false);
  const [numberOfHalls, setNumberOfHalls] = useState(1);
  const [purpose, setPurpose] = useState("");
  /* Unused: availableHalls, selectedHallIds, loadingHalls removed */
  const navigate = useNavigate();



  useEffect(() => {
    if (booking) {
      setDepartmentAgency(booking.department_agency);
      setContactPersonName(booking.contact_person_name);
      setContactPersonEmail(booking.contact_person_email);
      setContactPersonPhone(booking.contact_person_phone);
      setStartDate(new Date(booking.start_date));
      setEndDate(new Date(booking.end_date));
      setNumParticipants(booking.num_participants);
      setNeedsAccommodation(Boolean(booking.needs_accommodation));
      setNeedsFood(Boolean(booking.needs_food));
      setNeedsTrainingHall(Boolean(booking.needs_training_hall));
      setNumberOfHalls(booking.number_of_halls || 1);
      setPurpose(booking.purpose || "");

    } else {
      resetForm();
    }
  }, [booking, open]);

  const resetForm = () => {
    setDepartmentAgency("");
    setContactPersonName("");
    setContactPersonEmail("");
    setContactPersonPhone("");
    setStartDate(undefined);
    setEndDate(undefined);
    setNumParticipants(1);
    setNeedsAccommodation(false);
    setNeedsFood(false);
    setNeedsTrainingHall(false);
    setNumberOfHalls(1);

    setPurpose("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!departmentAgency || !contactPersonName || !contactPersonEmail || !contactPersonPhone || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (contactPersonPhone.length < 10) {
      toast.error("Phone number must be at least 10 digits");
      return;
    }

    if (endDate < startDate) {
      toast.error("End date must be after start date");
      return;
    }

    if (numParticipants < 1) {
      toast.error("Number of participants must be at least 1");
      return;
    }

    try {
      // Calculate financial year (April to March)
      const fy = getFinancialYear(startDate);

      const bookingData = {
        department_agency: departmentAgency.trim(),
        contact_person_name: contactPersonName.trim(),
        contact_person_email: contactPersonEmail.trim(),
        contact_person_phone: contactPersonPhone.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        num_participants: numParticipants,
        needs_accommodation: needsAccommodation,
        needs_food: needsFood,
        needs_training_hall: needsTrainingHall,
        number_of_halls: needsTrainingHall ? numberOfHalls : 0,
        // hall_ids removed to prevent overwriting existing allocations on edit 
        purpose: purpose || undefined,
        financial_year: fy,
        status: booking ? booking.status : 'pending',
      };

      console.log('Submitting booking data:', bookingData);

      const res = booking
        ? await fetch(`/api/bookings/${booking.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bookingData),
        })
        : await fetch('/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(bookingData),
        });

      if (!res.ok) {
        const data = await res.json();
        // Show specific validation details if available
        if (data.details && typeof data.details === 'object') {
          const messages = Object.values(data.details).flat().map((d: any) => d._errors || []).flat();
          if (messages.length > 0) throw new Error(messages.join(', '));
        }
        throw new Error(data.error || 'Failed to save booking');
      }

      toast.success(booking ? "Booking updated successfully!" : "Booking added successfully!", {
        action: needsTrainingHall ? {
          label: 'Allocate Halls',
          onClick: () => navigate('/training-halls')
        } : undefined
      });
      resetForm();
      onOpenChange(false);
      onBookingAdded();
    } catch (error: any) {
      console.error('Error saving booking:', error);
      toast.error(error.message || 'Failed to save booking. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{booking ? "Edit Booking Details" : "New Booking"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department/Agency *</Label>
            <div className="relative">
              <Building className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="department"
                value={departmentAgency}
                onChange={(e) => setDepartmentAgency(e.target.value)}
                placeholder="Enter department or agency name"
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Person Name *</Label>
              <Input
                id="contactName"
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input
                id="contactEmail"
                type="email"
                value={contactPersonEmail}
                onChange={(e) => setContactPersonEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value.trim())}
                  placeholder="+91 234 567 8900"
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Number of Participants *</Label>
            <div className="relative">
              <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="participants"
                type="number"
                min="1"
                value={numParticipants}
                onChange={(e) => setNumParticipants(Number.parseInt(e.target.value, 10) || 1)}
                className="pl-9"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Purpose (Optional)</Label>
            <Textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the purpose of this booking..."
              rows={3}
            />
          </div>

          <div className="space-y-3">
            <Label>Required Facilities</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="accommodation"
                  checked={needsAccommodation}
                  onCheckedChange={(checked) => setNeedsAccommodation(checked as boolean)}
                />
                <label htmlFor="accommodation" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Accommodation
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="food"
                  checked={needsFood}
                  onCheckedChange={(checked) => setNeedsFood(checked as boolean)}
                />
                <label htmlFor="food" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Food Service
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="trainingHall"
                  checked={needsTrainingHall}
                  onCheckedChange={(checked) => setNeedsTrainingHall(checked as boolean)}
                />
                <label htmlFor="trainingHall" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Training Hall
                </label>
              </div>

              {needsTrainingHall && (
                <div className="ml-6 space-y-2 border rounded-md p-3 bg-muted/20">
                  <Label htmlFor="numberOfHalls">Number of Halls Needed</Label>
                  <Input
                    id="numberOfHalls"
                    type="number"
                    min="1"
                    value={numberOfHalls}
                    onChange={(e) => setNumberOfHalls(parseInt(e.target.value) || 1)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    You can allocate specific halls in the "Training Halls" section after creating the booking.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {booking ? "Update Booking" : "Add Booking"}
            </Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};