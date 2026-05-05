import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/store/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import AdminPatientsPage from "./features/admin/AdminPatientPanel";

// Auth Pages
import LoginPage from "@/features/auth/LoginPage";
import RegisterPage from "@/features/auth/RegisterPage";

// Admin Pages
import AdminDashboard from "@/features/admin/AdminDashboard";
import AddStaffPage from "@/features/admin/AddStaffPage";
import StaffListPage from "@/features/admin/StaffListPage";

// Staff Pages
import StaffDashboard from "@/features/staff/StaffDashboard";
import PatientDetailPage from "@/features/staff/PatientDetailPage";

// Other Pages
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/add-staff"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AddStaffPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/staff"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StaffListPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/patients"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminPatientsPage />
                </ProtectedRoute>
              }
            />

            {/* Staff Routes */}
            <Route
              path="/staff"
              element={
                <ProtectedRoute allowedRoles={["doctor", "nurse"]}>
                  <StaffDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/staff/patient/:id"
              element={
                <ProtectedRoute allowedRoles={["doctor", "nurse"]}>
                  <PatientDetailPage />
                </ProtectedRoute>
              }
            />

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    
  </QueryClientProvider>
);

export default App;
