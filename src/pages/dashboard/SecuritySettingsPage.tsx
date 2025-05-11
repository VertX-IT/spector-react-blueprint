
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsMobile } from '@/hooks/use-mobile';

// Steps for project creation
const steps = [
  "Basic Details",
  "Form Fields",
  "Review",
  "Security"
];

const SecuritySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(4); // Security is step 4
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });
  
  const isMobile = useIsMobile();
  
  // Form states
  const [requireLogin, setRequireLogin] = useState(true);
  const [publicAccess, setPublicAccess] = useState(false);
  const [dataAccessLevel, setDataAccessLevel] = useState('team');
  const [emailDomainRestriction, setEmailDomainRestriction] = useState('');
  
  // Retrieve project data from localStorage
  useEffect(() => {
    const storedProjectData = localStorage.getItem('projectData');
    
    if (storedProjectData) {
      setProjectData(JSON.parse(storedProjectData));
    }
  }, []);

  const handleBack = () => {
    navigate(`/dashboard/review-form${location.search}`);
  };
  
  const handleFinish = () => {
    // Here you would save all the project data to your backend
    toast.success('Project successfully deployed!');
    navigate('/dashboard/my-projects');
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Configure access control for your project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Project Summary</h2>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-semibold">Project Name</p>
                <p className="text-sm text-muted-foreground">{projectData.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Type</p>
                <p className="text-sm text-muted-foreground">{projectData.category}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Access Control</h2>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Require Login</p>
                <p className="text-sm text-muted-foreground">Users must authenticate to access the form</p>
              </div>
              <Switch 
                checked={requireLogin}
                onCheckedChange={setRequireLogin}
              />
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium">Public Access</p>
                <p className="text-sm text-muted-foreground">Allow anyone with the link to access</p>
              </div>
              <Switch 
                checked={publicAccess}
                onCheckedChange={setPublicAccess}
                disabled={requireLogin}
              />
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Data Access Level</p>
              <Select
                value={dataAccessLevel}
                onValueChange={setDataAccessLevel}
              >
                <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner Only</SelectItem>
                  <SelectItem value="team">Team Members</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">Email Domain Restriction</p>
              <p className="text-sm text-muted-foreground">Limit access to specific email domains (e.g., company.com)</p>
              <Input
                value={emailDomainRestriction}
                onChange={(e) => setEmailDomainRestriction(e.target.value)}
                placeholder="e.g., company.com"
                className={isMobile ? "h-10 text-base" : ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? 'mx-1 shadow-sm' : ''}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Ready to Finish</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your project is ready to be deployed. Users will be able to access it according to your security settings.
          </p>
          
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              variant="outline"
              onClick={handleBack}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Back to Review
            </Button>
            <Button 
              onClick={handleFinish}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Finish & Deploy
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SecuritySettingsPage;
