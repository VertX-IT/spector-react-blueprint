
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { currentUser, isLoading } = useAuth();
  
  // Wait until the auth state is loaded
  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  // Redirect to dashboard if already logged in
  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
};
