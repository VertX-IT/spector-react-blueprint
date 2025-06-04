
import React from 'react';
import { JoinProjectForm } from '@/components/dashboard/JoinProjectForm';
import InlineBackButton from '@/components/ui/CustomButton';

const JoinProjectPage: React.FC = () => {
  return (
    <>
      <div className="mb-6">
        <InlineBackButton path="/dashboard/my-projects" />
        <h1 className="text-2xl font-bold tracking-tight mt-2">Join a Project</h1>
        <p className="text-muted-foreground">
          Enter the PIN code provided by the project creator to join
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <JoinProjectForm />
      </div>
    </>
  );
};

export default JoinProjectPage;
