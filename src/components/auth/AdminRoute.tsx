import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AdminRouteProps {
  children: React.ReactNode;
  /** If true, allows regional_leader role access as well as admin */
  allowRegionalLeader?: boolean;
}

/**
 * Route guard component for admin-only pages
 * Redirects non-admin users to dashboard before any data fetching occurs
 */
const AdminRoute = ({ children, allowRegionalLeader = false }: AdminRouteProps) => {
  const { user, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const hasAccess = role === 'admin' || (allowRegionalLeader && role === 'regional_leader');

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
