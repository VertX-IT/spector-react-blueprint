
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardHomePage: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to projects page since we're removing the home button
    navigate('/dashboard/my-projects');
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-full">
      <p>Redirecting to projects...</p>
    </div>
  );
};

export default DashboardHomePage;
