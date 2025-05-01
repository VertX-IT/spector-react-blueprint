
import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignInForm } from '@/components/auth/SignInForm';

const SignInPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Sign in to your account to continue"
    >
      <SignInForm />
    </AuthLayout>
  );
};

export default SignInPage;
