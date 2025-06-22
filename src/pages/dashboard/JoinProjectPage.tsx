import React from 'react';
import { JoinProjectForm } from '@/components/dashboard/JoinProjectForm';
import { BackButton } from '@/components/ui/back-button';

const JoinProjectPage: React.FC = () => {
  return (
    <>
      <div className="mb-4 px-1">
        {/* Back Button */}
        <div className="mb-3">
          <BackButton 
            to="/dashboard"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        
        <h1 className="text-xl font-bold tracking-tight">Join a Project</h1>
        <p className="text-sm text-muted-foreground">
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
