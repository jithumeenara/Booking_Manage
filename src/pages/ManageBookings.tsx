import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BookingCard, Booking } from "@/components/BookingCard";
import { AddBookingDialog } from "@/components/AddBookingDialog";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Filter, LayoutGrid, Table as TableIcon, Phone, Building, Layers, Users, Utensils, BedDouble, Presentation, LogOut } from "lucide-react";
import { format } from "date-fns";
import { cn, getCurrentFinancialYear } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const ManageBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();

  // View & Filter State
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("all");
  const [selectedBookedBy, setSelectedBookedBy] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  // Dialog States
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [bookingToAllocate, setBookingToAllocate] = useState<Booking | undefined>();

  // Details State
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | undefined>();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        setBookings(data);

        // Update bookingToAllocate if it exists, so the dialog reflects changes immediately
        if (bookingToAllocate) {
          const updatedBooking = data.find((b: Booking) => b.id === bookingToAllocate.id);
          if (updatedBooking) {
            setBookingToAllocate(updatedBooking);
          }
        }
      } else {
        toast.error("Failed to fetch bookings");
      }
    } catch (error) {
      toast.error("Error fetching bookings");
    } finally {
      setLoading(false);
    }
  };

  // ... (lines 81-567 ignored/unchanged)

  {
    bookingToAllocate && (
      <BookingAllocationDialog
        open={allocateDialogOpen}
        onOpenChange={setAllocateDialogOpen}
        booking={bookingToAllocate}
        onAllocated={fetchBookings}
      />
    )
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Booking cancelled successfully");
        fetchBookings();
      } else {
        toast.error("Failed to cancel booking");
      }
    } catch (error) {
      toast.error("Error cancelling booking");
    }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setEditDialogOpen(open);
    if (!open) setSelectedBooking(undefined);
  };

  const handleMarkComplete = async (booking: Booking) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: 'complete' })
      });

      if (res.ok) {
        toast.success("Booking marked as ready for billing");
        fetchBookings();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    }
  };

  const handleAllocate = (booking: Booking) => {
    setBookingToAllocate(booking);
    setAllocateDialogOpen(true);
  };

  // Derived State for Filters
  const departments = Array.from(new Set(bookings.map(b => b.department_agency))).sort();
  // Generate financial years from bookings data, or default to current
  const financialYears = Array.from(new Set(bookings.map(b => {
    // logical guess: get FY from start_date
    const date = new Date(b.start_date);
    const year = date.getFullYear();
    const month = date.getMonth(); // 0-11
    // India FY: Apr-Mar. If month < 3 (Jan-Mar), FY is (year-1)-year. Else year-(year+1)
    const startYear = month < 3 ? year - 1 : year;
    return `${startYear}-${startYear + 1}`;
  }))).sort().reverse();
  if (financialYears.length === 0) {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    financialYears.push(`${startYear}-${startYear + 1}`);
  }

  const filteredBookings = bookings.filter(booking => {
    const start = new Date(booking.start_date);

    // Month Filter
    if (selectedMonth !== "all" && start.getMonth().toString() !== selectedMonth) return false;

    // Department Filter
    if (selectedDepartment !== "all" && booking.department_agency !== selectedDepartment) return false;

    // FY Filter
    if (selectedFinancialYear !== "all") {
      const year = start.getFullYear();
      const month = start.getMonth();
      const bookingFY = month < 3 ? `${year - 1}-${year}` : `${year}-${year + 1}`;
      if (bookingFY !== selectedFinancialYear) return false;
    }

    // Booked By Filter
    if (selectedBookedBy !== "all") {
      const isLink = !!booking.booked_via_link;
      if (selectedBookedBy === 'link' && !isLink) return false;
      if (selectedBookedBy === 'manual' && isLink) return false;
    }

    // Date Range Filter
    if (fromDate && new Date(booking.start_date) < fromDate) return false;
    if (toDate && new Date(booking.end_date) > toDate) return false; // Simple overlap check logic could be more complex but this fits strict range

    return true;
  });

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full bg-gradient-to-br from-green-50/50 via-yellow-50/30 to-lime-50/40 dark:from-gray-900 dark:via-green-900/20 dark:to-yellow-900/20" style={{
        background: 'linear-gradient(135deg, rgba(240, 253, 244, 0.4), rgba(254, 252, 232, 0.3), rgba(247, 254, 231, 0.4))'
      }}>
        <AppSidebar onAddBooking={() => setEditDialogOpen(true)} />

        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="md:hidden" />
            <Separator orientation="vertical" className="h-6 md:hidden" />
            <div className="flex items-center justify-between flex-1">
              <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Manage Bookings
                </h1>
                <p className="text-xs text-muted-foreground">ACSTI Kerala - View and manage all bookings</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 p-6 space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    All Bookings
                  </h2>
                  <p className="text-muted-foreground mt-1">
                    {filteredBookings.length} of {bookings.length} bookings • Current FY: {getCurrentFinancialYear()}
                  </p>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
                  <Button
                    variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewMode('table')}
                  >
                    <TableIcon className="h-4 w-4 mr-1.5" />
                    Table
                  </Button>
                  <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="sm"
                    className="h-8 px-2"
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="h-4 w-4 mr-1.5" />
                    Grid
                  </Button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>

                {/* Month Filter */}
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    <SelectItem value="0">January</SelectItem>
                    <SelectItem value="1">February</SelectItem>
                    <SelectItem value="2">March</SelectItem>
                    <SelectItem value="3">April</SelectItem>
                    <SelectItem value="4">May</SelectItem>
                    <SelectItem value="5">June</SelectItem>
                    <SelectItem value="6">July</SelectItem>
                    <SelectItem value="7">August</SelectItem>
                    <SelectItem value="8">September</SelectItem>
                    <SelectItem value="9">October</SelectItem>
                    <SelectItem value="10">November</SelectItem>
                    <SelectItem value="11">December</SelectItem>
                  </SelectContent>
                </Select>

                {/* Department Filter */}
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Financial Year Filter */}
                <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select FY" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All FY</SelectItem>
                    {financialYears.map(fy => (
                      <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Booked By Filter */}
                <Select value={selectedBookedBy} onValueChange={setSelectedBookedBy}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Booked By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Methods</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="link">Link</SelectItem>
                  </SelectContent>
                </Select>

                {/* From Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !fromDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fromDate ? format(fromDate, "PPP") : "From date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fromDate}
                      onSelect={setFromDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* To Date */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[180px] justify-start text-left font-normal",
                        !toDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {toDate ? format(toDate, "PPP") : "To date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={toDate}
                      onSelect={setToDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Clear Filters */}
                {(selectedMonth !== "all" || selectedDepartment !== "all" || selectedFinancialYear !== "all" || fromDate || toDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedMonth("all");
                      setSelectedDepartment("all");
                      setSelectedFinancialYear("all");
                      setFromDate(undefined);
                      setToDate(undefined);
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-card to-muted/20 rounded-xl border border-border/50 shadow-lg">
                <p className="text-muted-foreground mb-4">
                  {bookings.length === 0 ? "No bookings found" : "No bookings match the selected filters"}
                </p>
                {bookings.length === 0 && (
                  <Link to="/">
                    <Button className="bg-gradient-to-r from-primary to-primary/80">Go to Dashboard</Button>
                  </Link>
                )}
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={booking.id}
                    booking={booking}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onMarkComplete={handleMarkComplete}
                    onAllocate={handleAllocate}
                    showCompleteButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <Table className="border-separate border-spacing-y-3">
                  <TableHeader className="bg-transparent">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="w-[30%] pl-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Department / Agency</TableHead>
                      <TableHead className="w-[180px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Contact</TableHead>
                      <TableHead className="w-[180px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Schedule</TableHead>
                      <TableHead className="w-[100px] text-center text-xs uppercase tracking-wider font-semibold text-muted-foreground">Part.</TableHead>
                      <TableHead className="w-[150px] text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="w-[100px] text-right pr-6 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const isPastEndDate = new Date(booking.end_date) < new Date();
                      const canMarkComplete = isPastEndDate && booking.status === 'pending';

                      return (
                        <TableRow
                          key={booking.id}
                          className="group bg-card hover:bg-muted/20 transition-all duration-300 shadow-sm hover:shadow-md border-transparent relative hover:translate-x-1"
                          style={{ borderRadius: "12px" }}
                        >
                          <TableCell className="font-medium py-5 pl-6 rounded-l-xl relative overflow-hidden align-top">
                            {/* Decorative left strip using primary color */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${booking.status === 'complete' ? 'bg-yellow-400' :
                              booking.status === 'payment_completed' ? 'bg-green-500' :
                                booking.status === 'payment_pending' ? 'bg-red-500' :
                                  'bg-primary'
                              }`}></div>

                            <div className="flex flex-col gap-1.5 ml-2">
                              <span
                                className="text-lg font-bold text-foreground tracking-tight cursor-pointer hover:underline hover:text-primary transition-colors"
                                onClick={() => setSelectedBookingForDetails(booking)}
                              >
                                {booking.department_agency}
                              </span>
                              {!!booking.booked_via_link && (
                                <Badge variant="outline" className="w-fit text-[10px] bg-sky-50 text-sky-700 border-sky-200 px-2 py-0.5 rounded-full font-medium shadow-none">
                                  Via Link
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-semibold text-foreground/90">{booking.contact_person_name}</span>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 w-fit px-2 py-1 rounded-md">
                                <Phone className="h-3 w-3" />
                                <span className="font-mono">{booking.contact_person_phone}</span>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <div className="text-sm font-medium text-foreground/80">
                              {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                            </div>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <div className="text-center">
                              <span className="font-medium text-foreground/90">{booking.num_participants}</span>
                              <span className="text-muted-foreground text-xs ml-1">pax</span>
                            </div>
                          </TableCell>

                          <TableCell className="py-5 align-top">
                            <div className="flex flex-col gap-2 items-start">
                              {booking.status === 'complete' && (
                                <Link to="/financial-track" state={{ tab: 'pending-bills' }}>
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 shadow-sm">Ready for Billing</Badge>
                                </Link>
                              )}
                              {booking.status === 'payment_completed' && <Badge className="bg-green-100 text-green-800 border-green-200 shadow-sm">Paid & Closed</Badge>}
                              {booking.status === 'payment_pending' && (
                                <Link to="/financial-track" state={{ tab: 'payment-pending' }}>
                                  <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200 hover:bg-red-200 shadow-sm whitespace-nowrap">Payment Pending</Badge>
                                </Link>
                              )}
                              {booking.status === 'pending' && <Badge variant="secondary" className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium border-slate-200">Pending Review</Badge>}

                              {!!booking.needs_training_hall && (
                                <>
                                  {booking.allocated_halls && booking.allocated_halls.length > 0 && Array.isArray(booking.allocated_halls) && booking.allocated_halls[0] && booking.allocated_halls[0].id ? (
                                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 font-semibold w-fit max-w-full text-left leading-tight py-1">
                                      {booking.allocated_halls.map((h: any) => h.code || h.name).join(', ')}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 w-full justify-center">
                                      Hall Not Allocated
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="text-right py-5 pr-6 rounded-r-xl align-top">
                            <div className="flex justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                              {!!booking.needs_training_hall && booking.status === 'pending' && (
                                <Button variant="ghost" size="icon" className="h-9 w-9 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full transition-colors" onClick={() => handleAllocate(booking)} title="Allocate Hall">
                                  <Building className="h-4 w-4" />
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(booking)}
                                  className="h-9 w-9 bg-muted/50 hover:bg-primary hover:text-primary-foreground rounded-full transition-colors ml-1"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canMarkComplete && (
                                <Button
                                  className="bg-yellow-400 text-yellow-900 override:outline-none hover:bg-yellow-500 h-9 rounded-full px-4 text-xs font-bold shadow-sm"
                                  size="sm"
                                  onClick={() => handleMarkComplete(booking)}
                                >
                                  Ready
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive/50 hover:text-destructive hover:bg-destructive/10 rounded-full ml-1">
                                      <Trash2 className="h-4 w-4" />
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
                                      <AlertDialogAction onClick={() => handleDelete(booking.id)} className="bg-destructive hover:bg-destructive/90">
                                        Cancel Booking
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </main>
        </SidebarInset>

        <AddBookingDialog
          open={editDialogOpen}
          onOpenChange={handleDialogClose}
          onBookingAdded={fetchBookings}
          booking={selectedBooking}
        />

        {bookingToAllocate && (
          <BookingAllocationDialog
            open={allocateDialogOpen}
            onOpenChange={setAllocateDialogOpen}
            booking={bookingToAllocate}
            onAllocated={fetchBookings}
          />
        )}

        {selectedBookingForDetails && (
          <Dialog open={!!selectedBookingForDetails} onOpenChange={(open) => !open && setSelectedBookingForDetails(undefined)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                      {selectedBookingForDetails.department_agency}
                      {selectedBookingForDetails.status === 'complete' && <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Ready</Badge>}
                      {selectedBookingForDetails.status === 'payment_completed' && <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Paid</Badge>}
                      {selectedBookingForDetails.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      Booking ID: {selectedBookingForDetails.id.substring(0, 8)}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                {/* Contact Info */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
                  <h3 className="font-semibold text-primary flex items-center gap-2">
                    <Users className="h-4 w-4" /> Contact Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Name:</span>
                      <span className="col-span-2 font-medium">{selectedBookingForDetails.contact_person_name}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="col-span-2 font-medium">{selectedBookingForDetails.contact_person_phone}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Email:</span>
                      <span className="col-span-2 font-medium break-all">{selectedBookingForDetails.contact_person_email}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl">
                  <h3 className="font-semibold text-primary flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" /> Schedule
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Start:</span>
                      <span className="col-span-2 font-medium">{format(new Date(selectedBookingForDetails.start_date), "MMMM dd, yyyy")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">End:</span>
                      <span className="col-span-2 font-medium">{format(new Date(selectedBookingForDetails.end_date), "MMMM dd, yyyy")}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="col-span-2 font-medium">
                        {Math.ceil((new Date(selectedBookingForDetails.end_date).getTime() - new Date(selectedBookingForDetails.start_date).getTime()) / (1000 * 60 * 60 * 24)) + 1} Days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="space-y-3 bg-muted/30 p-4 rounded-xl col-span-1 md:col-span-2">
                  <h3 className="font-semibold text-primary flex items-center gap-2">
                    <Layers className="h-4 w-4" /> Requirements & Facilities
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-background p-3 rounded-lg border text-center group hover:border-primary/50 transition-colors">
                      <span className="block text-muted-foreground text-xs mb-1 flex items-center justify-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Participants
                      </span>
                      <span className="font-bold text-lg">{selectedBookingForDetails.num_participants}</span>
                    </div>
                    <div className="bg-background p-3 rounded-lg border text-center group hover:border-primary/50 transition-colors">
                      <span className="block text-muted-foreground text-xs mb-1 flex items-center justify-center gap-1.5">
                        <BedDouble className="h-3.5 w-3.5" /> Accomm.
                      </span>
                      <span className={`font-bold ${selectedBookingForDetails.needs_accommodation ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {selectedBookingForDetails.needs_accommodation ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="bg-background p-3 rounded-lg border text-center group hover:border-primary/50 transition-colors">
                      <span className="block text-muted-foreground text-xs mb-1 flex items-center justify-center gap-1.5">
                        <Utensils className="h-3.5 w-3.5" /> Food
                      </span>
                      <span className={`font-bold ${selectedBookingForDetails.needs_food ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {selectedBookingForDetails.needs_food ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="bg-background p-3 rounded-lg border text-center group hover:border-primary/50 transition-colors">
                      <span className="block text-muted-foreground text-xs mb-1 flex items-center justify-center gap-1.5">
                        <Presentation className="h-3.5 w-3.5" /> Hall Req.
                      </span>
                      <span className={`font-bold ${selectedBookingForDetails.needs_training_hall ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {selectedBookingForDetails.needs_training_hall ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Purpose */}
                {selectedBookingForDetails.purpose && (
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <h3 className="font-semibold text-primary text-sm">Program Purpose / Description</h3>
                    <p className="text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border">
                      {selectedBookingForDetails.purpose}
                    </p>
                  </div>
                )}

                {/* Allocation Details */}
                {selectedBookingForDetails.allocated_halls && selectedBookingForDetails.allocated_halls.length > 0 && Array.isArray(selectedBookingForDetails.allocated_halls) && selectedBookingForDetails.allocated_halls[0] && selectedBookingForDetails.allocated_halls[0].id && (
                  <div className="col-span-1 md:col-span-2">
                    <h3 className="font-semibold text-primary text-sm mb-2">Allocated Halls</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedBookingForDetails.allocated_halls.map((h: any) => (
                        <div key={h.id} className="flex items-center gap-2 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-full text-primary font-medium text-sm">
                          <Building className="h-3 w-3" />
                          {h.name} <span className="text-primary/60 text-xs">({h.code})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 mt-2">
                <Button variant="outline" onClick={() => setSelectedBookingForDetails(undefined)}>Close</Button>
                {selectedBookingForDetails.status === 'pending' && (
                  <Button onClick={() => {
                    handleEdit(selectedBookingForDetails);
                    setSelectedBookingForDetails(undefined);
                  }}>Edit Booking</Button>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </SidebarProvider>
  );
};

// Booking Allocation Dialog Implementation
function BookingAllocationDialog({ open, onOpenChange, booking, onAllocated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: Booking;
  onAllocated: () => void;
}) {
  const [halls, setHalls] = useState<any[]>([]);
  const [occupiedHallIds, setOccupiedHallIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchHalls();
      fetchAvailability();
    }
  }, [open]);

  const fetchHalls = async () => {
    try {
      const res = await fetch('/api/training-halls?activeOnly=true');
      if (res.ok) {
        const data = await res.json();
        // Sort halls by code/name
        const sortedData = data.sort((a: any, b: any) => {
          const valA = a.code || a.name || "";
          const valB = b.code || b.name || "";
          return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        });
        setHalls(sortedData);
      }
    } catch (error) {
      toast.error("Failed to fetch halls");
    }
  };

  const fetchAvailability = async () => {
    try {
      const res = await fetch(`/api/training-halls/availability?startDate=${booking.start_date}&endDate=${booking.end_date}&excludeBookingId=${booking.id}`);
      if (res.ok) {
        const data = await res.json();
        setOccupiedHallIds(data.occupiedHallIds || []);
      }
    } catch (error) {
      console.error("Failed to check availability");
    }
  }

  const handleAllocate = async (hallId: string) => {
    const allowedHalls = booking.number_of_halls || 1;
    const currentAllocated = booking.allocated_halls ? booking.allocated_halls.length : 0;

    if (currentAllocated >= allowedHalls) {
      toast.error(`Cannot allocate more than ${allowedHalls} hall(s) for this booking.`);
      return;
    }

    // Prevent allocating if busy
    if (occupiedHallIds.includes(hallId)) {
      toast.error("This hall is already allocated for the selected dates.");
      return;
    }

    try {
      const res = await fetch(`/api/bookings/${booking.id}/halls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hall_id: hallId })
      });

      if (res.ok) {
        toast.success("Hall allocated successfully");
        onAllocated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to allocate hall");
      }
    } catch (error) {
      toast.error("Error allocating hall");
    }
  };

  const handleDeallocate = async (hallId: string) => {
    // Optimistic check: if not allocated, do nothing (though UI shouldn't allow it)
    if (!booking.allocated_halls?.some((h: any) => h.id === hallId)) return;

    try {
      const res = await fetch(`/api/training-halls/${hallId}/allocations/${booking.id}`, {
        method: "DELETE"
      });

      if (res.ok) {
        toast.success("Hall deallocated successfully");
        onAllocated();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to deallocate hall");
      }
    } catch (error) {
      toast.error("Error deallocating hall");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Allocate Hall for {booking.department_agency}</DialogTitle>
          <DialogDescription>
            Select a training hall.
            <span className="block mt-1 text-xs">
              Needed: <strong>{booking.number_of_halls || 1}</strong> hall(s).
              Currently Allocated: <strong>{booking.allocated_halls ? booking.allocated_halls.length : 0}</strong>.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2 max-h-[60vh] overflow-y-auto p-1">
          {halls.map(hall => {
            const isAllocated = booking.allocated_halls?.some((h: any) => h.id === hall.id);
            const isOccupied = occupiedHallIds.includes(hall.id);

            return (
              <div
                key={hall.id}
                className={cn(
                  "border p-3 rounded-md transition-all flex flex-col gap-2 relative group",
                  isAllocated
                    ? "bg-green-50 border-green-200 shadow-sm"
                    : isOccupied
                      ? "bg-red-50/80 border-red-100 opacity-60 cursor-not-allowed"
                      : "hover:bg-muted/50 cursor-pointer hover:border-primary/30 hover:shadow-sm bg-card"
                )}
                onClick={() => !isOccupied && !isAllocated && handleAllocate(hall.id)}
              >
                <div className="flex justify-between items-start">
                  <span className={cn("font-semibold text-sm truncate", isAllocated ? "text-green-800" : "")}>{hall.name}</span>
                  {isAllocated && (
                    <Badge className="bg-green-200 text-green-800 hover:bg-green-200 h-5 text-[10px] px-1.5 shadow-none border-green-300">
                      Allocated
                    </Badge>
                  )}
                  {!isAllocated && hall.is_active && !isOccupied && <span className="h-2 w-2 rounded-full bg-green-500 shrink-0 mt-1"></span>}
                  {isOccupied && <span className="text-[10px] text-red-500 font-medium leading-none mt-1">Booked</span>}
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    <span>{hall.floor || "Unassigned"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{hall.capacity}</span>
                  </div>
                </div>

                {isAllocated ? (
                  <Button
                    size="sm"
                    className="mt-1 w-full h-7 text-xs bg-white text-destructive border border-destructive/20 hover:bg-destructive/10 hover:border-destructive/30 shadow-sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeallocate(hall.id);
                    }}
                  >
                    <LogOut className="h-3 w-3 mr-1.5" /> Leave
                  </Button>
                ) : !isOccupied && (
                  <Button size="sm" className="mt-1 w-full h-7 text-xs" variant="secondary">
                    Allocate
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ManageBookings;
