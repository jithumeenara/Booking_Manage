import { Booking } from "@/components/BookingCard";
import { format } from "date-fns";
import actiLogo from "@/assets/acsti-logo.png";
import { CalendarDays, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";

interface PrintReportProps {
  bookings: Booking[];
  selectedDepartment?: string;
  selectedFinancialYear?: string;
  selectedMonth?: string;
  fromDate?: Date;
  toDate?: Date;
  pendingPaymentOnly?: boolean;
  showUpcoming?: boolean;
  showRunning?: boolean;
  showCompleted?: boolean;
  showAll?: boolean;
}

export const PrintReport = ({
  bookings,
  selectedDepartment,
  selectedFinancialYear,
  selectedMonth,
  fromDate,
  toDate,
  pendingPaymentOnly,
  showUpcoming = true,
  showRunning = true,
  showCompleted = true,
  showAll = false
}: PrintReportProps) => {
  const [currentUserName, setCurrentUserName] = useState("Admin");
  const { user } = usePermissions();

  useEffect(() => {
    // Get user name from permissions hook
    if (user?.name) {
      setCurrentUserName(user.name);
    }
  }, [user]);

  const handlePrint = () => {
    globalThis.print();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Define date ranges for current running programme
  const upcomingBookings = bookings.filter(b => new Date(b.start_date) > today);
  const runningBookings = bookings.filter(b =>
    new Date(b.start_date) <= today && new Date(b.end_date) >= today
  );
  const completedBookings = bookings.filter(b =>
    new Date(b.end_date) < today ||
    b.status === 'payment_completed' ||
    b.status === 'complete'
  );

  const getFilterText = () => {
    const filters = [];
    if (selectedDepartment && selectedDepartment !== "all") filters.push(`Department: ${selectedDepartment}`);
    if (selectedFinancialYear && selectedFinancialYear !== "all") filters.push(`FY: ${selectedFinancialYear}`);
    if (selectedMonth && selectedMonth !== "all") {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      filters.push(`Month: ${monthNames[Number.parseInt(selectedMonth, 10)]}`);
    }
    if (fromDate) filters.push(`From: ${format(fromDate, "MMM dd, yyyy")}`);
    if (toDate) filters.push(`To: ${format(toDate, "MMM dd, yyyy")}`);
    if (pendingPaymentOnly) filters.push("Pending Payment Only");
    return filters.length > 0 ? filters.join(" | ") : "All Records";
  };

  const renderProgrammeTable = (
    programmeList: Booking[],
    title: string,
    icon: React.ReactNode,
    showBilling: boolean = false
  ) => {
    if (programmeList.length === 0) return null;

    return (
      <div className="mb-10 page-break-inside-avoid">
        <div className="flex items-center gap-3 mb-5">
          <div className="print-hide p-2.5 bg-primary text-primary-foreground rounded-lg shadow-md">
            {icon}
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        </div>

        {/* Modern Table - Simplified 4 columns */}
        <div className="overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm">
          <table className="w-full border-collapse bg-white" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '25%' }} />
              <col style={{ width: '20%' }} />
              <col style={{ width: '10%' }} />
            </colgroup>
            <thead>
              <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Department/Agency</th>
                <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Contact Person</th>
                <th className="border-r border-gray-300 px-3 py-3 text-center font-extrabold text-sm text-black">Programme Dates</th>
                <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Training Hall</th>
                <th className="px-3 py-3 text-center font-bold text-sm text-gray-800">Participants</th>
              </tr>
            </thead>
            <tbody>
              {programmeList.map((booking, index) => (
                <tr key={booking.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-primary/5 transition-colors border-b border-gray-200`}>
                  <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-gray-800 font-medium">{booking.department_agency}</td>
                  <td className="border-r border-gray-200 px-3 py-2.5 text-sm">
                    <div className="font-medium text-gray-800">{booking.contact_person_name}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{booking.contact_person_phone}</div>
                  </td>
                  <td className="border-r border-gray-200 px-3 py-2.5 text-xs text-center text-gray-700">
                    {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                  </td>
                  <td className="border-r border-gray-200 px-3 py-2.5 text-xs text-center text-gray-700 font-medium">
                    {booking.allocated_halls && booking.allocated_halls.length > 0 ? (
                      booking.allocated_halls.map((h: any) => h.name || h.code).join(', ')
                    ) : !booking.needs_training_hall ? (
                      <span className="text-gray-400 italic">Not Needed</span>
                    ) : (
                      <span className="text-gray-400 italic">Not Allocated</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-sm text-center font-bold text-primary">{booking.num_participants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6 print:hidden">
        <button
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect width="12" height="8" x="6" y="14" />
          </svg>
          Print Report
        </button>
      </div>

      <div className="print-content bg-white p-8 rounded-lg shadow-sm">
        {/* Modern Header */}
        <div className="mb-8 pb-6 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={actiLogo} alt="ACSTI Kerala" className="h-16 w-16 object-contain" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">ACSTI KERALA</h1>
                <h2 className="text-base text-gray-600 font-medium mt-1">Programme Summary Report</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-900">{format(new Date(), "MMMM dd, yyyy")}</p>
              <p className="text-sm text-gray-600 mt-1">{getFilterText()}</p>
            </div>
          </div>
        </div>

        {/* Render Sections Based on Selection */}
        {showUpcoming && !showRunning && !showCompleted && renderProgrammeTable(
          upcomingBookings,
          "Upcoming Programmes",
          <CalendarDays className="h-5 w-5 text-white" />
        )}

        {showRunning && !showUpcoming && !showCompleted && renderProgrammeTable(
          runningBookings,
          "Current Running Programme",
          <Clock className="h-5 w-5 text-white" />
        )}

        {showCompleted && !showUpcoming && !showRunning && renderProgrammeTable(
          completedBookings,
          "Completed Programmes",
          <CalendarDays className="h-5 w-5 text-white" />,
          true
        )}

        {/* All Programme Section - Single combined table */}
        {showAll && renderProgrammeTable(
          bookings,
          "All Programme",
          <CalendarDays className="h-5 w-5 text-white" />,
          true
        )}

        {/* Modern Footer */}
        <div className="mt-10 pt-6 border-t-2 border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-bold text-gray-800">Agricultural Co-operative Staff Training Institute, Kerala</p>
              <p className="print-hide text-xs text-gray-600 mt-1">Excellence in Training • Leadership in Development</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900">Printed By: {currentUserName}</p>
              <p className="text-xs text-gray-600 mt-1.5">Date: {format(new Date(), "dd MMMM yyyy")}</p>
              <p className="text-xs text-gray-600">Time: {format(new Date(), "hh:mm a")}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .print-content {
          max-width: 100%;
        }
        
        /* Hide no-print elements on screen is handled by Tailwind */
        .no-print {
          display: block;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 1.5cm 1.2cm;
          }
          
          /* Modern print technique: Hide all non-print content */
          body * {
            visibility: hidden;
          }
          
          .print-content, .print-content * {
            visibility: visible;
          }
          
          /* Hide tiles during print using multiple methods for compatibility */
          .no-print,
          .no-print *,
          .print-hide,
          .print-hide *,
          .print\\:hidden,
          .print\\:hidden * {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            left: -9999px !important;
          }
          
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0.8cm;
            font-size: 10pt;
          }
          
          .page-break-before {
            page-break-before: always;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid;
          }
          
          table {
            page-break-inside: avoid;
            font-size: 8pt !important;
            border-collapse: collapse !important;
            width: 100% !important;
          }
          
          th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
            color: #000000 !important;
            font-size: 7.5pt !important;
            padding: 4px 3px !important;
          }
          
          td {
            color: #000000 !important;
            font-size: 7.5pt !important;
            padding: 4px 3px !important;
          }
          
          td span {
            font-size: 7pt !important;
            padding: 2px 4px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
          
          h1 { font-size: 18pt !important; }
          h2 { font-size: 13pt !important; }
          h3 { font-size: 15pt !important; }
          
          .mb-10 { margin-bottom: 12px !important; }
          .mb-8 { margin-bottom: 10px !important; }
          .mb-6 { margin-bottom: 8px !important; }
          
          thead {
            display: table-header-group !important;
          }
          
          /* Ensure colors print correctly */
          .bg-gradient-to-r,
          .bg-gradient-to-br {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            color-adjust: exact;
          }
        }
        
        @media screen {
          .print-content {
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
