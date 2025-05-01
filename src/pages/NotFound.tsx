
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold mt-4">Page Not Found</h2>
        <p className="text-muted-foreground mt-2">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Button onClick={() => navigate('/')}>
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
