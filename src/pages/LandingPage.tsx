import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGetStarted = () => {
    if (currentUser) {
      navigate('/dashboard/my-projects');
    } else {
      navigate('/signup');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3">
        <div className="container flex justify-between items-center">
          <div className="flex items-center">
            <Logo size="md" iconOnly={true} />
          </div>
          <div className="flex gap-2">
            {currentUser ? (
              <Button onClick={() => navigate('/dashboard/my-projects')} className="flex items-center">
                Dashboard <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/signin')}>Sign In</Button>
                <Button onClick={() => navigate('/signup')}>Sign Up</Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-16 px-4 md:py-20">
          <div className="container mx-auto text-center max-w-4xl">
            <div className="flex justify-center mb-6">
              <Logo size="lg" iconOnly={true} />
            </div>
            
            <h1 className="text-2xl md:text-3xl font-bold mb-3 text-brand-navy">
              Inspection Made Accurate.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-4">
              Capture. Record. Report.
            </p>
            
            <p className="text-md md:text-lg text-muted-foreground mb-8">
              Detailed Reports. Dependable Results.
            </p>
            
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-brand-navy hover:bg-brand-navy/90"
              >
                Get Started
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-brand-lightgray py-12 px-4 md:py-16">
          <div className="container mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8 md:mb-10 text-brand-navy">Key Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <FeatureCard 
                title="Offline Data Collection" 
                description="Collect data in remote areas without internet connection and sync when back online." 
              />
              <FeatureCard 
                title="Detailed Reporting" 
                description="Generate comprehensive reports with visual data representations for better insights." 
              />
              <FeatureCard 
                title="Evidence Collection" 
                description="Capture and store images and documents as evidence with your data entries." 
              />
              <FeatureCard 
                title="Secure Access Control" 
                description="Assign different roles to team members with appropriate permissions and access levels." 
              />
              <FeatureCard 
                title="Team Collaboration" 
                description="Share projects with team members and work together in real-time." 
              />
              <FeatureCard 
                title="Data Export" 
                description="Export collected data in various formats for analysis and reporting." 
              />
            </div>
          </div>
        </section>

        <section className="py-12 px-4 md:py-16">
          <div className="container mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 text-brand-navy">Ready to get started?</h2>
            <p className="text-lg text-muted-foreground mb-6">
              Sign up now and start collecting data with precision.
            </p>
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-brand-navy hover:bg-brand-navy/90"
            >
              Create Free Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 bg-gray-50">
        <div className="container mx-auto text-center flex flex-col items-center">
          <Logo className="mx-auto mb-4" />
          <p className="text-gray-600">&copy; {new Date().getFullYear()} SPECTOR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="bg-white border rounded-lg p-5 shadow-sm h-full">
      <h3 className="text-lg font-semibold mb-2 text-brand-navy">{title}</h3>
      <p className="text-brand-mediumgray text-sm">{description}</p>
    </div>
  );
};

export default LandingPage;
