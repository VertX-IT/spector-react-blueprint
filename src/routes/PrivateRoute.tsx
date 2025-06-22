import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { currentUser, isLoading, isEmailVerified } = useAuth();
  
  // Wait until the auth state is loaded
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // Redirect to sign in if not logged in
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }
  
  // Redirect to email verification if email is not verified
  if (!isEmailVerified) {
    return <Navigate to="/email-verification" />;
  }
  
  return <>{children}</>;
};
