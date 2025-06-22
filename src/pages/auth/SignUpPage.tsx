import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';

const SignUpPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Sign up to get started with Spector"
    >
      <SignUpForm />
    </AuthLayout>
  );
};

export default SignUpPage;
