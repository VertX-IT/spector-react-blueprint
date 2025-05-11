
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight, Check } from 'lucide-react';
import { useMobile } from '@/contexts/MobileContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

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
  const { isMobile } = useMobile();
  
  // Custom field state
  const [newField, setNewField] = useState<FieldTemplate>({
    name: '',
    type: 'text',
    required: false
  });
  
  // Edit mode state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

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
    // Store form field data (would be implemented in a real app)
    // Navigate to review page (would be implemented in a real app)
    navigate('/dashboard/review-form');
  };
  
  const handleRemoveField = (index: number) => {
    // Don't allow removing common fields (first 3)
    if (index < 3) {
      return;
    }
    
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };
  
  const handleToggleRequired = (index: number) => {
    const newFields = [...fields];
    newFields[index].required = !newFields[index].required;
    setFields(newFields);
  };
  
  const handleEditField = (index: number) => {
    setEditingIndex(index);
    setNewField({...fields[index]});
    if (isMobile) {
      setIsSheetOpen(true);
    }
  };
  
  const handleSaveEdit = () => {
    if (!newField.name.trim()) {
      return;
    }
    
    if (editingIndex !== null) {
      const newFields = [...fields];
      newFields[editingIndex] = {...newField};
      setFields(newFields);
      setEditingIndex(null);
      setNewField({ name: '', type: 'text', required: false });
      setIsSheetOpen(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewField({ name: '', type: 'text', required: false });
    setIsSheetOpen(false);
  };
  
  const handleAddField = () => {
    if (!newField.name.trim()) {
      return;
    }
    
    setFields([...fields, {...newField}]);
    setNewField({ name: '', type: 'text', required: false });
    setIsSheetOpen(false);
  };

  const getDataTypeName = (typeId: string) => {
    return dataTypes.find(t => t.id === typeId)?.name || typeId;
  };

  const renderEditForm = () => (
    <div className="w-full space-y-3">
      <div className={`flex ${isMobile ? "flex-col" : "flex-row"} gap-3`}>
        <Input 
          value={newField.name} 
          onChange={(e) => setNewField({...newField, name: e.target.value})}
          placeholder="Field name"
          className="flex-1"
        />
        <Select 
          value={newField.type}
          onValueChange={(value) => setNewField({...newField, type: value})}
        >
          <SelectTrigger className={isMobile ? "w-full h-11" : "w-[180px]"}>
            <SelectValue placeholder="Select data type" />
          </SelectTrigger>
          <SelectContent>
            {dataTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm">Required</span>
          <Switch 
            checked={newField.required}
            onCheckedChange={(checked) => setNewField({...newField, required: checked})}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={handleCancelEdit}>Cancel</Button>
        <Button size="sm" onClick={handleSaveEdit}>Save</Button>
      </div>
    </div>
  );

  const renderMobileAddFieldSheet = () => (
    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
      <SheetContent side="bottom" className="h-auto max-h-[75vh]">
        <SheetHeader>
          <SheetTitle>{editingIndex !== null ? "Edit Field" : "Add Custom Field"}</SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Field Name</label>
            <Input 
              value={newField.name} 
              onChange={(e) => setNewField({...newField, name: e.target.value})}
              placeholder="Enter field name"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Type</label>
            <Select 
              value={newField.type}
              onValueChange={(value) => setNewField({...newField, type: value})}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select data type" />
              </SelectTrigger>
              <SelectContent>
                {dataTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <span>Required</span>
            <Switch 
              checked={newField.required}
              onCheckedChange={(checked) => setNewField({...newField, required: checked})}
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button 
              className="flex-1"
              onClick={editingIndex !== null ? handleSaveEdit : handleAddField}
            >
              {editingIndex !== null ? "Save Changes" : "Add Field"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

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

      <Card className={`mb-6 ${isMobile ? "mx-0 p-0" : ""}`}>
        <CardContent className={`pt-4 ${isMobile ? "p-3" : ""}`}>
          <div className="space-y-4">
            <h2 className="text-lg font-medium">Project Information</h2>
            <div className={`grid grid-cols-1 ${!isMobile ? "md:grid-cols-2" : ""} gap-4`}>
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
                <div className={!isMobile ? "md:col-span-2" : ""}>
                  <p className="text-sm font-semibold">Description</p>
                  <p className="text-sm text-muted-foreground">{projectData.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? "mx-0 p-0" : ""}>
        <CardContent className={`pt-4 ${isMobile ? "p-3" : ""}`}>
          <h2 className="text-lg font-medium mb-4">Form Template</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This template includes standard fields for your selected asset type. You can customize the fields below.
          </p>
          
          <div className="space-y-4 mb-6">
            {fields.map((field, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between p-3 border rounded-md ${editingIndex === index ? 'border-brand-green bg-gray-50' : ''}`}
              >
                {editingIndex === index && !isMobile ? (
                  renderEditForm()
                ) : (
                  <>
                    <div className={isMobile ? "flex-1" : ""}>
                      <p className="font-medium">{field.name}</p>
                      <p className="text-xs text-muted-foreground">{getDataTypeName(field.type)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      {field.required ? (
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">Required</span>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">Optional</span>
                      )}
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleToggleRequired(index)}
                        className={`${isMobile ? "h-7 w-7" : "h-8 w-8"}`}
                        title={field.required ? "Make optional" : "Make required"}
                      >
                        {field.required ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleEditField(index)}
                        className={`${isMobile ? "h-7 w-7" : "h-8 w-8"}`}
                        title="Edit field"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveField(index)}
                        className={`${isMobile ? "h-7 w-7" : "h-8 w-8"} text-red-500`}
                        disabled={index < 3} // Don't allow removing system fields
                        title={index < 3 ? "Cannot remove system field" : "Remove field"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {isMobile ? (
            <>
              {/* Mobile "Add Custom Field" button */}
              <Button 
                variant="outline"
                className="w-full mb-6 flex items-center justify-center gap-2"
                onClick={() => {
                  setEditingIndex(null);
                  setNewField({ name: '', type: 'text', required: false });
                  setIsSheetOpen(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Add Custom Field
              </Button>
              
              {renderMobileAddFieldSheet()}
            </>
          ) : (
            /* Desktop add field form */
            <div className="border rounded-md p-4 mb-6">
              <h3 className="text-md font-medium mb-3">Add Custom Field</h3>
              <div className="flex flex-wrap gap-3 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm mb-1 block">Field Name</label>
                  <Input 
                    value={newField.name} 
                    onChange={(e) => setNewField({...newField, name: e.target.value})}
                    placeholder="Enter field name"
                  />
                </div>
                <div className="w-[180px]">
                  <label className="text-sm mb-1 block">Data Type</label>
                  <Select 
                    value={newField.type}
                    onValueChange={(value) => setNewField({...newField, type: value})}
                  >
                    <SelectTrigger>
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
                  className="flex items-center gap-1"
                  onClick={handleAddField}
                >
                  <Plus className="h-4 w-4" />
                  Add Field
                </Button>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/new-project')}
              className={isMobile ? "flex-1 h-11" : ""}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className={isMobile ? "flex-1 h-11" : ""}
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
