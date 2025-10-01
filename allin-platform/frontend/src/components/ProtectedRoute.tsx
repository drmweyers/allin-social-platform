'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole = [], 
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    // If authenticated but doesn't have required role, redirect to dashboard
    if (!isLoading && isAuthenticated && user && requiredRole.length > 0) {
      const hasRequiredRole = requiredRole.includes(user.role);
      if (!hasRequiredRole) {
        router.push('/dashboard');
        return;
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRole, router]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-600" />
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // If not authenticated, don't render anything (redirect will happen in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // If role is required but user doesn't have it, don't render anything
  if (requiredRole.length > 0 && user && !requiredRole.includes(user.role)) {
    return null;
  }

  // Render children if all checks pass
  return <>{children}</>;
}

export default ProtectedRoute;