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
import { Calendar as CalendarIcon, Filter, LayoutGrid, Table as TableIcon, Phone, Building, Layers, Users } from "lucide-react";
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

  // Allocation State
  const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
  const [bookingToAllocate, setBookingToAllocate] = useState<Booking | undefined>();

  // Filter states
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("all");
  const [selectedBookedBy, setSelectedBookedBy] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  useEffect(() => {
    // Set default view based on screen size
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('grid');
      } else {
        setViewMode('table');
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchBookings();
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
      toast.error("Failed to load bookings");
      console.error(err);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) {
        toast.error("Failed to cancel booking");
        return;
      }
      toast.success("Booking cancelled successfully");
      fetchBookings();
    } catch (err) {
      toast.error("Failed to cancel booking");
      console.error(err);
    }
  };

  const handleEdit = (booking: Booking) => {
    // Allow editing even if payment is completed
    setSelectedBooking(booking);
    setEditDialogOpen(true);
  };

  const handleAllocate = (booking: Booking) => {
    setBookingToAllocate(booking);
    setAllocateDialogOpen(true);
  };

  const handleDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedBooking(undefined);
  };

  // Get unique departments and financial years for filter
  const departments = Array.from(new Set(bookings.map(b => b.department_agency)));
  const financialYears = Array.from(new Set(bookings.map(b => b.financial_year).filter(Boolean)));

  // Filter bookings
  const filteredBookings = bookings.filter(booking => {
    // Month filter
    if (selectedMonth !== "all") {
      const bookingMonth = new Date(booking.start_date).getMonth();
      if (bookingMonth !== parseInt(selectedMonth)) return false;
    }

    // Department filter
    if (selectedDepartment !== "all" && booking.department_agency !== selectedDepartment) {
      return false;
    }

    // Financial Year filter
    if (selectedFinancialYear !== "all" && booking.financial_year !== selectedFinancialYear) {
      return false;
    }

    // Booked By filter
    if (selectedBookedBy !== "all") {
      if (selectedBookedBy === "link" && !booking.booked_via_link) return false;
      if (selectedBookedBy === "manual" && booking.booked_via_link) return false;
    }

    // Date range filter
    if (fromDate) {
      const bookingStart = new Date(booking.start_date);
      if (bookingStart < fromDate) return false;
    }
    if (toDate) {
      const bookingStart = new Date(booking.start_date);
      if (bookingStart > toDate) return false;
    }

    return true;
  });

  const handleMarkComplete = async (booking: Booking) => {
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'complete', completed_at: new Date().toISOString() }),
      });
      if (!res.ok) {
        toast.error("Failed to mark booking as complete");
        return;
      }
      toast.success("Booking marked as complete");
      fetchBookings();
    } catch (err) {
      toast.error("Failed to mark booking as complete");
      console.error(err);
    }
  };

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
              <div className="rounded-md border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Department/Agency</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => {
                      const isPastEndDate = new Date(booking.end_date) < new Date();
                      const canMarkComplete = isPastEndDate && booking.status === 'pending';
                      return (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.department_agency}
                            {!!booking.booked_via_link && (
                              <Badge variant="outline" className="ml-2 text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                                Link
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{booking.contact_person_name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {booking.contact_person_phone}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="font-medium">{booking.num_participants}</span>
                              <span className="text-muted-foreground text-xs">participants</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {booking.status === 'complete' && (
                              <Link to="/financial-track" state={{ tab: 'pending-bills' }}>
                                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 cursor-pointer">Ready for billing</Badge>
                              </Link>
                            )}
                            {booking.status === 'payment_completed' && <Badge className="bg-green-600">Payment Completed</Badge>}
                            {booking.status === 'payment_pending' && (
                              <Link to="/financial-track" state={{ tab: 'payment-pending' }}>
                                <Badge variant="destructive" className="cursor-pointer">Payment Pending</Badge>
                              </Link>
                            )}
                            {booking.status === 'pending' && <Badge variant="secondary">Pending</Badge>}
                            {!!booking.needs_training_hall && (
                              <div className="mt-1">
                                {booking.allocated_halls && booking.allocated_halls.length > 0 && Array.isArray(booking.allocated_halls) && booking.allocated_halls[0] && booking.allocated_halls[0].id ? (
                                  <div className="flex flex-wrap gap-1">
                                    {booking.allocated_halls.map((h: any) => h && h.id && <Badge key={h.id} variant="outline" className="text-[10px] h-4 bg-blue-50 text-blue-700 border-blue-200">{h.name}</Badge>)}
                                  </div>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] bg-orange-50 text-orange-700 border-orange-200">Not Allocated</Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {!!booking.needs_training_hall && booking.status === 'pending' && (
                                <Button variant="ghost" size="sm" onClick={() => handleAllocate(booking)} title="Allocate Hall">
                                  <Building className="h-4 w-4" />
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(booking)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {canMarkComplete && (
                                <Button
                                  className="bg-yellow-400 text-yellow-900 hover:bg-yellow-500 h-8 text-xs px-2"
                                  size="sm"
                                  onClick={() => handleMarkComplete(booking)}
                                >
                                  Ready
                                </Button>
                              )}
                              {booking.status === 'pending' && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive/90">
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
                                      <AlertDialogAction onClick={() => handleDelete(booking.id)}>
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
            onAllocated={() => {
              fetchBookings();
              setAllocateDialogOpen(false);
            }}
          />
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
        setHalls(data);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Allocate Hall for {booking.department_agency}</DialogTitle>
          <DialogDescription>
            Select a training hall. Red tiles indicate halls are booked for these dates.
            <br />
            <span className="text-xs">Dates: {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(new Date(booking.end_date).setDate(new Date(booking.end_date).getDate() - 1)), "MMM dd")}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 max-h-[60vh] overflow-y-auto p-1">
          {halls.map(hall => {
            const isOccupied = occupiedHallIds.includes(hall.id);
            return (
              <div
                key={hall.id}
                className={cn(
                  "border p-2 rounded-md transition-all flex flex-col gap-1.5 relative group",
                  isOccupied
                    ? "bg-red-50/80 border-red-100 opacity-60 cursor-not-allowed"
                    : "hover:bg-muted/50 cursor-pointer hover:border-primary/20 hover:shadow-sm bg-card"
                )}
                onClick={() => !isOccupied && handleAllocate(hall.id)}
              >
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-xs truncate">{hall.name}</span>
                  {hall.is_active && !isOccupied && <span className="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>}
                  {isOccupied && <span className="text-[10px] text-red-500 font-medium leading-none">Booked</span>}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Layers className="h-3 w-3" />
                  <span>{hall.floor || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{hall.capacity} Seats</span>
                </div>
                {!isOccupied && (
                  <Button size="sm" className="mt-1 w-full h-6 text-[10px]" variant="secondary">
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
