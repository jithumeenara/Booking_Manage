import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { getFinancialYear } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

export default function PublicBooking() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [departmentName, setDepartmentName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    start_date: "",
    end_date: "",
    num_participants: "",
    purpose: "",
    contact_person_name: "",
    contact_person_email: "",
    contact_person_phone: "",
    needs_accommodation: false,
    needs_food: false,
    needs_training_hall: false,
    number_of_halls: "1"
  });

  useEffect(() => {
    checkLinkValidity();
  }, [token]);

  const checkLinkValidity = async () => {
    try {
      const res = await fetch(`/api/booking-links/${token}`);
      if (!res.ok) {
        const data = await res.json();
        setIsValid(false);
        if (res.status === 410) {
          toast.error(data.error || "This booking link has already been used");
        } else {
          toast.error(data.error || "Invalid booking link");
        }
        return;
      }
      const data = await res.json();
      setIsValid(true);
      setDepartmentName(data.department_name);
    } catch (error) {
      console.error("Error checking link:", error);
      setIsValid(false);
      toast.error("Error validating booking link");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const financialYear = getFinancialYear(new Date(formData.start_date));

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_agency: departmentName,
          start_date: formData.start_date,
          end_date: formData.end_date,
          num_participants: parseInt(formData.num_participants),
          purpose: formData.purpose,
          contact_person_name: formData.contact_person_name,
          contact_person_email: formData.contact_person_email,
          contact_person_phone: formData.contact_person_phone,
          needs_accommodation: formData.needs_accommodation,
          needs_food: formData.needs_food,
          needs_training_hall: formData.needs_training_hall,
          number_of_halls: parseInt(formData.number_of_halls),
          financial_year: financialYear,
          status: "pending",
          booked_via_link: true,
          booking_link_token: token
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit booking');
      }

      setIsSuccess(true);
      toast.success("Booking submitted successfully!");
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error("Failed to submit booking");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Verifying link...</p>
      </div>
    );
  }

  if (isValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid Link</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This booking link is invalid. Please contact the administrator for a valid link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              Booking Submitted Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Thank you for your booking submission. You will be contacted shortly regarding your request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>New Booking Request</CardTitle>
            <p className="text-sm text-muted-foreground">Department: {departmentName}</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date *</Label>
                  <Input
                    id="end_date"
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="num_participants">Number of Participants *</Label>
                <Input
                  id="num_participants"
                  type="number"
                  required
                  min="1"
                  value={formData.num_participants}
                  onChange={(e) => setFormData({ ...formData, num_participants: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="purpose">Purpose</Label>
                <Textarea
                  id="purpose"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="contact_person_name">Contact Person Name *</Label>
                <Input
                  id="contact_person_name"
                  required
                  value={formData.contact_person_name}
                  onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_person_email">Email *</Label>
                  <Input
                    id="contact_person_email"
                    type="email"
                    required
                    value={formData.contact_person_email}
                    onChange={(e) => setFormData({ ...formData, contact_person_email: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_person_phone">Phone *</Label>
                  <Input
                    id="contact_person_phone"
                    type="tel"
                    required
                    value={formData.contact_person_phone}
                    onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Requirements</Label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needs_accommodation"
                    checked={formData.needs_accommodation}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, needs_accommodation: checked as boolean })
                    }
                  />
                  <label htmlFor="needs_accommodation" className="text-sm">Accommodation</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needs_food"
                    checked={formData.needs_food}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, needs_food: checked as boolean })
                    }
                  />
                  <label htmlFor="needs_food" className="text-sm">Food</label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="needs_training_hall"
                    checked={formData.needs_training_hall}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, needs_training_hall: checked as boolean })
                    }
                  />
                  <label htmlFor="needs_training_hall" className="text-sm">Training Hall</label>
                </div>
              </div>

              {formData.needs_training_hall && (
                <div>
                  <Label htmlFor="number_of_halls">Number of Halls</Label>
                  <Input
                    id="number_of_halls"
                    type="number"
                    min="1"
                    value={formData.number_of_halls}
                    onChange={(e) => setFormData({ ...formData, number_of_halls: e.target.value })}
                  />
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? "Submitting..." : "Submit Booking"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
