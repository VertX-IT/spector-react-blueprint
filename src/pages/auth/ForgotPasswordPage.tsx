
import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Reset your password" 
      subtitle="We'll send you instructions to reset your password"
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
