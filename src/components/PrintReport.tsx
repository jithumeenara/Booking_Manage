import { Booking } from "@/components/BookingCard";
import { format } from "date-fns";
import actiLogo from "@/assets/acsti-logo.png";
import { formatCurrency, calculateRevenue } from "@/lib/formatCurrency";
import { CalendarDays, Users, IndianRupee } from "lucide-react";

interface PrintReportProps {
  bookings: Booking[];
  selectedDepartment?: string;
  selectedFinancialYear?: string;
  selectedMonth?: string;
  fromDate?: Date;
  toDate?: Date;
  pendingPaymentOnly?: boolean;
  showUpcoming?: boolean;
  showCompleted?: boolean;
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
  showCompleted = true
}: PrintReportProps) => {
  const handlePrint = () => {
    window.print();
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = bookings.filter(b => new Date(b.start_date) > today);
  const completedBookings = bookings.filter(b => 
    new Date(b.end_date) <= today || 
    b.status === 'payment_completed' || 
    b.status === 'complete'
  );

  const upcomingParticipants = upcomingBookings.reduce((sum, b) => sum + b.num_participants, 0);
  const completedParticipants = completedBookings.reduce((sum, b) => sum + b.num_participants, 0);
  // Calculate revenue only from payment_completed bookings
  const completedBillAmount = calculateRevenue(completedBookings);

  const getFilterText = () => {
    const filters = [];
    if (selectedDepartment && selectedDepartment !== "all") filters.push(`Department: ${selectedDepartment}`);
    if (selectedFinancialYear && selectedFinancialYear !== "all") filters.push(`FY: ${selectedFinancialYear}`);
    if (selectedMonth && selectedMonth !== "all") {
      const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      filters.push(`Month: ${monthNames[parseInt(selectedMonth)]}`);
    }
    if (fromDate) filters.push(`From: ${format(fromDate, "MMM dd, yyyy")}`);
    if (toDate) filters.push(`To: ${format(toDate, "MMM dd, yyyy")}`);
    if (pendingPaymentOnly) filters.push("Pending Payment Only");
    return filters.length > 0 ? filters.join(" | ") : "All Records";
  };

  return (
    <div>
      <div className="mb-4 print:hidden">
        <button 
          onClick={handlePrint}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect width="12" height="8" x="6" y="14"/>
          </svg>
          Print Report
        </button>
      </div>

      <div className="print-content bg-white p-6">
        {/* Compact Header */}
        <div className="mb-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={actiLogo} alt="ACSTI Kerala" className="h-12 w-12 object-contain" />
              <div>
                <h1 className="text-xl font-bold">ACSTI KERALA</h1>
                <h2 className="text-sm text-gray-600">Outside Programme Summary Report</h2>
              </div>
            </div>
            <div className="text-right text-sm">
              <p className="font-semibold">{format(new Date(), "MMMM dd, yyyy")}</p>
              <p className="text-xs text-gray-600">{getFilterText()}</p>
            </div>
          </div>
        </div>

        {/* Upcoming Programmes Section */}
        {showUpcoming && upcomingBookings.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Upcoming Programmes</h3>
            
            {/* Summary Tiles Matching View Report - Hidden during print */}
            <div className="grid grid-cols-2 gap-4 mb-6 print:hidden">
              <div className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide" style={{textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>Total Programmes</p>
                  <div className="p-2 rounded-lg bg-blue-500">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black" style={{textShadow: '0 0 2px rgba(0,0,0,0.2)'}}>{upcomingBookings.length}</h3>
              </div>
              <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide" style={{textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>Total Participants</p>
                  <div className="p-2 rounded-lg bg-purple-500">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black" style={{textShadow: '0 0 2px rgba(0,0,0,0.2)'}}>{upcomingParticipants}</h3>
              </div>
            </div>

            {/* Upcoming Programmes Table */}
            <div className="overflow-hidden">
              <table className="w-full border-collapse border-2 border-gray-400" style={{tableLayout: 'fixed'}}>
                <colgroup>
                  <col style={{width: '30%'}} />
                  <col style={{width: '25%'}} />
                  <col style={{width: '30%'}} />
                  <col style={{width: '15%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Department/Agency</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Contact Person</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Programme Dates</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Participants</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((booking, index) => (
                    <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-2 py-2 text-sm break-words">{booking.department_agency}</td>
                      <td className="border border-gray-400 px-2 py-2 text-sm">
                        <div className="break-words">{booking.contact_person_name}</div>
                        <div className="text-xs text-gray-600 break-words">{booking.contact_person_phone}</div>
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-xs text-center">
                        {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-semibold">{booking.num_participants}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Completed Programmes Section */}
        {showCompleted && completedBookings.length > 0 && (
          <div className="page-break-before">
            <h3 className="text-lg font-bold mb-4">Completed Programmes</h3>
            
            {/* Summary Tiles Matching View Report - Hidden during print */}
            <div className="grid grid-cols-3 gap-4 mb-6 print:hidden">
              <div className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide" style={{textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>Total Bookings</p>
                  <div className="p-2 rounded-lg bg-blue-500">
                    <CalendarDays className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black" style={{textShadow: '0 0 2px rgba(0,0,0,0.2)'}}>{completedBookings.length}</h3>
                <p className="text-xs text-gray-600 mt-1">Completed</p>
              </div>
              <div className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide" style={{textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>Total Participants</p>
                  <div className="p-2 rounded-lg bg-purple-500">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black" style={{textShadow: '0 0 2px rgba(0,0,0,0.2)'}}>{completedParticipants}</h3>
                <p className="text-xs text-gray-600 mt-1">Across all bookings</p>
              </div>
              <div className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-black uppercase tracking-wide" style={{textShadow: '0 0 1px rgba(0,0,0,0.3)'}}>Total Revenue</p>
                  <div className="p-2 rounded-lg bg-green-600">
                    <IndianRupee className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black" style={{textShadow: '0 0 2px rgba(0,0,0,0.2)'}}>{formatCurrency(completedBillAmount)}</h3>
                <p className="text-xs text-gray-600 mt-1">Payment completed only</p>
              </div>
            </div>

            {/* Completed Programmes Table */}
            <div className="overflow-hidden">
              <table className="w-full border-collapse border-2 border-gray-400" style={{tableLayout: 'fixed'}}>
                <colgroup>
                  <col style={{width: '20%'}} />
                  <col style={{width: '16%'}} />
                  <col style={{width: '16%'}} />
                  <col style={{width: '10%'}} />
                  <col style={{width: '12%'}} />
                  <col style={{width: '16%'}} />
                  <col style={{width: '10%'}} />
                </colgroup>
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Department/Agency</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Contact Person</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Programme Dates</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Participants</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Status</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">Bill Amount</th>
                    <th className="border border-gray-400 px-2 py-2 text-center font-bold text-sm">FY</th>
                  </tr>
                </thead>
                <tbody>
                  {completedBookings.map((booking, index) => (
                    <tr key={booking.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-400 px-2 py-2 text-sm break-words">{booking.department_agency}</td>
                      <td className="border border-gray-400 px-2 py-2 text-sm">
                        <div className="break-words">{booking.contact_person_name}</div>
                        <div className="text-xs text-gray-600 break-words">{booking.contact_person_phone}</div>
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-xs text-center">
                        {format(new Date(booking.start_date), "MMM dd")} - {format(new Date(booking.end_date), "MMM dd, yyyy")}
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-sm text-center font-semibold">{booking.num_participants}</td>
                      <td className="border border-gray-400 px-1 py-2 text-xs text-center">
                        <span className={`px-1 py-0.5 rounded text-xs ${
                          booking.status === 'payment_completed' ? 'bg-green-100 text-green-800' :
                          booking.status === 'payment_pending' ? 'bg-red-100 text-red-800' :
                          booking.status === 'complete' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status || 'pending'}
                        </span>
                      </td>
                      <td className="border border-gray-400 px-2 py-2 text-xs text-right font-semibold">{formatCurrency(booking.total_bill_amount)}</td>
                      <td className="border border-gray-400 px-2 py-2 text-xs text-center">{booking.financial_year || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t">
          <div className="flex justify-between items-center text-xs text-gray-600">
            <div>
              <p className="font-semibold">Agricultural Co-operative Staff Training Institute, Kerala</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Printed By: {localStorage.getItem('userName') || 'Admin'}</p>
              <p className="mt-1">Date: {format(new Date(), "dd MMM yyyy")}</p>
              <p>Time: {format(new Date(), "hh:mm a")}</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .print-content {
          max-width: 100%;
          font-size: 14px;
          transform-origin: top left;
        }
        
        @media print {
          @page {
            size: A4;
            margin: 1.5cm 1cm;
          }
          
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 1cm;
            transform: scale(1);
            font-size: 10pt;
          }
          .page-break-before {
            page-break-before: auto;
            margin-top: 10px !important;
            padding-top: 0 !important;
          }
          /* Hide tiles during print */
          .print\\:hidden {
            display: none !important;
          }
          /* Ensure table borders are visible and fits A4 */
          table {
            page-break-inside: avoid;
            font-size: 7pt !important;
            border-collapse: collapse !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          table, th, td {
            border: 1px solid #9ca3af !important;
          }
          th {
            background-color: #f3f4f6 !important;
            font-weight: bold !important;
            padding: 2px 1px !important;
            font-size: 7pt !important;
            word-wrap: break-word !important;
          }
          td {
            padding: 2px 1px !important;
            font-size: 7pt !important;
            word-wrap: break-word !important;
            overflow-wrap: break-word !important;
          }
          /* Make text smaller in cells for better fit */
          td .text-xs {
            font-size: 6pt !important;
          }
          /* Compact status badges */
          td span {
            padding: 1px 2px !important;
            font-size: 6pt !important;
          }
          /* Ensure wrapper borders are visible */
          .border-2 {
            border-width: 2px !important;
            border-color: #d1d5db !important;
          }
          h1 { font-size: 16pt; }
          h2 { font-size: 12pt; }
          h3 { font-size: 14pt; }
          .text-2xl { font-size: 18pt !important; }
          .text-xs { font-size: 8pt !important; }
          /* Reduce spacing between sections */
          .mb-8 { margin-bottom: 10px !important; }
          .mb-6 { margin-bottom: 8px !important; }
          .mb-4 { margin-bottom: 6px !important; }
          /* Avoid blank pages and orphans */
          * {
            page-break-inside: avoid !important;
          }
          table {
            page-break-before: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
        }
        
        @media screen {
          .print-content {
            transform: scale(1);
            transform-origin: top center;
            margin: 0 auto;
            max-width: 100%;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
