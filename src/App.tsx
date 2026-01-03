import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminRoute } from "@/components/AdminRoute";
import Index from "./pages/Index";
import ManageBookings from "./pages/ManageBookings";
import FinancialTrack from "./pages/FinancialTrack";
import ReportGeneration from "./pages/ReportGeneration";
import BookingLinks from "./pages/BookingLinks";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import PublicBooking from "./pages/PublicBooking";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/public-booking/:token" element={<PublicBooking />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/manage-bookings" element={<ProtectedRoute><ManageBookings /></ProtectedRoute>} />
          <Route path="/financial-track" element={<ProtectedRoute><FinancialTrack /></ProtectedRoute>} />
          <Route path="/report-generation" element={<ProtectedRoute><ReportGeneration /></ProtectedRoute>} />
          <Route path="/booking-links" element={<ProtectedRoute><BookingLinks /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute><AdminRoute><UserManagement /></AdminRoute></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AdminRoute><Settings /></AdminRoute></ProtectedRoute>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
