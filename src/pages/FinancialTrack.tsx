import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Booking } from "@/components/BookingCard";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect as useReactEffect, useRef } from "react";
import { format } from "date-fns";
import { IndianRupee, Calendar, Users, FileText, Hash, RotateCcw } from "lucide-react";
import { getCurrentFinancialYear, cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/formatCurrency";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { Pencil } from "lucide-react";

const FinancialTrack = () => {
  const [completedBookings, setCompletedBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [billAmount, setBillAmount] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billedDate, setBilledDate] = useState("");
  const [numOfBills, setNumOfBills] = useState("1");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [activeTab, setActiveTab] = useState("pending-bills");
  const [isAdmin, setIsAdmin] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location]);

  useEffect(() => {
    fetchCompletedBookings();
    fetchUserRole();
    const interval = setInterval(fetchCompletedBookings, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const user = await res.json();
        setIsAdmin(user.role === 'admin');
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
    }
  };

  const fetchCompletedBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { credentials: 'include' });
      if (!res.ok) {
        toast.error("Failed to load completed bookings");
        setLoading(false);
        return;
      }
      const data = await res.json();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const completed = data.filter((b: Booking) => {
        const endDate = new Date(b.end_date);
        endDate.setHours(0, 0, 0, 0);

        // Include if status is payment related OR if matches ready for billing criteria (pending/complete + past end date)
        const isPaymentRelated = ['payment_completed', 'payment_pending'].includes(b.status);
        const isReadyForBilling = ['complete', 'pending'].includes(b.status) && endDate.getTime() <= today.getTime();

        return isPaymentRelated || isReadyForBilling;
      });
      setCompletedBookings(completed || []);
    } catch (err) {
      toast.error("Failed to load completed bookings");
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateBillAmount = async (bookingId: string) => {
    const amount = parseFloat(billAmount);
    const bills = parseInt(numOfBills);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!billNo.trim()) {
      toast.error("Please enter a bill number");
      return;
    }

    if (!billedDate) {
      toast.error("Please select a billed date");
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          total_bill_amount: amount,
          bill_no: billNo,
          billed_date: billedDate,
          num_of_bills: bills,
          status: 'payment_pending'
        }),
      });
      if (!res.ok) {
        toast.error("Failed to update bill details");
        return;
      }
      toast.success("Bill details updated and moved to Payment Pending");
      setEditingId(null);
      setBillAmount("");
      setBillNo("");
      setBilledDate("");
      setNumOfBills("1");
      await fetchCompletedBookings();
    } catch (err) {
      toast.error("Failed to update bill details");
      console.error(err);
    }
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        toast.error("Failed to update payment status");
        return;
      }
      toast.success("Payment status updated");
      fetchCompletedBookings();
    } catch (err) {
      toast.error("Failed to update payment status");
      console.error(err);
    }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedBooking(undefined);
  };

  // Mobile swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      const tabs = ["pending-bills", "payment-pending", "payment-completed"];
      const currentIndex = tabs.indexOf(activeTab);

      if (diff > 0 && currentIndex < tabs.length - 1) {
        // Swiped left - next tab
        setActiveTab(tabs[currentIndex + 1]);
      } else if (diff < 0 && currentIndex > 0) {
        // Swiped right - previous tab
        setActiveTab(tabs[currentIndex - 1]);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading financial data...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-background via-background to-secondary/5">
        <AppSidebar />

        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden" />
            <Separator orientation="vertical" className="h-6 md:hidden" />
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Financial Track
                </h1>
                <p className="text-xs text-muted-foreground">Manage billing and payments • Current FY: {getCurrentFinancialYear()}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Vertical Tab Menu */}
              <div className="md:w-64 flex-shrink-0 md:sticky md:top-20">
                <div className="bg-card rounded-xl border border-border/50 p-2 shadow-sm">
                  <TabsList className="flex flex-col w-full h-auto bg-transparent gap-2 items-stretch">
                    <TabsTrigger
                      value="pending-bills"
                      className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-muted flex items-center justify-start gap-3 py-4 px-4 w-full"
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-left flex-1">Ready for Billing</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment-pending"
                      className="data-[state=active]:bg-orange-500 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-muted flex items-center justify-start gap-3 py-4 px-4 w-full"
                    >
                      <IndianRupee className="h-5 w-5" />
                      <span className="text-left flex-1">Payment Pending</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="payment-completed"
                      className="data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-200 hover:bg-muted flex items-center justify-start gap-3 py-4 px-4 w-full"
                    >
                      <Badge className="h-5 w-5" />
                      <span className="text-left flex-1">Payment Completed</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Tab Content Container */}
              <div
                ref={tabsRef}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="flex-1 touch-pan-y"
              >

                {/* Ready for billing Tab */}
                <TabsContent value="pending-bills" className="space-y-6">
                  {completedBookings.filter(b => ['complete', 'pending'].includes(b.status)).length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border/50 shadow-lg">
                      <p className="text-muted-foreground">No bookings ready for billing</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {completedBookings.filter(b => ['complete', 'pending'].includes(b.status)).map((booking) => (
                        <Card key={booking.id} className="border-l-4 border-l-yellow-400 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-yellow-50/50 dark:to-yellow-950/20">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                              <div className="w-full sm:w-auto">
                                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
                                  {booking.department_agency}
                                </CardTitle>
                                <div className="flex flex-col sm:flex-row gap-3 mt-3 text-sm">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium">{format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="h-4 w-4 text-yellow-600" />
                                    <span className="font-medium">{booking.num_participants} participants</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 items-start sm:items-end">
                                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 shadow-md">Ready for billing</Badge>
                                {booking.financial_year && <Badge variant="outline" className="font-semibold">{booking.financial_year}</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {editingId === booking.id ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`bill-amount-${booking.id}`}>Total Bill Amount (₹)</Label>
                                  <Input
                                    id={`bill-amount-${booking.id}`}
                                    type="number"
                                    value={billAmount}
                                    onChange={(e) => setBillAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`bill-no-${booking.id}`}>Bill Number</Label>
                                  <Input
                                    id={`bill-no-${booking.id}`}
                                    type="text"
                                    value={billNo}
                                    onChange={(e) => setBillNo(e.target.value)}
                                    placeholder="Enter bill number"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`billed-date-${booking.id}`}>Billed Date</Label>
                                  <Input
                                    id={`billed-date-${booking.id}`}
                                    type="date"
                                    value={billedDate}
                                    onChange={(e) => setBilledDate(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`num-bills-${booking.id}`}>Number of Bills</Label>
                                  <Input
                                    id={`num-bills-${booking.id}`}
                                    type="number"
                                    value={numOfBills}
                                    onChange={(e) => setNumOfBills(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button onClick={() => handleUpdateBillAmount(booking.id)} className="w-full sm:w-auto">Save Bill Details</Button>
                                  <Button variant="outline" onClick={() => {
                                    setEditingId(null);
                                    setBillAmount("");
                                    setBillNo("");
                                    setBilledDate("");
                                    setNumOfBills("1");
                                  }} className="w-full sm:w-auto">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <Button variant="outline" size="sm" onClick={() => {
                                setEditingId(booking.id);
                                setBillAmount(booking.total_bill_amount?.toString() || "");
                                setBillNo(booking.bill_no || "");
                                setBilledDate(booking.billed_date ? format(new Date(booking.billed_date), "yyyy-MM-dd") : "");
                                setNumOfBills(booking.num_of_bills?.toString() || "1");
                              }}>
                                Set Bill Details
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Payment Pending Tab */}
                <TabsContent value="payment-pending" className="space-y-6">
                  {completedBookings.filter(b => b.status === 'payment_pending').length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border/50 shadow-lg">
                      <p className="text-muted-foreground">No pending payments</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {completedBookings.filter(b => b.status === 'payment_pending').map((booking) => (
                        <Card key={booking.id} className="border-l-4 border-l-destructive shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-red-50/50 dark:to-red-950/20">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                              <div className="w-full sm:w-auto">
                                <CardTitle className="text-lg sm:text-xl bg-gradient-to-r from-destructive to-orange-600 bg-clip-text text-transparent">
                                  {booking.department_agency}
                                </CardTitle>
                                <div className="flex flex-col sm:flex-row gap-3 mt-3 text-sm">
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar className="h-4 w-4 text-destructive" />
                                    <span className="font-medium">{format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users className="h-4 w-4 text-destructive" />
                                    <span className="font-medium">{booking.num_participants} participants</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 items-start sm:items-end">
                                <Badge variant="destructive" className="shadow-md">Payment Pending</Badge>
                                {booking.financial_year && <Badge variant="outline" className="font-semibold">{booking.financial_year}</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {editingId === booking.id ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`bill-amount-${booking.id}`}>Total Bill Amount (₹)</Label>
                                  <Input
                                    id={`bill-amount-${booking.id}`}
                                    type="number"
                                    value={billAmount}
                                    onChange={(e) => setBillAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`bill-no-${booking.id}`}>Bill Number</Label>
                                  <Input
                                    id={`bill-no-${booking.id}`}
                                    type="text"
                                    value={billNo}
                                    onChange={(e) => setBillNo(e.target.value)}
                                    placeholder="Enter bill number"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`billed-date-${booking.id}`}>Billed Date</Label>
                                  <Input
                                    id={`billed-date-${booking.id}`}
                                    type="date"
                                    value={billedDate}
                                    onChange={(e) => setBilledDate(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`num-bills-${booking.id}`}>Number of Bills</Label>
                                  <Input
                                    id={`num-bills-${booking.id}`}
                                    type="number"
                                    value={numOfBills}
                                    onChange={(e) => setNumOfBills(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button onClick={() => handleUpdateBillAmount(booking.id)} className="w-full sm:w-auto">Save Bill Details</Button>
                                  <Button variant="outline" onClick={() => {
                                    setEditingId(null);
                                    setBillAmount("");
                                    setBillNo("");
                                    setBilledDate("");
                                    setNumOfBills("1");
                                  }} className="w-full sm:w-auto">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{formatCurrency(booking.total_bill_amount)}</span>
                                  </div>
                                  {booking.bill_no && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span>Bill: {booking.bill_no}</span>
                                    </div>
                                  )}
                                  {booking.billed_date && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>Billed: {format(new Date(booking.billed_date), "MMM dd, yyyy")}</span>
                                    </div>
                                  )}
                                  {booking.num_of_bills && (
                                    <div className="flex items-center gap-2">
                                      <Hash className="h-4 w-4 text-muted-foreground" />
                                      <span>{booking.num_of_bills} bill(s)</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleUpdateStatus(booking.id, 'payment_completed')}
                                  >
                                    Mark Payment Completed
                                  </Button>
                                  {isAdmin && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleUpdateStatus(booking.id, 'pending')}
                                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                                      >
                                        <RotateCcw className="h-4 w-4 mr-1" />
                                        Revert to Ready for Billing
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          setEditingId(booking.id);
                                          setBillAmount(booking.total_bill_amount?.toString() || "");
                                          setBillNo(booking.bill_no || "");
                                          setBilledDate(booking.billed_date ? format(new Date(booking.billed_date), "yyyy-MM-dd") : "");
                                          setNumOfBills(booking.num_of_bills?.toString() || "1");
                                        }}
                                      >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit Bill
                                      </Button>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(booking)}
                                      >
                                        <Pencil className="h-4 w-4 mr-1" />
                                        Edit Booking
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Payment Completed Tab */}
                <TabsContent value="payment-completed" className="space-y-6">
                  {completedBookings.filter(b => b.status === 'payment_completed').length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border/50 shadow-lg">
                      <p className="text-muted-foreground">No completed payments yet</p>
                    </div>
                  ) : (
                    <div className="grid gap-6">
                      {completedBookings.filter(b => b.status === 'payment_completed').map((booking) => (
                        <Card key={booking.id} className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-green-50/50 dark:to-green-950/20">
                          <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                              <div className="w-full sm:w-auto">
                                <CardTitle className="text-base sm:text-lg">{booking.department_agency}</CardTitle>
                                <div className="flex flex-col sm:flex-row gap-2 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {booking.num_participants} participants
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-row sm:flex-col gap-2 items-start sm:items-end">
                                <Badge className="bg-green-600">Payment Completed</Badge>
                                {booking.financial_year && <Badge variant="outline">{booking.financial_year}</Badge>}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {editingId === booking.id ? (
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`bill-amount-${booking.id}`}>Total Bill Amount (₹)</Label>
                                  <Input
                                    id={`bill-amount-${booking.id}`}
                                    type="number"
                                    value={billAmount}
                                    onChange={(e) => setBillAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`bill-no-${booking.id}`}>Bill Number</Label>
                                  <Input
                                    id={`bill-no-${booking.id}`}
                                    type="text"
                                    value={billNo}
                                    onChange={(e) => setBillNo(e.target.value)}
                                    placeholder="Enter bill number"
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`billed-date-${booking.id}`}>Billed Date</Label>
                                  <Input
                                    id={`billed-date-${booking.id}`}
                                    type="date"
                                    value={billedDate}
                                    onChange={(e) => setBilledDate(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor={`num-bills-${booking.id}`}>Number of Bills</Label>
                                  <Input
                                    id={`num-bills-${booking.id}`}
                                    type="number"
                                    value={numOfBills}
                                    onChange={(e) => setNumOfBills(e.target.value)}
                                    placeholder="1"
                                    min="1"
                                  />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2">
                                  <Button onClick={() => handleUpdateBillAmount(booking.id)} className="w-full sm:w-auto">Save Bill Details</Button>
                                  <Button variant="outline" onClick={() => {
                                    setEditingId(null);
                                    setBillAmount("");
                                    setBillNo("");
                                    setBilledDate("");
                                    setNumOfBills("1");
                                  }} className="w-full sm:w-auto">Cancel</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-center gap-2">
                                    <IndianRupee className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-semibold">{formatCurrency(booking.total_bill_amount)}</span>
                                  </div>
                                  {booking.bill_no && (
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-muted-foreground" />
                                      <span>Bill: {booking.bill_no}</span>
                                    </div>
                                  )}
                                  {booking.billed_date && (
                                    <div className="flex items-center gap-2">
                                      <Calendar className="h-4 w-4 text-muted-foreground" />
                                      <span>Billed: {format(new Date(booking.billed_date), "MMM dd, yyyy")}</span>
                                    </div>
                                  )}
                                  {booking.num_of_bills && (
                                    <div className="flex items-center gap-2">
                                      <Hash className="h-4 w-4 text-muted-foreground" />
                                      <span>{booking.num_of_bills} bill(s)</span>
                                    </div>
                                  )}
                                </div>
                                {isAdmin && (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleUpdateStatus(booking.id, 'payment_pending')}
                                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 border-yellow-200"
                                    >
                                      <RotateCcw className="h-4 w-4 mr-1" />
                                      Revert to Payment Pending
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setEditingId(booking.id);
                                        setBillAmount(booking.total_bill_amount?.toString() || "");
                                        setBillNo(booking.bill_no || "");
                                        setBilledDate(booking.billed_date ? format(new Date(booking.billed_date), "yyyy-MM-dd") : "");
                                        setNumOfBills(booking.num_of_bills?.toString() || "1");
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      Edit Bill
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(booking)}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      Edit Booking
                                    </Button>
                                  </div>
                                )}
                              </>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>
          </main>
        </SidebarInset>

        <AddBookingDialog
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          onBookingAdded={fetchCompletedBookings}
          booking={selectedBooking}
        />
      </div>
    </SidebarProvider>
  );
};

export default FinancialTrack;