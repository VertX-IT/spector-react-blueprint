
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveProject, verifyFirebaseConnection } from '@/lib/projectOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const { userData } = useAuth();
  const [currentStep] = useState(4); // Security is step 4
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });
  
  const [projectPin, setProjectPin] = useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [firebaseStatus, setFirebaseStatus] = useState<{ connected: boolean, message: string | null }>({
    connected: true,
    message: null
  });
  
  const isMobile = useIsMobile();
  
  // Generate a unique 6-digit PIN when component loads
  useEffect(() => {
    generateProjectPin();
    checkFirebaseConnection();
  }, []);
  
  // Check Firebase connection on page load
  const checkFirebaseConnection = async () => {
    try {
      const result = await verifyFirebaseConnection();
      setFirebaseStatus({
        connected: result.success,
        message: result.success ? null : (result.error || 'Unable to connect to Firebase')
      });
      
      if (!result.success) {
        toast.error(`Firebase connection issue: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Firebase connection check failed:', error);
      setFirebaseStatus({
        connected: false,
        message: error.message || 'Failed to check Firebase connection'
      });
    }
  };
  
  // Retrieve project data from localStorage
  useEffect(() => {
    const storedProjectData = localStorage.getItem('projectData');
    
    if (storedProjectData) {
      setProjectData(JSON.parse(storedProjectData));
    } else {
      // Fall back to URL params if localStorage is not available
      const params = new URLSearchParams(location.search);
      const category = params.get('category') || '';
      const name = params.get('name') || '';
      const assetName = params.get('assetName') || '';
      const description = params.get('description') || '';
      
      setProjectData({
        category,
        name,
        assetName,
        description
      });
    }
  }, [location.search]);

  const generateProjectPin = () => {
    // Generate a random 6-digit number (100000-999999)
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    setProjectPin(pin);
  };

  const handleBack = () => {
    navigate(`/dashboard/review-form${location.search}`);
  };
  
  const handleCopyPin = () => {
    navigator.clipboard.writeText(projectPin);
    toast.success('Project PIN copied to clipboard');
  };
  
  const handleFinish = async () => {
    setIsDeploying(true);
    setDeployError(null);
    
    try {
      // First verify Firebase connection
      const connectionCheck = await verifyFirebaseConnection();
      if (!connectionCheck.success) {
        throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
      }
      
      console.log('Starting project deployment process');
      
      // Get all project data
      const formFields = localStorage.getItem('formFields') 
        ? JSON.parse(localStorage.getItem('formFields') || '[]') 
        : [];
        
      // Combine all project data
      const completeProjectData = {
        name: projectData.name,
        category: projectData.category,
        assetName: projectData.assetName,
        description: projectData.description || '',
        formFields,
        projectPin,
        createdAt: new Date(),
        recordCount: 0,
        createdBy: userData?.uid || 'anonymous',
      };
      
      console.log('Prepared project data for saving:', completeProjectData);
      
      // Save to Firebase
      console.log('Saving project to Firebase...');
      const savedProject = await saveProject(completeProjectData);
      console.log('Project saved to Firebase:', savedProject);
      
      // Keep localStorage for backward compatibility
      const existingProjects = localStorage.getItem('myProjects')
        ? JSON.parse(localStorage.getItem('myProjects') || '[]')
        : [];
        
      const newProject = {
        id: savedProject.id || Date.now().toString(),
        name: completeProjectData.name,
        category: completeProjectData.category,
        assetName: completeProjectData.assetName,
        description: completeProjectData.description,
        createdAt: new Date().toISOString(),
        recordCount: 0,
        formFields,
        projectPin,
      };
      
      existingProjects.push(newProject);
      localStorage.setItem('myProjects', JSON.stringify(existingProjects));
      
      // Clear form data from localStorage
      localStorage.removeItem('formFields');
      localStorage.removeItem('projectData');
      
      toast.success('Project successfully deployed!');
      navigate('/dashboard/my-projects');
    } catch (error: any) {
      console.error('Error deploying project:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      setDeployError(errorMessage);
      toast.error(`Failed to deploy project: ${errorMessage}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Security Settings</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Configure access for your project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      {!firebaseStatus.connected && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Firebase connection issue: {firebaseStatus.message}. 
            Your project may not save correctly.
          </AlertDescription>
        </Alert>
      )}

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
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">{projectData.assetName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Project PIN</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Share this 6-digit PIN with team members to allow them to join the project
          </p>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="text-3xl font-mono tracking-widest border border-dashed border-gray-300 rounded-md py-3 px-6 bg-muted/20">
              {projectPin}
            </div>
            
            <Button 
              variant="outline" 
              onClick={handleCopyPin}
              className="flex gap-2 items-center"
            >
              <Copy className="h-4 w-4" />
              Copy PIN
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? 'mx-1 shadow-sm' : ''}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Ready to Finish</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your project is ready to be deployed. Team members can join your project using the PIN code.
          </p>
          
          {deployError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {deployError}
              </AlertDescription>
            </Alert>
          )}
          
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
              disabled={isDeploying || !firebaseStatus.connected}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              {isDeploying ? 'Deploying...' : 'Finish & Deploy'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SecuritySettingsPage;
