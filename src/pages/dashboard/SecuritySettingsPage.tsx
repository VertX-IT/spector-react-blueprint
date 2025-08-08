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
import { loadProjectData, clearProjectCreationData } from '@/lib/projectCreationState';
import { BackButton } from '@/components/ui/back-button';

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
          createdBy: userData?.uid,
          createdAt: new Date(),
          recordCount: 0,
        };

        // Check Firebase connection before syncing
        const isFirebaseConnected = await verifyFirebaseConnection();
        if (!isFirebaseConnected) {
          console.log('Firebase not connected, skipping sync');
          return;
        }

        // Save to Firebase
        await saveProject(completeProjectData);
        console.log('Offline project synced successfully');

        // Clear offline data
        localStorage.removeItem('offline_project_creation');
        localStorage.removeItem('formFields');
        localStorage.removeItem('formSections');

        toast.success('Offline project data synced successfully!');

      } catch (error: any) {
        console.error('Error syncing offline project:', error);
        toast.error('Failed to sync offline project data');
      }
    };

    syncOfflineProject();
  }, [isOnline, userData?.uid]);

  // Load project data from localStorage
  useEffect(() => {
    const loadExistingData = () => {
      const existingData = loadProjectData();
      if (existingData) {
        setProjectData({
          category: existingData.category || '',
          name: existingData.name || '',
          assetName: existingData.assetName || '',
          description: existingData.description || ''
        });
      }
    };

    loadExistingData();
  }, []);

  const checkFirebaseConnection = async () => {
    try {
      const { success, error } = await verifyFirebaseConnection();
      setFirebaseStatus({
        connected: success,
        message: success ? null : (error?.message || 'Firebase connection failed')
      });
    } catch (error) {
      setFirebaseStatus({
        connected: false,
        message: 'Failed to verify Firebase connection'
      });
    }
  };

  const generateNewPinForSync = async () => {
    try {
      // Get the latest PIN from Firebase
      const latestPin = await generateSequentialPin();
      return latestPin;
    } catch (error) {
      console.error('Error generating new PIN for sync:', error);
      // Fallback to a timestamp-based PIN
      return Date.now().toString().slice(-6);
    }
  };

  const generate6DigitProjectPin = async () => {
    try {
      const pin = await generateSequentialPin();
      setProjectPin(pin);
    } catch (error) {
      console.error('Error generating project PIN:', error);
      toast.error('Failed to generate project PIN');
    }
  };

  const handleBack = () => {
    navigate('/dashboard/review-form');
  };

  const handleCopyPin = () => {
    if (projectPin) {
      navigator.clipboard.writeText(projectPin);
      toast.success('Project PIN copied to clipboard!');
    }
  };

  const handleFinish = async () => {
    if (!projectData.name || !projectData.category) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsDeploying(true);
    setDeployError(null);

    try {
      // Get form data from localStorage
      const formFields = localStorage.getItem('formFields')
        ? JSON.parse(localStorage.getItem('formFields') || '[]')
        : [];
      const formSections = localStorage.getItem('formSections')
        ? JSON.parse(localStorage.getItem('formSections') || '[]')
        : [];

      const projectToSave = {
        name: projectData.name,
        category: projectData.category,
        assetName: projectData.assetName,
        description: projectData.description,
        formFields,
        formSections,
        projectPin,
        createdBy: userData?.uid,
        createdAt: new Date(),
        recordCount: 0,
      };

      if (isOnline) {
        // Save to Firebase if online
        await saveProject(projectToSave);
        toast.success('Project created successfully!');
      } else {
        // Save to localStorage if offline
        const compressedData = lz.compress(JSON.stringify({
          projectData: projectToSave,
          timestamp: new Date().toISOString()
        }));
        localStorage.setItem('offline_project_creation', compressedData);
        toast.success('Project saved offline! Will sync when connection is restored.');
      }

      // Clear project creation data
      clearProjectCreationData();

      // Navigate to projects page
      navigate('/dashboard/my-projects');

    } catch (error: any) {
      console.error('Error creating project:', error);
      setDeployError(error.message || 'Failed to create project');
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <>
      <div className="mb-4 px-1">
        <div className="mb-3">
          <BackButton 
            to={`/dashboard/review-form${location.search}`}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        
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