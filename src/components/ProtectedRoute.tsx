import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

interface ProtectedRouteProps {
  readonly children: ReactNode;
  readonly requiredPermission: string;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { canAccessPage, loading, user } = usePermissions();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading) {
      setShouldRender(true);
    }
  }, [loading]);

  // Show loading state while checking permissions
  if (loading || !shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if user has permission to access this page
  if (!canAccessPage(requiredPermission)) {
    return <Navigate to="/access-denied" replace />;
  }

  // User has permission, render the page
  return <>{children}</>;
}
