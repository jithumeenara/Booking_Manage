import { Booking } from "@/components/BookingCard";
import { format } from "date-fns";
import actiLogo from "@/assets/acsti-logo.png";
import { HandCoins } from "lucide-react";
import { useEffect, useState } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { formatCurrency } from "@/lib/formatCurrency";

interface PrintFinancialReportProps {
    bookings: Booking[];
    selectedFinancialYear?: string;
    selectedMonth?: string;
    fromDate?: Date;
    toDate?: Date;
    paymentStatus?: string;
}

export const PrintFinancialReport = ({
    bookings,
    selectedFinancialYear,
    selectedMonth,
    fromDate,
    toDate,
    paymentStatus
}: PrintFinancialReportProps) => {
    const [currentUserName, setCurrentUserName] = useState("Admin");
    const { user } = usePermissions();

    useEffect(() => {
        if (user?.name) {
            setCurrentUserName(user.name);
        }
    }, [user]);

    const handlePrint = () => {
        globalThis.print();
    };

    const getFilterText = () => {
        const filters = [];
        if (selectedFinancialYear && selectedFinancialYear !== "all") filters.push(`FY: ${selectedFinancialYear}`);
        if (selectedMonth && selectedMonth !== "all") {
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            filters.push(`Month: ${monthNames[Number.parseInt(selectedMonth, 10)]}`);
        }
        if (fromDate) filters.push(`From: ${format(fromDate, "MMM dd, yyyy")}`);
        if (toDate) filters.push(`To: ${format(toDate, "MMM dd, yyyy")}`);
        if (paymentStatus && paymentStatus !== "all") {
            const statusMap: Record<string, string> = {
                'payment_completed': 'Payment Completed',
                'payment_pending': 'Payment Pending',
                'not_billed': 'Not Billed'
            };
            filters.push(`Status: ${statusMap[paymentStatus] || paymentStatus}`);
        }
        return filters.length > 0 ? filters.join(" | ") : "All Financial Records";
    };

    // Calculate totals
    const totalBase = bookings.reduce((sum, b) => sum + (Number(b.bill_base_amount) || 0), 0);
    const totalGST = bookings.reduce((sum, b) => sum + (Number(b.bill_gst_amount) || 0), 0);
    const totalAmount = bookings.reduce((sum, b) => sum + (Number(b.total_bill_amount) || 0), 0);

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
                {/* Header */}
                <div className="mb-8 pb-6 border-b-2 border-gray-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img src={actiLogo} alt="ACSTI Kerala" className="h-16 w-16 object-contain" />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">ACSTI KERALA</h1>
                                <h2 className="text-base text-gray-600 font-medium mt-1">Financial Report</h2>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-base font-bold text-gray-900">{format(new Date(), "MMMM dd, yyyy")}</p>
                            <p className="text-sm text-gray-600 mt-1">{getFilterText()}</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="mb-10 page-break-inside-avoid">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="print-hide p-2.5 bg-primary text-primary-foreground rounded-lg shadow-md">
                            <HandCoins className="h-5 w-5" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Financial Summary</h3>
                    </div>

                    <div className="overflow-hidden rounded-xl border-2 border-gray-300 shadow-sm">
                        <table className="w-full border-collapse bg-white">
                            <thead>
                                <tr className="bg-gradient-to-r from-gray-100 to-gray-200 border-b-2 border-gray-300">
                                    <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Bill No</th>
                                    <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Date</th>
                                    <th className="border-r border-gray-300 px-3 py-3 text-left font-bold text-sm text-gray-800">Department/Agency</th>
                                    <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Base Amount</th>
                                    <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">GST</th>
                                    <th className="border-r border-gray-300 px-3 py-3 text-center font-bold text-sm text-gray-800">Net Total</th>
                                    <th className="px-3 py-3 text-center font-bold text-sm text-gray-800">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bookings.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-gray-500">No records found</td>
                                    </tr>
                                ) : (
                                    bookings.map((booking, index) => (
                                        <tr key={booking.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-200`}>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-center text-gray-800">{booking.bill_no || '-'}</td>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-center text-gray-800">
                                                {booking.billed_date ? format(new Date(booking.billed_date), "dd/MM/yyyy") : '-'}
                                            </td>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-gray-800 font-medium">{booking.department_agency}</td>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-right font-medium text-gray-600">
                                                {booking.bill_base_amount ? formatCurrency(booking.bill_base_amount) : '-'}
                                            </td>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-right font-medium text-gray-600">
                                                {booking.bill_gst_amount ? formatCurrency(booking.bill_gst_amount) : '-'}
                                            </td>
                                            <td className="border-r border-gray-200 px-3 py-2.5 text-sm text-right font-bold text-gray-800">
                                                {booking.total_bill_amount ? formatCurrency(booking.total_bill_amount) : '-'}
                                            </td>
                                            <td className="px-3 py-2.5 text-sm text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium 
                          ${booking.status === 'payment_completed' ? 'bg-green-100 text-green-800' :
                                                        booking.status === 'payment_pending' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {booking.status === 'payment_completed' ? 'Paid' :
                                                        booking.status === 'payment_pending' ? 'Pending' : 'Unbilled'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                    <td colSpan={3} className="px-3 py-3 text-right text-gray-900">Total:</td>
                                    <td className="px-3 py-3 text-right text-gray-900 border-r border-gray-400">{formatCurrency(totalBase)}</td>
                                    <td className="px-3 py-3 text-right text-gray-900 border-r border-gray-400">{formatCurrency(totalGST)}</td>
                                    <td className="px-3 py-3 text-right text-gray-900 border-r border-gray-400">{formatCurrency(totalAmount)}</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-10 pt-6 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm font-bold text-gray-800">Agricultural Co-operative Staff Training Institute, Kerala</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">Printed By: {currentUserName}</p>
                            <p className="text-xs text-gray-600 mt-1.5">Generated: {format(new Date(), "dd MMM yyyy, hh:mm a")}</p>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        .print-content { max-width: 100%; }
        .no-print { display: block; }
        @media print {
          @page { size: A4; margin: 1.5cm 1.2cm; }
          body * { visibility: hidden; }
          .print-content, .print-content * { visibility: visible; }
          .no-print, .print-hide, .print\\:hidden { display: none !important; }
          .print-content { position: absolute; left: 0; top: 0; width: 100%; padding: 0.8cm; font-size: 10pt; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          table { page-break-inside: avoid; font-size: 9pt !important; width: 100% !important; border-collapse: collapse !important; }
          th { background-color: #f3f4f6 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; color: #000000 !important; padding: 6px !important; }
          td { color: #000000 !important; padding: 6px !important; }
          .bg-gradient-to-r { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        @media screen {
          .print-content { max-width: 100%; width: 100%; }
        }
      `}</style>
        </div>
    );
};
