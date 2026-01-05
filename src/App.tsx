import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy } from "react";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const ManageBookings = lazy(() => import("./pages/ManageBookings"));
const FinancialTrack = lazy(() => import("./pages/FinancialTrack"));
const ReportGeneration = lazy(() => import("./pages/ReportGeneration"));
const BookingLinks = lazy(() => import("./pages/BookingLinks"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const Settings = lazy(() => import("./pages/Settings"));
const PublicBooking = lazy(() => import("./pages/PublicBooking"));
const Auth = lazy(() => import("./pages/Auth"));
const AccessDenied = lazy(() => import("./pages/AccessDenied"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
