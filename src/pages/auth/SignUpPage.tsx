
import React from 'react';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { SignUpForm } from '@/components/auth/SignUpForm';

const SignUpPage: React.FC = () => {
  return (
    <AuthLayout 
      title="Create an account" 
      subtitle="Sign up to get started with SurveySync Nexus"
    >
      <SignUpForm />
    </AuthLayout>
  );
};

export default SignUpPage;
