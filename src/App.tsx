import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Referrals from "./pages/Referrals";
import Invite from "./pages/Invite";
import GrowthPath from "./pages/GrowthPath";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import ManageUsers from "./pages/admin/ManageUsers";
import Reports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";
import GYLFConnect from "./pages/GYLFConnect";
import HeartInitiative from "./pages/HeartInitiative";
import GYLFAcademy from "./pages/GYLFAcademy";
import GYLFMeetings from "./pages/GYLFMeetings";
import PrayerCloud from "./pages/PrayerCloud";
import ShareTestimony from "./pages/ShareTestimony";
import FAQ from "./pages/FAQ";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/auth" replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="referrals" element={<Referrals />} />
        <Route path="invite" element={<Invite />} />
        <Route path="growth" element={<GrowthPath />} />
        <Route path="resources" element={<Resources />} />
        <Route path="connect" element={<GYLFConnect />} />
        <Route path="heart" element={<HeartInitiative />} />
        <Route path="academy" element={<GYLFAcademy />} />
        <Route path="meetings" element={<GYLFMeetings />} />
        <Route path="prayer" element={<PrayerCloud />} />
        <Route path="testimony" element={<ShareTestimony />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="settings" element={<Settings />} />
        <Route path="admin/users" element={<ManageUsers />} />
        <Route path="admin/reports" element={<Reports />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
