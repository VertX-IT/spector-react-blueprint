
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  
  // Wait until the auth state is loaded
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // Redirect to sign in if not logged in
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }
  
  return <>{children}</>;
};
