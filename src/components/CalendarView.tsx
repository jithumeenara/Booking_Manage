import { useState } from "react";
import { Booking } from "@/components/BookingCard";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarIcon } from "lucide-react";

interface CalendarViewProps {
  bookings: Booking[];
}

export const CalendarView = ({ bookings }: CalendarViewProps) => {
  const getBookingsForDate = (date: Date) => {
    // Normalize the selected date to midnight for accurate comparison
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      // Normalize booking start and end dates to midnight
      const bookingStart = new Date(booking.start_date);
      bookingStart.setHours(0, 0, 0, 0);
      
      const bookingEnd = new Date(booking.end_date);
      bookingEnd.setHours(0, 0, 0, 0);
      
      // Check if the selected date falls within the booking period (inclusive)
      return selectedDate >= bookingStart && selectedDate <= bookingEnd;
    });
  };

  const getBookingCountForDate = (date: Date) => {
    return getBookingsForDate(date).length;
  };

  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [isModernView, setIsModernView] = useState<boolean>(false);
  const selectedBookings = selectedDate ? getBookingsForDate(selectedDate) : [];

  // Aggregated stats for the selected date
  const totalTrainings = selectedBookings.length;
  // Total participants that require accommodation on the selected date
  const totalAccommodation = selectedBookings.reduce((sum, booking) => {
    if (!booking.needs_accommodation) return sum;
    return sum + (booking.num_participants || 0);
  }, 0);
  const totalTrainingHalls = selectedBookings.reduce((sum, booking) => {
    if (!booking.needs_training_hall) return sum;
    const halls = booking.number_of_halls && booking.number_of_halls > 0 ? booking.number_of_halls : 1;
    return sum + halls;
  }, 0);

  // Color modifiers for classic calendar view
  const datesWithOneBooking = bookings.flatMap(booking => {
    const dates: Date[] = [];
    const current = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    while (current <= end) {
      if (getBookingCountForDate(current) === 1) dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  });

  const datesWithTwoBookings = bookings.flatMap(booking => {
    const dates: Date[] = [];
    const current = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    while (current <= end) {
      if (getBookingCountForDate(current) === 2) dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  });

  const datesWithThreeOrMoreBookings = bookings.flatMap(booking => {
    const dates: Date[] = [];
    const current = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    while (current <= end) {
      if (getBookingCountForDate(current) >= 3) dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  });

  const modifiers = {
    oneBooking: datesWithOneBooking,
    twoBookings: datesWithTwoBookings,
    threeOrMoreBookings: datesWithThreeOrMoreBookings,
  };

  const modifiersClassNames = {
    oneBooking: "bg-green-200 text-green-900 font-bold border border-green-400",
    twoBookings: "bg-orange-200 text-orange-900 font-bold border border-orange-400",
    threeOrMoreBookings: "bg-red-200 text-red-900 font-bold border border-red-400",
  };

  // Generate calendar days for the month view
  const generateCalendarDays = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days: Date[] = [];
    let day = startDate;

    while (day <= endDate) {
      days.push(day);
      day = addDays(day, 1);
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  return (
    <div className="space-y-6">
      <Card className="p-3 md:p-6 shadow-xl border border-border/50 bg-gradient-to-br from-white via-green-50/30 to-blue-50/30 dark:from-gray-900 dark:via-green-900/10 dark:to-blue-900/10">
        {/* Header with Title, Legend, Per-Day Summary, and View Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <h3 className="text-lg md:text-2xl font-bold text-primary">
              Booking Calendar
            </h3>
            <div className="flex items-center gap-1.5 md:gap-2 bg-white/80 dark:bg-gray-800/80 px-2 md:px-3 py-1 md:py-1.5 rounded-full shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-green-200 border border-green-400 shadow-sm"></div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-700 dark:text-gray-300">1</span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-orange-200 border border-orange-400 shadow-sm"></div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-700 dark:text-gray-300">2</span>
              </div>
              <div className="w-px h-3 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm bg-red-200 border border-red-400 shadow-sm"></div>
                <span className="text-[10px] md:text-xs font-semibold text-gray-700 dark:text-gray-300">3+</span>
              </div>
            </div>
          </div>

          {/* Per-date summary in the header center */}
          <div className="flex-1 flex justify-center">
            {selectedDate && totalTrainings > 0 && (
              <div className="inline-flex flex-wrap items-center gap-2 bg-white/80 dark:bg-gray-800/80 px-3 py-1.5 rounded-full shadow-sm border border-border/60 text-[11px] md:text-xs">
                <span className="font-semibold text-primary">
                  {format(selectedDate, 'dd MMM yyyy')}
                </span>
                <span className="w-px h-3 bg-gray-300" />
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  Trainings: {totalTrainings}
                </span>
                <span className="w-px h-3 bg-gray-300" />
                <span className="text-sky-700 dark:text-sky-300 font-medium">
                  Accommodation: {totalAccommodation}
                </span>
                <span className="w-px h-3 bg-gray-300" />
                <span className="text-violet-700 dark:text-violet-300 font-medium">
                  Training Halls: {totalTrainingHalls}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 justify-end">
            {/* View Toggle */}
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-lg border">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <Switch
                checked={isModernView}
                onCheckedChange={setIsModernView}
                id="view-toggle"
              />
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            </div>
            <Button variant="outline" size="sm" onClick={goToToday} className="w-fit shadow-sm">
              Today
            </Button>
          </div>
        </div>

        {isModernView ? (
          /* Modern Full-Width Month Grid View */
          <>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-3 md:mb-4 bg-primary/10 dark:bg-primary/20 rounded-lg px-2 md:px-4 py-2 md:py-3 shadow-sm">
              <Button variant="ghost" size="sm" onClick={prevMonth} className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <h4 className="text-base md:text-xl font-bold text-primary">
                {format(currentMonth, 'MMMM yyyy')}
              </h4>
              <Button variant="ghost" size="sm" onClick={nextMonth} className="hover:bg-white/50 dark:hover:bg-gray-800/50">
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>

            {/* Calendar Grid */}
        <div className="w-full overflow-x-auto rounded-lg shadow-lg">
          <div className="min-w-[280px] md:min-w-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-[1px] bg-border p-[1px] rounded-t-lg">
              {weekDays.map(day => (
                <div key={day} className="bg-primary text-primary-foreground text-center py-2 md:py-3 font-bold text-[10px] md:text-sm first:rounded-tl-lg last:rounded-tr-lg">
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-[1px] bg-gray-200 dark:bg-gray-700 p-[1px] rounded-b-lg">
              {calendarDays.map((day, index) => {
                const bookingCount = getBookingCountForDate(day);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                const isLastRow = index >= calendarDays.length - 7;

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative min-h-[60px] md:min-h-[100px] p-1 md:p-2 text-left transition-all duration-200
                      ${
                        bookingCount === 1 ? 'bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 border-l-2 border-l-green-400' :
                        bookingCount === 2 ? 'bg-gradient-to-br from-orange-50 to-orange-100 hover:from-orange-100 hover:to-orange-200 border-l-2 border-l-orange-400' :
                        bookingCount >= 3 ? 'bg-gradient-to-br from-red-50 to-red-100 hover:from-red-100 hover:to-red-200 border-l-2 border-l-red-400' :
                        'bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                      }
                      ${!isCurrentMonth ? 'opacity-30' : ''}
                      ${isSelected ? 'ring-2 ring-blue-500 ring-inset shadow-lg scale-[0.98]' : ''}
                      ${isTodayDate ? 'ring-2 ring-purple-500 ring-inset shadow-md' : ''}
                      ${index % 7 === 0 && isLastRow ? 'rounded-bl-lg' : ''}
                      ${index % 7 === 6 && isLastRow ? 'rounded-br-lg' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-lg md:text-2xl font-bold ${
                        isTodayDate ? 'text-purple-600 dark:text-purple-400' : 
                        isCurrentMonth ? 'text-gray-700 dark:text-gray-200' : 
                        'text-gray-400 dark:text-gray-600'
                      }`}>
                        {format(day, 'd')}
                      </span>
                      {bookingCount > 0 && (
                        <span className={`text-[10px] md:text-xs font-bold px-1 md:px-1.5 py-0.5 rounded-full shadow-sm ${
                          bookingCount === 1 ? 'bg-green-500 text-white' :
                          bookingCount === 2 ? 'bg-orange-500 text-white' :
                          'bg-red-500 text-white'
                        }`}>
                          {bookingCount}
                        </span>
                      )}
                    </div>
                    {bookingCount > 0 && (
                      <div className="space-y-0.5 hidden md:block">
                        {getBookingsForDate(day).slice(0, 2).map((booking, idx) => (
                          <div
                            key={idx}
                            className={`text-[10px] md:text-xs truncate px-1 py-0.5 rounded font-medium shadow-sm ${
                              bookingCount === 1 ? 'bg-green-200 text-green-800' :
                              bookingCount === 2 ? 'bg-orange-200 text-orange-800' :
                              'bg-red-200 text-red-800'
                            }`}
                            title={booking.department_agency}
                          >
                            {booking.department_agency}
                          </div>
                        ))}
                        {bookingCount > 2 && (
                          <div className="text-[9px] md:text-xs text-gray-500 dark:text-gray-400 font-semibold">+{bookingCount - 2} more</div>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
          </>
        ) : (
          /* Classic Two-Column Layout */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-lg border-2 border-border/50 shadow-md mx-auto"
              />
              <div className="mt-6 p-4 bg-muted/30 rounded-lg space-y-3">
                <p className="text-sm font-semibold text-foreground mb-3">Legend:</p>
                <div className="grid grid-cols-1 gap-2.5 text-sm">
                  <div className="flex items-center gap-3 p-2 rounded-md bg-background/60">
                    <div className="w-5 h-5 rounded bg-green-200 border-2 border-green-400 shadow-sm"></div>
                    <span className="font-medium">1 booking</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-md bg-background/60">
                    <div className="w-5 h-5 rounded bg-orange-200 border-2 border-orange-400 shadow-sm"></div>
                    <span className="font-medium">2 bookings</span>
                  </div>
                  <div className="flex items-center gap-3 p-2 rounded-md bg-background/60">
                    <div className="w-5 h-5 rounded bg-red-200 border-2 border-red-400 shadow-sm"></div>
                    <span className="font-medium">3+ bookings</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-primary">
                  {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
                </h3>
                {selectedDate && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                      className="h-8 w-8 p-0"
                      title="Previous date"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                      className="h-8 w-8 p-0"
                      title="Next date"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              {selectedBookings.length > 0 ? (
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                  {selectedBookings.map(booking => (
                    <div key={booking.id} className="p-5 border-l-4 border-l-primary rounded-lg bg-gradient-to-r from-muted/70 to-muted/40 shadow-md hover:shadow-lg transition-all duration-200">
                      <h4 className="font-bold text-lg mb-2 text-primary">{booking.department_agency}</h4>
                      <p className="text-sm text-foreground mb-1 font-medium">
                        <span className="text-muted-foreground">Contact:</span> {booking.contact_person_name}
                      </p>
                      {booking.purpose && (
                        <p className="text-sm text-muted-foreground mb-3 italic">{booking.purpose}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <Badge variant="outline" className="font-semibold">{booking.num_participants} participants</Badge>
                        {booking.needs_accommodation && <Badge className="bg-blue-500">Accommodation</Badge>}
                        {booking.needs_food && <Badge className="bg-green-500">Food</Badge>}
                        {booking.needs_training_hall && <Badge className="bg-purple-500">Training Hall</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium">
                        {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="text-base">
                    {selectedDate ? "No bookings scheduled for this date" : "Click on a date to view scheduled bookings"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {isModernView && (
        <Card className="p-6 shadow-lg border-border/50 bg-gradient-to-br from-card to-secondary/5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-primary">
            {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
          </h3>
          {selectedDate && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
                title="Previous date"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="h-8 w-8 p-0"
                title="Next date"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        {selectedBookings.length > 0 ? (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {selectedBookings.map(booking => (
              <div key={booking.id} className="p-5 border-l-4 border-l-primary rounded-lg bg-gradient-to-r from-muted/70 to-muted/40 shadow-md hover:shadow-lg transition-all duration-200">
                <h4 className="font-bold text-lg mb-2 text-primary">{booking.department_agency}</h4>
                <p className="text-sm text-foreground mb-1 font-medium">
                  <span className="text-muted-foreground">Contact:</span> {booking.contact_person_name}
                </p>
                {booking.purpose && (
                  <p className="text-sm text-muted-foreground mb-3 italic">{booking.purpose}</p>
                )}
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant="outline" className="font-semibold">{booking.num_participants} participants</Badge>
                  {booking.needs_accommodation && <Badge className="bg-blue-500">Accommodation</Badge>}
                  {booking.needs_food && <Badge className="bg-green-500">Food</Badge>}
                  {booking.needs_training_hall && <Badge className="bg-purple-500">Training Hall</Badge>}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  {format(new Date(booking.start_date), "MMM d")} - {format(new Date(booking.end_date), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-base">
              {selectedDate ? "No bookings scheduled for this date" : "Click on a date to view scheduled bookings"}
            </p>
          </div>
        )}
        </Card>
      )}
    </div>
  );
};