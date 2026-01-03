import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import ManageBookings from "./pages/ManageBookings";
import FinancialTrack from "./pages/FinancialTrack";
import ReportGeneration from "./pages/ReportGeneration";
import BookingLinks from "./pages/BookingLinks";
import UserManagement from "./pages/UserManagement";
import Settings from "./pages/Settings";
import PublicBooking from "./pages/PublicBooking";
import Auth from "./pages/Auth";
import AccessDenied from "./pages/AccessDenied";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/auth" element={<Auth />} />
          <Route path="/public-booking/:token" element={<PublicBooking />} />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Protected routes with specific permissions */}
          <Route path="/" element={<ProtectedRoute requiredPermission="dashboard"><Index /></ProtectedRoute>} />
          <Route path="/manage-bookings" element={<ProtectedRoute requiredPermission="bookings"><ManageBookings /></ProtectedRoute>} />
          <Route path="/financial-track" element={<ProtectedRoute requiredPermission="programs"><FinancialTrack /></ProtectedRoute>} />
          <Route path="/report-generation" element={<ProtectedRoute requiredPermission="reports"><ReportGeneration /></ProtectedRoute>} />
          <Route path="/booking-links" element={<ProtectedRoute requiredPermission="booking-links"><BookingLinks /></ProtectedRoute>} />
          <Route path="/user-management" element={<ProtectedRoute requiredPermission="user-management"><UserManagement /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute requiredPermission="settings"><Settings /></ProtectedRoute>} />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
