/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import { Copy, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { saveProject, verifyFirebaseConnection, generateSequentialPin } from '@/lib/projectOperations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetwork } from '@/contexts/NetworkContext';
import lz from 'lz-string';

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
  const { isOnline } = useNetwork();

  const isMobile = useIsMobile();
  const hasSyncedRef = useRef(false); // Track if sync has already happened

  // Generate the sequential 6-digit project PIN when component loads
  useEffect(() => {
    generate6DigitProjectPin();
    checkFirebaseConnection();
  }, []);

  // Sync offline project creation data when connection is restored
  useEffect(() => {
    console.log('Network status changed, isOnline:', isOnline); // Debug log
    if (!isOnline || hasSyncedRef.current) return;

    const syncOfflineProject = async () => {
      const offlineData = localStorage.getItem('offline_project_creation');
      if (!offlineData) {
        console.log('No offline data to sync');
        return;
      }

      hasSyncedRef.current = true; // Mark as synced to prevent re-running

      try {
        console.log('Starting offline project sync...');
        const decompressed = lz.decompress(offlineData);
        const projectCreationData = decompressed ? JSON.parse(decompressed) : null;
        if (!projectCreationData) {
          console.log('Failed to parse offline data');
          return;
        }

        // Regenerate a new PIN for the offline project
        const offlineProjectPin = await generateNewPinForSync();
        console.log('Generated new PIN for offline project:', offlineProjectPin);

        // Reconstruct complete project data
        const formFields = localStorage.getItem('formFields')
          ? JSON.parse(localStorage.getItem('formFields') || '[]')
          : [];
        const formSections = localStorage.getItem('formSections')
          ? JSON.parse(localStorage.getItem('formSections') || '[]')
          : [];
        const projectDataToSync = projectCreationData.projectData || projectCreationData.data;

        const completeProjectData = {
          name: projectDataToSync.name,
          category: projectDataToSync.category,
          assetName: projectDataToSync.assetName,
          description: projectDataToSync.description || '',
          formFields,
          formSections,
          projectPin: offlineProjectPin,
          createdAt: new Date(),
          recordCount: 0,
          createdBy: userData?.uid || 'anonymous',
        };

        // Verify Firebase connection
        const connectionCheck = await verifyFirebaseConnection();
        if (!connectionCheck.success) {
          throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
        }

        // Save to Firebase
        const savedProject = await saveProject(completeProjectData);
        console.log('Offline project saved to Firebase:', savedProject);

        // Update localStorage
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
          formSections,
          projectPin: completeProjectData.projectPin,
        };

        existingProjects.push(newProject);
        localStorage.setItem('myProjects', JSON.stringify(existingProjects));

        // Clear offline data
        localStorage.removeItem('offline_project_creation');
        localStorage.removeItem('formFields');
        localStorage.removeItem('formSections');
        localStorage.removeItem('projectData');

        toast.success('Offline project automatically synced!');
      } catch (error: any) {
        console.error('Error syncing offline project:', error);
        toast.error(`Failed to sync offline project: ${error.message}`);
        hasSyncedRef.current = false; // Allow retry on failure
      }
    };

    // Trigger sync immediately when online
    syncOfflineProject();
  }, [isOnline, userData?.uid]); // Depend on isOnline and userData for sync context

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

  // Function to generate a new PIN specifically for offline sync
  const generateNewPinForSync = async () => {
    let latestPin: string = '000000';

    // Fetch highest pin from Firebase
    let firebaseHighestPin: string = '000000';
    try {
      const pinFromFirebase = await generateSequentialPin();
      const numericPin = parseInt(pinFromFirebase);
      if (!isNaN(numericPin) && numericPin > 0) {
        firebaseHighestPin = (numericPin - 1).toString().padStart(6, '0');
      }
    } catch (e) {
      console.log('Failed to fetch PIN from Firebase, using local fallback:', e);
    }

    // Find highest pin in localStorage
    const projects = localStorage.getItem('myProjects')
      ? JSON.parse(localStorage.getItem('myProjects') || '[]')
      : [];
    let localHighestPin: string = '000000';
    if (projects.length > 0) {
      localHighestPin = projects.reduce((max: string, prj: any) => {
        if (
          typeof prj.projectPin === 'string' &&
          /^\d{6}$/.test(prj.projectPin) &&
          prj.projectPin > max
        ) {
          return prj.projectPin;
        }
        return max;
      }, '000000');
    }

    // Decide which is the latest
    latestPin = [firebaseHighestPin, localHighestPin].sort().reverse()[0] || '000000';

    // Increment for the new offline project (handle 999999 wrap)
    const numericPin = parseInt(latestPin, 10) || 0;
    let newPin = numericPin + 1;
    if (newPin > 999999) newPin = 0;
    return newPin.toString().padStart(6, '0');
  };

  // Function to generate PIN for the current page (online project)
  const generate6DigitProjectPin = async () => {
    let latestPin: string = '000000';

    // Fetch highest pin from Firebase
    let firebaseHighestPin: string = '000000';
    try {
      const pinFromFirebase = await generateSequentialPin();
      const numericPin = parseInt(pinFromFirebase);
      if (!isNaN(numericPin) && numericPin > 0) {
        firebaseHighestPin = (numericPin - 1).toString().padStart(6, '0');
      }
    } catch (e) {
      console.log('Failed to fetch PIN from Firebase, using local fallback:', e);
    }

    // Find highest pin in localStorage
    const projects = localStorage.getItem('myProjects')
      ? JSON.parse(localStorage.getItem('myProjects') || '[]')
      : [];
    let localHighestPin: string = '000000';
    if (projects.length > 0) {
      localHighestPin = projects.reduce((max: string, prj: any) => {
        if (
          typeof prj.projectPin === 'string' &&
          /^\d{6}$/.test(prj.projectPin) &&
          prj.projectPin > max
        ) {
          return prj.projectPin;
        }
        return max;
      }, '000000');
    }

    // Decide which is the latest
    latestPin = [firebaseHighestPin, localHighestPin].sort().reverse()[0] || '000000';

    // Increment for the new project (handle 999999 wrap)
    const numericPin = parseInt(latestPin, 10) || 0;
    let newPin = numericPin + 1;
    if (newPin > 999999) newPin = 0;
    const paddedPin = newPin.toString().padStart(6, '0');
    setProjectPin(paddedPin);
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
      // Get project data from localStorage
      const formFields = localStorage.getItem('formFields')
        ? JSON.parse(localStorage.getItem('formFields') || '[]')
        : [];
      const formSections = localStorage.getItem('formSections')
        ? JSON.parse(localStorage.getItem('formSections') || '[]')
        : [];

      // Combine all project data
      const completeProjectData = {
        name: projectData.name,
        category: projectData.category,
        assetName: projectData.assetName,
        description: projectData.description || '',
        formFields,
        formSections,
        projectPin,
        createdAt: new Date(),
        recordCount: 0,
        createdBy: userData?.uid || 'anonymous',
      };

      if (isOnline) {
        // Online: Proceed with Firebase submission
        const connectionCheck = await verifyFirebaseConnection();
        if (!connectionCheck.success) {
          throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
        }

        console.log('Starting project deployment process');
        console.log('Prepared project data for saving:', completeProjectData);

        // Save to Firebase
        console.log('Saving project to Firebase...');
        const savedProject = await saveProject(completeProjectData);
        console.log('Project saved to Firebase:', savedProject);

        // Update localStorage for backward compatibility
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
          formSections,
          projectPin,
        };

        existingProjects.push(newProject);
        localStorage.setItem('myProjects', JSON.stringify(existingProjects));

        // Clear form data from localStorage
        localStorage.removeItem('formFields');
        localStorage.removeItem('formSections');
        localStorage.removeItem('projectData');

        toast.success('Project successfully deployed!');
        navigate('/dashboard/my-projects');
      } else {
        // Offline: Save to localStorage and navigate to project tabs
        const compressedData = lz.compress(JSON.stringify({
          step: 'security-settings',
          projectData: completeProjectData,
        }));
        localStorage.setItem('offline_project_creation', compressedData);
        toast("Offline submission: Data will be saved after connection is restored.");
        navigate('/dashboard/my-projects');
      }
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
            Your project is ready to be deployed. Confirm to finalize the setup.
          </p>
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button
              variant="outline"
              onClick={handleBack}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Back
            </Button>
            <Button
              onClick={handleFinish}
              disabled={isDeploying}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              {isDeploying ? 'Deploying...' : 'Finish Deployment'}
            </Button>
          </div>
          {deployError && (
            <p className="text-sm text-red-500 mt-2">{deployError}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
};

export default SecuritySettingsPage;