
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { AuthProvider } from '@/contexts/AuthContext';
import { NetworkProvider } from '@/contexts/NetworkContext';
import { MobileProvider } from '@/contexts/MobileContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { PrivateRoute } from '@/routes/PrivateRoute';
import { AuthRoute } from '@/routes/AuthRoute';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Import CSS
import './mobile.css';

// Auth Pages
import LandingPage from '@/pages/LandingPage';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';

// Dashboard Pages
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage';
import JoinProjectPage from '@/pages/dashboard/JoinProjectPage';
import MyProjectsPage from '@/pages/dashboard/MyProjectsPage';
import NewProjectPage from '@/pages/dashboard/NewProjectPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import NotFound from '@/pages/NotFound';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <NetworkProvider>
        <MobileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              
              {/* Auth Routes */}
              <Route 
                path="/signin" 
                element={
                  <AuthRoute>
                    <SignInPage />
                  </AuthRoute>
                } 
              />
              <Route 
                path="/signup" 
                element={
                  <AuthRoute>
                    <SignUpPage />
                  </AuthRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <AuthRoute>
                    <ForgotPasswordPage />
                  </AuthRoute>
                } 
              />
              
              {/* Dashboard Routes */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <DashboardLayout />
                  </PrivateRoute>
                }
              >
                <Route index element={<DashboardHomePage />} />
                <Route path="join-project" element={<JoinProjectPage />} />
                <Route path="my-projects" element={<MyProjectsPage />} />
                <Route path="new-project" element={<NewProjectPage />} />
                <Route path="profile" element={<ProfilePage />} />
              </Route>
              
              {/* Redirect /dashboard to /dashboard */}
              <Route path="/dashboard/*" element={<Navigate to="/dashboard" replace />} />
              
              {/* Not Found */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </MobileProvider>
      </NetworkProvider>
    </AuthProvider>
  );
};

export default App;
