import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight, Check, X } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

// Template types for different asset categories
interface FieldTemplate {
  name: string;
  type: string;
  required: boolean;
}

// Data types available for form fields
const dataTypes = [
  { id: 'text', name: 'Text' },
  { id: 'numbers', name: 'Numbers' },
  { id: 'textAndNumbers', name: 'Text and Numbers' },
  { id: 'coordinates', name: 'Geographical Coordinates' },
  { id: 'image', name: 'Image (Take new, Add existing)' },
  { id: 'definedList', name: 'Defined List (Select One)' },
  { id: 'checkbox', name: 'Checkbox (Yes/No)' },
  { id: 'multipleChoice', name: 'Multiple Choice' },
  { id: 'qrBarcode', name: 'QR/Barcode Reader' },
  { id: 'dateTime', name: 'Date and Time' },
];

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
  
  const isMobile = useIsMobile();
  
  // Custom field state
  const [newField, setNewField] = useState<FieldTemplate>({
    name: '',
    type: 'text',
    required: false
  });
  
  // Edit mode state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // This would be populated from the previous step in a real implementation
  useEffect(() => {
    // Get category from URL params
    const category = new URLSearchParams(location.search).get('category') || 'land';
    
    // In a real app, you would fetch project data from context/state management
    const urlParams = new URLSearchParams(location.search);
    
    // Set project data from URL params
    setProjectData({
      category,
      name: urlParams.get('name') || 'Sample Project',
      assetName: urlParams.get('assetName') || 'Sample Asset',
      description: urlParams.get('description') || 'This is a sample project'
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
    // Store form fields in URL params to pass to review page
    const searchParams = new URLSearchParams(location.search);
    
    // Save form field data in localStorage for the review page
    localStorage.setItem('formFields', JSON.stringify(fields));
    localStorage.setItem('projectData', JSON.stringify(projectData));
    
    toast.success('Form template saved! Ready for review.');
    
    // Navigate to review page with the same URL parameters
    navigate(`/dashboard/review-form?${searchParams.toString()}`);
  };
  
  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    toast.success('Field removed');
  };
  
  const handleToggleRequired = (index: number) => {
    const newFields = [...fields];
    newFields[index].required = !newFields[index].required;
    setFields(newFields);
  };
  
  const handleEditField = (index: number) => {
    setEditingIndex(index);
    setNewField({...fields[index]});
    setIsDialogOpen(true);
  };
  
  const handleSaveEdit = () => {
    if (!newField.name.trim()) {
      toast.error('Field name cannot be empty');
      return;
    }
    
    if (editingIndex !== null) {
      const newFields = [...fields];
      newFields[editingIndex] = {...newField};
      setFields(newFields);
      setEditingIndex(null);
      setNewField({ name: '', type: 'text', required: false });
      setIsDialogOpen(false);
      toast.success('Field updated');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewField({ name: '', type: 'text', required: false });
    setIsDialogOpen(false);
  };
  
  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast.error('Please enter a field name');
      return;
    }
    
    setFields([...fields, {...newField}]);
    setNewField({ name: '', type: 'text', required: false });
    toast.success('Custom field added');
  };

  const getDataTypeName = (typeId: string) => {
    return dataTypes.find(t => t.id === typeId)?.name || typeId;
  };

  return (
    <>
      <div className="mb-4 px-1">
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

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Project Information</h2>
            <div className="grid grid-cols-1 gap-2">
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

      <Card className={isMobile ? 'mx-1 shadow-sm' : ''}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Form Template</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This template includes standard fields for your selected asset type. You can customize the fields below.
          </p>
          
          <div className={`space-y-3 mb-5 ${isMobile ? 'max-h-[60vh] overflow-y-auto pb-2' : ''}`}>
            {fields.map((field, index) => (
              <div 
                key={index} 
                className={`flex flex-col ${isMobile ? 'p-2' : 'p-3'} border rounded-md`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`font-medium ${isMobile ? 'text-base' : ''}`}>{field.name}</p>
                    <p className="text-xs text-muted-foreground">{getDataTypeName(field.type)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {field.required ? (
                      <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">Required</span>
                    ) : (
                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">Optional</span>
                    )}
                  </div>
                </div>
                
                {isMobile && (
                  <div className="flex mt-2 border-t pt-2 justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleToggleRequired(index)}
                      className="flex-1 text-xs h-8"
                    >
                      {field.required ? "Make Optional" : "Make Required"}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEditField(index)}
                      className="flex-1 text-xs h-8"
                    >
                      Edit
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                      className="flex-1 text-xs h-8 text-red-500"
                    >
                      Remove
                    </Button>
                  </div>
                )}
                
                {!isMobile && (
                  <div className="flex items-center gap-2 mt-2 justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleRequired(index)}
                      className="h-8 w-8"
                      title={field.required ? "Make optional" : "Make required"}
                    >
                      {field.required ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditField(index)}
                      className="h-8 w-8"
                      title="Edit field"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleRemoveField(index)}
                      className="h-8 w-8 text-red-500"
                      title="Remove field"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className={`border rounded-md p-3 mb-5 ${isMobile ? 'space-y-3' : ''}`}>
            <h3 className="text-md font-medium mb-3">Add Custom Field</h3>
            <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-3 items-end`}>
              <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
                <label className="text-sm mb-1 block">Field Name</label>
                <Input 
                  value={newField.name} 
                  onChange={(e) => setNewField({...newField, name: e.target.value})}
                  placeholder="Enter field name"
                  className={isMobile ? "h-10 text-base" : ""}
                />
              </div>
              <div className={isMobile ? 'w-full' : 'w-[180px]'}>
                <label className="text-sm mb-1 block">Data Type</label>
                <Select 
                  value={newField.type}
                  onValueChange={(value) => setNewField({...newField, type: value})}
                >
                  <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Required</span>
                <Switch 
                  checked={newField.required}
                  onCheckedChange={(checked) => setNewField({...newField, required: checked})}
                />
              </div>
              <Button 
                variant="outline" 
                className={`flex items-center gap-1 ${isMobile ? 'w-full h-10 text-base' : ''}`}
                onClick={handleAddField}
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
          </div>
          
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/new-project')}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Continue to Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for editing fields */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[90%] max-w-md p-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Edit Field</DialogTitle>
            <DialogDescription className="text-center">
              Make changes to your form field below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Field Name</label>
              <Input 
                value={newField.name} 
                onChange={(e) => setNewField({...newField, name: e.target.value})}
                placeholder="Field name"
                className={isMobile ? "h-10 text-base" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select 
                value={newField.type}
                onValueChange={(value) => setNewField({...newField, type: value})}
              >
                <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className={isMobile ? "text-base" : ""}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className={`${isMobile ? "text-base" : "text-sm"} font-medium`}>Required Field</span>
              <Switch 
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({...newField, required: checked})}
              />
            </div>
          </div>
          
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormBuilderPage;
