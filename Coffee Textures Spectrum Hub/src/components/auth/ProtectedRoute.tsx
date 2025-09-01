import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { AuthModal } from './AuthModal';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  fallback,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (requireAuth && !isAuthenticated && !isLoading) {
      setShowAuthModal(true);
    }
  }, [isAuthenticated, isLoading, requireAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      setShowAuthModal(false);
    }
  }, [isAuthenticated]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-roast-light border-t-roast-medium rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-roast-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth not required or user is authenticated, show children
  if (!requireAuth || isAuthenticated) {
    return <>{children}</>;
  }

  // Show fallback content with auth modal
  return (
    <>
      {fallback || (
        <div className="min-h-screen bg-cream flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-roast-medium/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-roast-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-roast-dark mb-4">Authentication Required</h2>
            <p className="text-roast-medium mb-6">
              Please sign in to access your subscription dashboard and manage your coffee preferences.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-6 py-3 bg-roast-medium text-cream rounded-lg hover:bg-roast-dark transition-colors font-medium"
            >
              Sign In
            </button>
          </div>
        </div>
      )}
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
}