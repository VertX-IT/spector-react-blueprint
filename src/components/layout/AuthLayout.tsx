
import React from 'react';
import { Logo } from '@/components/ui/logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <Logo size="lg" />
          <h1 className="mt-6 text-3xl font-bold text-center">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground text-center">{subtitle}</p>}
        </div>
        <div className="bg-card shadow-lg rounded-lg p-6">
          {children}
        </div>
      </div>
    </div>
  );
};
