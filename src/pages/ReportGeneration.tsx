import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Booking } from "@/components/BookingCard";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Download, Filter, Calendar as CalendarIcon, CalendarDays, Users, IndianRupee } from "lucide-react";
import { getCurrentFinancialYear, cn } from "@/lib/utils";
import { PrintReport } from "@/components/PrintReport";
import { formatCurrency, calculateRevenue } from "@/lib/formatCurrency";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const ReportGeneration = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedFinancialYear, setSelectedFinancialYear] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();
  const [pendingPaymentOnly, setPendingPaymentOnly] = useState(false);
  const [printUpcoming, setPrintUpcoming] = useState(true);
  const [printCompleted, setPrintCompleted] = useState(true);
  const [activeTab, setActiveTab] = useState("view");

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings', { credentials: 'include' });
      if (!res.ok) {
        toast.error("Failed to load bookings");
        setLoading(false);
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

  const departments = Array.from(new Set(bookings.map(b => b.department_agency)));
  const financialYears = Array.from(new Set(bookings.map(b => b.financial_year).filter(Boolean)));

  const filteredBookings = bookings.filter(booking => {
    if (selectedDepartment !== "all" && booking.department_agency !== selectedDepartment) return false;
    if (selectedFinancialYear !== "all" && booking.financial_year !== selectedFinancialYear) return false;
    if (selectedMonth !== "all") {
      const bookingMonth = new Date(booking.start_date).getMonth();
      if (bookingMonth !== parseInt(selectedMonth)) return false;
    }
    if (fromDate) {
      const bookingStart = new Date(booking.start_date);
      if (bookingStart < fromDate) return false;
    }
    if (toDate) {
      const bookingStart = new Date(booking.start_date);
      if (bookingStart > toDate) return false;
    }
    if (pendingPaymentOnly && booking.status !== 'payment_pending') return false;
    return true;
  });

  const resetPrintView = () => {
    setSelectedDepartment("all");
    setSelectedFinancialYear("all");
    setSelectedMonth("all");
    setFromDate(undefined);
    setToDate(undefined);
    setPendingPaymentOnly(false);
    setPrintUpcoming(true);
    setPrintCompleted(true);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === "print") {
      resetPrintView();
    }
  };

  const exportToCSV = () => {
    const headers = ['Department', 'Contact Person', 'Phone', 'Start Date', 'End Date', 'Participants', 'Status', 'Bill Amount', 'FY'];
    const rows = filteredBookings.map(b => [
      b.department_agency,
      b.contact_person_name,
      b.contact_person_phone,
      format(new Date(b.start_date), "yyyy-MM-dd"),
      format(new Date(b.end_date), "yyyy-MM-dd"),
      b.num_participants,
      b.status || 'pending',
      b.total_bill_amount || '0',
      b.financial_year || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  // Calculate total revenue from payment_completed bookings only
  const totalRevenue = calculateRevenue(filteredBookings);
  const totalParticipants = filteredBookings.reduce((sum, b) => sum + b.num_participants, 0);
  
  // Calculate pending payment amount (payment_pending status only)
  const pendingPaymentAmount = filteredBookings
    .filter(b => b.status === 'payment_pending')
    .reduce((sum, b) => sum + (b.total_bill_amount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reports...</p>
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
                  Report Generation
                </h1>
                <p className="text-xs text-muted-foreground">Generate and export booking reports • Current FY: {getCurrentFinancialYear()}</p>
              </div>
              <Button onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList>
                <TabsTrigger value="view">View Report</TabsTrigger>
                <TabsTrigger value="print">Print Report</TabsTrigger>
              </TabsList>

              <TabsContent value="view" className="space-y-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border border-border/50">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>

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

              <Select value={selectedFinancialYear} onValueChange={setSelectedFinancialYear}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select FY" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All FY</SelectItem>
                  {financialYears.map(fy => (
                    <SelectItem key={fy} value={fy!}>{fy}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

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

              {/* Pending Payment Filter */}
              <Button
                variant={pendingPaymentOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setPendingPaymentOnly(!pendingPaymentOnly)}
              >
                {pendingPaymentOnly ? "✓ " : ""}Pending Payment
              </Button>

              {(selectedDepartment !== "all" || selectedFinancialYear !== "all" || selectedMonth !== "all" || fromDate || toDate || pendingPaymentOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDepartment("all");
                    setSelectedFinancialYear("all");
                    setSelectedMonth("all");
                    setFromDate(undefined);
                    setToDate(undefined);
                    setPendingPaymentOnly(false);
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>

            {/* Summary Cards - Black Text for Readability */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Total Bookings</p>
                  <div className="p-2.5 rounded-xl bg-blue-500 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <CalendarDays className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{filteredBookings.length}</h3>
                <p className="text-xs text-gray-600 mt-1">Active reservations</p>
              </div>
              <div className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Total Participants</p>
                  <div className="p-2.5 rounded-xl bg-purple-500 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{totalParticipants}</h3>
                <p className="text-xs text-gray-600 mt-1">Across all bookings</p>
              </div>
              <div className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Pending Payment</p>
                  <div className="p-2.5 rounded-xl bg-orange-500 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(pendingPaymentAmount)}</h3>
                <p className="text-xs text-gray-600 mt-1">Payment pending status</p>
              </div>
              <div className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Total Revenue</p>
                  <div className="p-2.5 rounded-xl bg-green-600 shadow-md group-hover:scale-110 transition-transform duration-300">
                    <IndianRupee className="h-5 w-5 text-white" />
                  </div>
                </div>
                <h3 className="text-3xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</h3>
                <p className="text-xs text-gray-600 mt-1">Payment completed only</p>
              </div>
            </div>

                {/* Table */}
                <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Department</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Dates</TableHead>
                        <TableHead>Participants</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Bill Amount</TableHead>
                        <TableHead>FY</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">{booking.department_agency}</TableCell>
                          <TableCell>
                            <div>{booking.contact_person_name}</div>
                            <div className="text-xs text-muted-foreground">{booking.contact_person_phone}</div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                          </TableCell>
                          <TableCell>{booking.num_participants}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs ${
                              booking.status === 'payment_completed' ? 'bg-green-100 text-green-800' :
                              booking.status === 'payment_pending' ? 'bg-red-100 text-red-800' :
                              booking.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {booking.status || 'pending'}
                            </span>
                          </TableCell>
                          <TableCell>{formatCurrency(booking.total_bill_amount)}</TableCell>
                          <TableCell>{booking.financial_year || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="print" className="mt-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="print-upcoming"
                      checked={printUpcoming}
                      onCheckedChange={(checked) => setPrintUpcoming(checked as boolean)}
                    />
                    <Label htmlFor="print-upcoming">Upcoming Programmes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="print-completed"
                      checked={printCompleted}
                      onCheckedChange={(checked) => setPrintCompleted(checked as boolean)}
                    />
                    <Label htmlFor="print-completed">Completed Programmes</Label>
                  </div>
                </div>

                <PrintReport 
                  bookings={filteredBookings}
                  selectedDepartment={selectedDepartment}
                  selectedFinancialYear={selectedFinancialYear}
                  selectedMonth={selectedMonth}
                  fromDate={fromDate}
                  toDate={toDate}
                  pendingPaymentOnly={pendingPaymentOnly}
                  showUpcoming={printUpcoming}
                  showCompleted={printCompleted}
                />
              </TabsContent>
            </Tabs>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ReportGeneration;