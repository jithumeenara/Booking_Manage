import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Users, Building2, IndianRupee, FileText, Bell, Link2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatsCard } from "@/components/StatsCard";
import { CalendarView } from "@/components/CalendarView";
import { formatCurrency } from "@/lib/formatCurrency";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { toast } from "sonner";
import { Booking } from "@/components/BookingCard";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { getCurrentFinancialYear } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const Index = () => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [addBookingDialogOpen, setAddBookingDialogOpen] = useState(false);
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("all");
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);
  const [dismissedLinkNotifications, setDismissedLinkNotifications] = useState<string[]>(() => {
    const saved = localStorage.getItem('dismissedLinkNotifications');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchBookings();
    // Poll for updates every 30 seconds
    const interval = setInterval(fetchBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { credentials: 'include' });
      if (!res.ok) {
        toast.error("Failed to load bookings");
        return;
      }
      const data = await res.json();
      setBookings(data || []);
    } catch (err) {
      toast.error("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Financial years for filter
  const financialYears = Array.from(new Set(bookings.map(b => b.financial_year).filter(Boolean)));

  // Filter bookings by financial year
  const filteredBookings = selectedFinancialYear === "all"
    ? bookings
    : bookings.filter(b => b.financial_year === selectedFinancialYear);

  // Calculate stats from filtered bookings
  const totalBookings = filteredBookings.length;
  const totalParticipants = filteredBookings.reduce((sum, b) => sum + b.num_participants, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Show bookings ready for billing - only those that have reached or passed their end date
  const pendingBillsBookings = filteredBookings.filter(b => {
    const endDate = new Date(b.end_date);
    endDate.setHours(0, 0, 0, 0);
    // Only show if end date is today or in the past, and status is pending or complete
    return (b.status === 'pending' || b.status === 'complete') && endDate.getTime() <= today.getTime();
  });

  const paymentPendingBookings = filteredBookings.filter(b => b.status === 'payment_pending');

  // Link bookings that are still pending and haven't ended yet, excluding dismissed ones
  const linkBookings = filteredBookings.filter(b => {
    if (!b.booked_via_link || b.status !== 'pending') return false;
    if (dismissedLinkNotifications.includes(b.id)) return false; // Exclude dismissed
    const endDate = new Date(b.end_date);
    endDate.setHours(0, 0, 0, 0);
    // Only show if end date is in the future (not ready for billing yet)
    return endDate.getTime() > today.getTime();
  });

  // Check if any bookings ended today for red notification
  const hasBookingsEndingToday = pendingBillsBookings.some(b => {
    const endDate = new Date(b.end_date);
    endDate.setHours(0, 0, 0, 0);
    return endDate.getTime() === today.getTime();
  });

  const totalNotifications = pendingBillsBookings.length + paymentPendingBookings.length + linkBookings.length;

  // Auto-open notification dialog on every login if there are notifications
  useEffect(() => {
    if (!loading && totalNotifications > 0) {
      setNotificationDialogOpen(true);
    }
  }, [loading, totalNotifications]);

  const pendingBillsCount = pendingBillsBookings.length;
  const totalPendingBillAmount = paymentPendingBookings.reduce((sum, b) => sum + (b.total_bill_amount || 0), 0);

  // Calculate current accommodation usage (today)
  const accommodationToday = filteredBookings
    .filter(b => {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return b.needs_accommodation && start <= today && end >= today;
    })
    .reduce((sum, b) => sum + b.num_participants, 0);

  // Get next 3 upcoming programmes
  const now = new Date();
  const upcomingNext3 = filteredBookings
    .filter(b => {
      const start = new Date(b.start_date);
      return start > now;
    })
    .slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5">
        <AppSidebar onAddBooking={() => setAddBookingDialogOpen(true)} />

        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden" />
            <Separator orientation="vertical" className="h-6 md:hidden" />
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Outside Programme
                </h1>
                <p className="text-xs text-muted-foreground">ACSTI Kerala • Current FY: {getCurrentFinancialYear()}</p>
              </div>

              <Dialog open={notificationDialogOpen} onOpenChange={setNotificationDialogOpen}>
                <DialogTrigger asChild>
                  <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
                    <Bell className={`h-5 w-5 ${hasBookingsEndingToday ? 'text-red-500' : ''}`} />
                    {totalNotifications > 0 && (
                      <Badge className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${hasBookingsEndingToday ? 'bg-red-600' : ''}`}>
                        {totalNotifications}
                      </Badge>
                    )}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Notifications</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-6">
                    {/* Link Bookings */}
                    {linkBookings.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Link2 className="h-5 w-5 text-blue-500" />
                            Booking Request by Link ({linkBookings.length})
                          </h3>
                        </div>
                        <div className="space-y-2">
                          {linkBookings.map((booking) => (
                            <div key={booking.id} className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <div className="font-medium">{booking.department_agency}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                                  </div>
                                  <div className="text-sm mt-1">
                                    {booking.num_participants} participants
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => {
                                    // Add to dismissed list
                                    const updated = [...dismissedLinkNotifications, booking.id];
                                    setDismissedLinkNotifications(updated);
                                    localStorage.setItem('dismissedLinkNotifications', JSON.stringify(updated));
                                    toast.success('Notification dismissed');
                                  }}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pending Bills */}
                    {pendingBillsBookings.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <FileText className="h-5 w-5 text-yellow-500" />
                            Ready for billing ({pendingBillsBookings.length})
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/financial-track', { state: { tab: 'pending-bills' } })}
                          >
                            Go to Financial Track
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {pendingBillsBookings.map((booking) => (
                            <div key={booking.id} className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                              <div className="font-medium">{booking.department_agency}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                              </div>
                              <div className="text-sm mt-1">
                                {booking.num_participants} participants
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment Pending */}
                    {paymentPendingBookings.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            <IndianRupee className="h-5 w-5 text-red-500" />
                            Payment Pending ({paymentPendingBookings.length})
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate('/financial-track', { state: { tab: 'payment-pending' } })}
                          >
                            Go to Financial Track
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {paymentPendingBookings.map((booking) => (
                            <div key={booking.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                              <div className="font-medium">{booking.department_agency}</div>
                              <div className="text-sm text-muted-foreground">
                                Bill No: {booking.bill_no || 'N/A'}
                              </div>
                              <div className="text-sm font-semibold text-red-700 mt-1">
                                {formatCurrency(booking.total_bill_amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {totalNotifications === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending notifications</p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            {/* Financial Year Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Filter by Financial Year:</span>
              <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select FY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Financial Years</SelectItem>
                  {financialYears.map(fy => (
                    <SelectItem key={fy} value={fy!}>{fy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatsCard
                title="Total Bookings"
                value={totalBookings}
                icon={CalendarDays}
                description="Active facility reservations"
                colorVariant="blue"
              />
              <StatsCard
                title="Total Participants"
                value={totalParticipants}
                icon={Users}
                description="Across all bookings"
                colorVariant="purple"
              />
              <StatsCard
                title="Accommodation Today"
                value={accommodationToday}
                icon={Building2}
                description="Current occupancy"
                colorVariant="green"
              />
              <StatsCard
                title="Pending Bills"
                value={pendingBillsCount}
                icon={FileText}
                description="Awaiting billing"
                colorVariant="orange"
                onClick={() => navigate('/financial-track', { state: { tab: 'pending-bills' } })}
              />
              <StatsCard
                title="Pending Amount"
                value={formatCurrency(totalPendingBillAmount)}
                icon={IndianRupee}
                description="Payment pending"
                colorVariant="blue"
                onClick={() => navigate('/financial-track', { state: { tab: 'payment-pending' } })}
              />
            </div>

            {/* Upcoming Programmes - Next 3 */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Next 3 Upcoming Programmes
              </h2>
              {upcomingNext3.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-lg border border-border/50">
                  <p className="text-muted-foreground">No upcoming programmes scheduled</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {upcomingNext3.map((booking) => (
                    <div key={booking.id} className="p-5 rounded-xl shadow-md transition-all hover:scale-[1.02] hover:shadow-xl bg-gradient-to-br from-card to-primary/5 border border-border/50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                            {booking.department_agency}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-2 font-medium">
                            {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                          </p>
                          {booking.purpose && (
                            <p className="text-sm text-muted-foreground mt-1 italic">{booking.purpose}</p>
                          )}
                        </div>
                        <Badge className="bg-gradient-to-r from-primary to-secondary text-white shadow-md">{booking.num_participants} participants</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendar View */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Booking Calendar
                </h2>
              </div>
              <CalendarView bookings={filteredBookings} />
            </div>
          </main>
        </SidebarInset>

        <AddBookingDialog
          open={addBookingDialogOpen}
          onOpenChange={setAddBookingDialogOpen}
          onBookingAdded={fetchBookings}
        />
      </div>
    </SidebarProvider>
  );
};

export default Index;