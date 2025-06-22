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
import { EmailVerificationPage } from '@/pages/auth/EmailVerificationPage';

// Legal Pages
import TermsOfServicePage from '@/pages/TermsOfServicePage';
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage';

// Dashboard Pages
import DashboardHomePage from '@/pages/dashboard/DashboardHomePage';
import JoinProjectPage from '@/pages/dashboard/JoinProjectPage';
import MyProjectsPage from '@/pages/dashboard/MyProjectsPage';
import NewProjectPage from '@/pages/dashboard/NewProjectPage';
import FormBuilderPage from '@/pages/dashboard/FormBuilderPage';
import ReviewFormPage from '@/pages/dashboard/ReviewFormPage';
import SecuritySettingsPage from '@/pages/dashboard/SecuritySettingsPage';
import ProfilePage from '@/pages/dashboard/ProfilePage';
import ProjectFormPage from '@/pages/dashboard/ProjectFormPage';
import NotFound from '@/pages/NotFound';
import EditProjectPage from "@/pages/dashboard/EditProjectPage";

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
              
              {/* Legal Routes */}
              <Route path="/terms" element={<TermsOfServicePage />} />
              <Route path="/privacy" element={<PrivacyPolicyPage />} />
              
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
                path="/email-verification" 
                element={
                  <AuthRoute>
                    <EmailVerificationPage />
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
                <Route path="form-builder" element={<FormBuilderPage />} />
                <Route path="review-form" element={<ReviewFormPage />} />
                <Route path="security-settings" element={<SecuritySettingsPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="projects/:projectId/form" element={<ProjectFormPage />} />
                <Route path="projects/:projectId/edit" element={<EditProjectPage />} />
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
