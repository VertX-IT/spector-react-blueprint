
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

// Steps for project creation
const steps = [
  "Basic Details",
  "Form Fields",
  "Review",
  "Security"
];

interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
}

// Data types available for form fields
const dataTypes = [
  { id: 'text', name: 'Text' },
  { id: 'numbers', name: 'Numbers' },
  { id: 'textAndNumbers', name: 'Text and Numbers' },
  { id: 'textarea', name: 'Long Text' },
  { id: 'definedList', name: 'Dropdown List' },
  { id: 'location', name: 'Location' }
];

const ReviewFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(3); // Review is step 3
  const [fields, setFields] = useState<FieldTemplate[]>([]);
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });
  
  const isMobile = useIsMobile();
  
  // Retrieve form data from localStorage and URL params
  useEffect(() => {
    // Get data from localStorage
    const storedFields = localStorage.getItem('formFields');
    const storedProjectData = localStorage.getItem('projectData');
    
    if (storedFields) {
      setFields(JSON.parse(storedFields));
    }
    
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

  const handleBack = () => {
    navigate(`/dashboard/form-builder${location.search}`);
  };
  
  const handleDeploy = () => {
    toast.success('Project ready for security settings!');
    navigate(`/dashboard/security-settings${location.search}`);
  };

  const getDataTypeName = (typeId: string): string => {
    return dataTypes.find(t => t.id === typeId)?.name || typeId;
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Review Form</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Review your form layout before deploying
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
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">{projectData.assetName}</p>
              </div>
              {projectData.description && (
                <div>
                  <p className="text-sm font-semibold">Description</p>
                  <p className="text-sm text-muted-foreground">{projectData.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Form Preview</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is how your form will appear to users.
          </p>
          
          <div className={`space-y-4 mb-5 ${isMobile ? 'max-h-[50vh] overflow-y-auto pb-4' : ''}`}>
            {fields.map((field, index) => (
              <div key={index} className="space-y-1">
                <label className="block text-sm font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                
                <div className="h-10 border rounded-md px-3 bg-muted/30 flex items-center text-sm text-muted-foreground">
                  {field.type === 'text' && <span>Text input</span>}
                  {field.type === 'numbers' && <span>Numeric input</span>}
                  {field.type === 'textAndNumbers' && <span>Alphanumeric input</span>}
                  {field.type === 'textarea' && <span>Text area input</span>}
                  {field.type === 'location' && <span>Location selection</span>}
                  {field.type === 'definedList' && <span>Dropdown selection</span>}
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Type: {getDataTypeName(field.type)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? 'mx-1 shadow-sm' : ''}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Ready to Deploy?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you're satisfied with your form layout, deploy the project to set up security and user permissions.
          </p>
          
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              variant="outline"
              onClick={handleBack}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Back to Editing
            </Button>
            <Button 
              onClick={handleDeploy}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Continue to Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ReviewFormPage;
