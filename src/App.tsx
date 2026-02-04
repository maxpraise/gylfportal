import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/auth/AdminRoute";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Invite from "./pages/Invite";
import GrowthPath from "./pages/GrowthPath";
import Resources from "./pages/Resources";
import Settings from "./pages/Settings";
import ManageUsers from "./pages/admin/ManageUsers";
import Reports from "./pages/admin/Reports";
import NotFound from "./pages/NotFound";
import HeartInitiative from "./pages/HeartInitiative";
import GYLFAcademy from "./pages/GYLFAcademy";
import CourseDetail from "./pages/CourseDetail";
import ConnectMeetings from "./pages/ConnectMeetings";
import PrayerCloud from "./pages/PrayerCloud";
import ShareTestimony from "./pages/ShareTestimony";
import FAQ from "./pages/FAQ";
import Partnership from "./pages/Partnership";
import NewsDetail from "./pages/NewsDetail";
import Notifications from "./pages/Notifications";
import SendNotification from "./pages/admin/SendNotification";
import GYTV from "./pages/GYTV";
import VODVideos from "./pages/VODVideos";
import VODDetail from "./pages/VODDetail";

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
  return (
    <Routes>
      {/* Auth is the landing page */}
      <Route path="/" element={<Auth />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/news/:id" element={<NewsDetail />} />
      
      {/* Protected Routes - Home is now the first thing after login */}
      <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
      
      {/* Protected Dashboard Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="invite" element={<Invite />} />
        <Route path="growth" element={<GrowthPath />} />
        <Route path="resources" element={<Resources />} />
        <Route path="heart" element={<HeartInitiative />} />
        <Route path="academy" element={<GYLFAcademy />} />
        <Route path="academy/:id" element={<CourseDetail />} />
        <Route path="gytv" element={<GYTV />} />
        <Route path="gytv/videos" element={<VODVideos />} />
        <Route path="gytv/videos/:id" element={<VODDetail />} />
        <Route path="meetings" element={<ConnectMeetings />} />
        <Route path="prayer" element={<PrayerCloud />} />
        <Route path="testimony" element={<ShareTestimony />} />
        <Route path="faq" element={<FAQ />} />
        <Route path="partnership" element={<Partnership />} />
        <Route path="settings" element={<Settings />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
        <Route path="admin/reports" element={<AdminRoute allowRegionalLeader><Reports /></AdminRoute>} />
        <Route path="admin/notifications" element={<AdminRoute><SendNotification /></AdminRoute>} />
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
