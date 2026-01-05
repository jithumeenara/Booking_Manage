import { useState, useEffect } from "react";
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
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [numParticipants, setNumParticipants] = useState(1);
  const [needsAccommodation, setNeedsAccommodation] = useState(false);
  const [needsFood, setNeedsFood] = useState(false);
  const [needsTrainingHall, setNeedsTrainingHall] = useState(false);
  const [numberOfHalls, setNumberOfHalls] = useState(1);
  const [purpose, setPurpose] = useState("");

  useEffect(() => {
    if (booking) {
      setDepartmentAgency(booking.department_agency);
      setContactPersonName(booking.contact_person_name);
      setContactPersonPhone(booking.contact_person_phone);
      setStartDate(new Date(booking.start_date));
      setEndDate(new Date(booking.end_date));
      setNumParticipants(booking.num_participants);
      setNeedsAccommodation(booking.needs_accommodation);
      setNeedsFood(booking.needs_food);
      setNeedsTrainingHall(booking.needs_training_hall);
      setNumberOfHalls(booking.number_of_halls || 1);
      setPurpose(booking.purpose || "");
    } else {
      resetForm();
    }
  }, [booking, open]);

  const resetForm = () => {
    setDepartmentAgency("");
    setContactPersonName("");
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

    if (!departmentAgency || !contactPersonName || !contactPersonPhone || !startDate || !endDate) {
      toast.error("Please fill in all required fields");
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
        department_agency: departmentAgency,
        contact_person_name: contactPersonName,
        contact_person_email: `${contactPersonName.replace(/\s+/g, '.').toLowerCase()}@placeholder.com`,
        contact_person_phone: contactPersonPhone,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        num_participants: numParticipants,
        needs_accommodation: needsAccommodation,
        needs_food: needsFood,
        needs_training_hall: needsTrainingHall,
        number_of_halls: needsTrainingHall ? numberOfHalls : null,
        purpose: purpose || null,
        financial_year: fy,
        status: 'pending',
      };

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
        throw new Error(data.error || 'Failed to save booking');
      }

      toast.success(booking ? "Booking updated successfully!" : "Booking added successfully!");
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
          <DialogTitle>{booking ? "Edit Programme Booking" : "Add New Programme Booking"}</DialogTitle>
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
              <Label htmlFor="contactPhone">Contact Phone *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="contactPhone"
                  type="tel"
                  value={contactPersonPhone}
                  onChange={(e) => setContactPersonPhone(e.target.value)}
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
                <div className="ml-6 space-y-2">
                  <Label htmlFor="numberOfHalls">Number of Halls to Book *</Label>
                  <Input
                    id="numberOfHalls"
                    type="number"
                    min="1"
                    max="5"
                    value={numberOfHalls}
                    onChange={(e) => setNumberOfHalls(Number.parseInt(e.target.value, 10) || 1)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Available: 4 halls (60 capacity each) + 1 hall (60+ capacity)</p>
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