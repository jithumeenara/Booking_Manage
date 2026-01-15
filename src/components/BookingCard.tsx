import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Phone, Trash2, Home, Utensils, Building, Edit, Link2, MousePointerClick } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";

export interface Booking {
  id: string;
  department_agency: string;
  contact_person_name: string;
  contact_person_email: string;
  contact_person_phone: string;
  start_date: string;
  end_date: string;
  num_participants: number;
  needs_accommodation: boolean;
  needs_food: boolean;
  needs_training_hall: boolean;
  number_of_halls?: number;
  purpose?: string;
  created_at: string;
  status?: string;
  total_bill_amount?: number;
  completed_at?: string;
  financial_year?: string;
  bill_no?: string;
  billed_date?: string;
  num_of_bills?: number;
  booked_via_link?: boolean;
  allocated_halls?: { id: string; name: string; code: string }[];
}

interface BookingCardProps {
  booking: Booking;
  onDelete?: (id: string) => void;
  onEdit?: (booking: Booking) => void;
  onMarkComplete?: (booking: Booking) => void;
  onAllocate?: (booking: Booking) => void;
  showCompleteButton?: boolean;
}

export const BookingCard = ({ booking, onDelete, onEdit, onMarkComplete, onAllocate, showCompleteButton }: BookingCardProps) => {
  const isPastEndDate = new Date(booking.end_date) < new Date();
  const canMarkComplete = isPastEndDate && booking.status === 'pending';
  return (
    <Card className="transition-all duration-300 hover:shadow-xl border border-sidebar-border backdrop-blur-xl shadow-lg hover:scale-[1.02]" style={{
      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.65), rgba(250, 255, 245, 0.45), rgba(255, 254, 240, 0.55))',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.08), 0 4px 16px 0 rgba(234, 179, 8, 0.06)'
    }}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold">{booking.department_agency}</CardTitle>
            <p className="text-sm font-medium text-primary mt-1">{booking.contact_person_name}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {booking.num_participants} {booking.num_participants === 1 ? 'person' : 'people'}
            </Badge>
            {booking.booked_via_link ? (
              <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200">
                <Link2 className="h-3 w-3" />
                Via Booking Link
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs gap-1 bg-slate-50 text-slate-700 border-slate-200">
                <MousePointerClick className="h-3 w-3" />
                Manual Entry
              </Badge>
            )}
            {booking.status === 'complete' && <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500">Ready for billing</Badge>}
            {booking.status === 'payment_completed' && <Badge className="bg-green-600">Payment Completed</Badge>}
            {booking.status === 'payment_pending' && <Badge variant="destructive">Payment Pending</Badge>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-foreground">
            {format(new Date(booking.start_date), "MMM dd, yyyy")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Phone className="h-4 w-4 text-primary" />
          <a
            href={`tel:${booking.contact_person_phone}`}
            className="text-foreground hover:text-primary hover:underline md:pointer-events-none md:no-underline"
          >
            {booking.contact_person_phone}
          </a>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span className="text-foreground">{booking.num_participants} participants</span>
        </div>

        {booking.purpose && (
          <div className="text-sm text-muted-foreground pt-2">
            <span className="font-medium">Purpose:</span> {booking.purpose}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-4 items-start">
          {booking.needs_accommodation && (
            <Badge variant="outline" className="text-xs gap-1">
              <Home className="h-3 w-3" />
              Accommodation
            </Badge>
          )}
          {booking.needs_food && (
            <Badge variant="outline" className="text-xs gap-1">
              <Utensils className="h-3 w-3" />
              Food
            </Badge>
          )}
          {booking.needs_training_hall && (
            <div className="flex flex-col gap-1">
              <Badge variant="outline" className="text-xs gap-1 w-fit bg-blue-50/50">
                <Building className="h-3 w-3" />
                Training Hall {booking.number_of_halls && booking.number_of_halls > 1 ? `(${booking.number_of_halls} halls)` : ''}
              </Badge>
              {booking.allocated_halls && booking.allocated_halls.length > 0 && Array.isArray(booking.allocated_halls) ? (
                <div className="flex flex-wrap gap-1 pl-1">
                  {booking.allocated_halls.map((h: any) => (
                    // Check for nulls if left join had no matches and JSON_ARRAYAGG returned [null]
                    h && h.id ? (
                      <Badge key={h.id} variant="secondary" className="text-[10px] h-4 px-1.5 border-blue-100 bg-blue-50 text-blue-700 hover:bg-blue-100">
                        {h.name}
                      </Badge>
                    ) : null
                  ))}
                </div>
              ) : (
                // Show "Allocated: None" or similar if needed, or rely on button below
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 border-orange-100 bg-orange-50 text-orange-700">
                  Not Allocated
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground pt-2">
          Booked on: {format(new Date(booking.created_at), "MMM dd, yyyy 'at' HH:mm")}
        </div>
      </CardContent>

      <CardFooter className="flex gap-2 flex-wrap">
        {onAllocate && booking.needs_training_hall && booking.status === 'pending' && (
          <Button variant="secondary" size="sm" onClick={() => onAllocate(booking)} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
            <Building className="h-4 w-4 mr-2" />
            Allocate
          </Button>
        )}
        {onEdit && (booking.status === 'pending' || booking.status === 'confirmed') && (
          <Button variant="outline" size="sm" onClick={() => onEdit(booking)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {showCompleteButton && canMarkComplete && onMarkComplete && (
          <Button className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500" size="sm" onClick={() => onMarkComplete(booking)}>
            Mark Ready for billing
          </Button>
        )}
        {onDelete && booking.status === 'pending' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="h-4 w-4 mr-2" />
                Cancel Booking
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to cancel the booking for "{booking.department_agency}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(booking.id)}>
                  Cancel Booking
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </CardFooter>
    </Card>
  );
};
