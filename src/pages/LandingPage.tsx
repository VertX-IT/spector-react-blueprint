
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/contexts/AuthContext';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3">
        <div className="container flex justify-between items-center">
          <Logo />
          <div className="flex gap-4">
            {currentUser ? (
              <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
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
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-primary">SPEC</span>TOR
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Collect, manage, and analyze data with precision and reliability, even in offline environments.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/signup')}>
                Get Started
              </Button>
              <Button size="lg" variant="outline">
                Learn More
              </Button>
            </div>
          </div>
        </section>

        <section className="bg-brand-lightgray py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
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

        <section className="py-16 px-4">
          <div className="container mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Sign up now and start collecting data with precision.
            </p>
            <Button size="lg" onClick={() => navigate('/signup')}>
              Create Free Account
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 px-4 bg-brand-navy text-white">
        <div className="container mx-auto text-center">
          <Logo className="mx-auto mb-4" />
          <p>&copy; {new Date().getFullYear()} SPECTOR. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard: React.FC<{ title: string; description: string }> = ({ title, description }) => {
  return (
    <div className="bg-white border rounded-lg p-6 shadow-sm">
      <h3 className="text-xl font-semibold mb-3 text-brand-navy">{title}</h3>
      <p className="text-brand-mediumgray">{description}</p>
    </div>
  );
};

export default LandingPage;
