
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { toast } from 'sonner';

// Template types for different asset categories
interface FieldTemplate {
  name: string;
  type: string;
  required: boolean;
}

// Asset categories
const categories = [
  { id: 'land', name: 'Land' },
  { id: 'buildings', name: 'Buildings' },
  { id: 'biological', name: 'Biological Assets' },
  { id: 'machinery', name: 'Machinery' },
  { id: 'furniture', name: 'Furniture & Fixtures' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'vehicles', name: 'Motor Vehicles' },
  { id: 'other', name: 'Other' },
];

// Template definitions for each asset category
const templatesByCategory: Record<string, FieldTemplate[]> = {
  land: [
    { name: 'Land Name', type: 'text', required: true },
    { name: 'Address', type: 'textAndNumbers', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  buildings: [
    { name: 'Building Name', type: 'text', required: true },
    { name: 'Address', type: 'textAndNumbers', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Year of Construction', type: 'numbers', required: false },
    { name: 'Building Area', type: 'definedList', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Condition', type: 'definedList', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  biological: [
    { name: 'Location', type: 'text', required: true },
    { name: 'Field Name', type: 'text', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Species', type: 'text', required: true },
    { name: 'Inspection Image', type: 'image', required: true },
    { name: 'Diameter', type: 'numbers', required: false },
    { name: 'Comments', type: 'text', required: false }
  ],
  machinery: [
    { name: 'Machine Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  furniture: [
    { name: 'Furniture Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  equipment: [
    { name: 'Equipment Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  vehicles: [
    { name: 'Vehicle Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Model', type: 'text', required: true },
    { name: 'YOM', type: 'numbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  other: [
    { name: 'Record No.', type: 'textAndNumbers', required: true },
    { name: 'User ID', type: 'textAndNumbers', required: true },
    { name: 'Date and Time', type: 'dateTime', required: true }
  ]
};

// Project creation steps
const steps = [
  "Basic Details",
  "Form Fields",
  "Review",
  "Security"
];

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(2);
  const [fields, setFields] = useState<FieldTemplate[]>([]);
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });

  // This would be populated from the previous step in a real implementation
  useEffect(() => {
    // For now, simulate data being passed from previous step
    // In a real app, this would be passed through state management or URL params
    const category = new URLSearchParams(location.search).get('category') || 'land';
    
    // Set project data
    setProjectData({
      category,
      name: 'Sample Project',
      assetName: 'Sample Asset',
      description: 'This is a sample project'
    });

    // Set initial fields based on category
    setFields([
      // Common fields for all forms
      { name: 'Record No.', type: 'textAndNumbers', required: true },
      { name: 'User ID', type: 'textAndNumbers', required: true },
      { name: 'Date and Time', type: 'dateTime', required: true },
      // Template-specific fields
      ...(templatesByCategory[category] || [])
    ]);
  }, [location.search]);

  const handleNext = () => {
    // Store form field data (would be implemented in a real app)
    toast.success('Form template saved! Ready for review.');
    // Navigate to review page (would be implemented in a real app)
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Create Form Fields</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Define the data you want to collect in this project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      <Card className="mb-6">
        <CardContent className="pt-4">
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Project Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold">Project Name</p>
                <p className="text-sm text-muted-foreground">{projectData.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Type</p>
                <p className="text-sm text-muted-foreground">
                  {categories.find(c => c.id === projectData.category)?.name || projectData.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">{projectData.assetName}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <h2 className="text-lg font-medium mb-4">Form Template</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This template includes standard fields for your selected asset type. You can add custom fields below.
          </p>
          
          <div className="space-y-4 mb-6">
            {fields.map((field, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                <div>
                  <p className="font-medium">{field.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{field.type.replace(/([A-Z])/g, ' $1')}</p>
                </div>
                <div className="flex items-center">
                  {field.required && (
                    <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full mr-2">Required</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Button 
            variant="outline" 
            className="w-full mb-4"
            onClick={() => toast.info('Add custom field functionality will be implemented in the next iteration')}
          >
            + Add Custom Field
          </Button>
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/new-project')}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
            >
              Continue to Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FormBuilderPage;
