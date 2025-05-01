
import React from 'react';
import { JoinProjectForm } from '@/components/dashboard/JoinProjectForm';

const JoinProjectPage: React.FC = () => {
  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Join a Project</h1>
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
