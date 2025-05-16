
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Plus, Trash } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { v4 as uuidv4 } from 'uuid';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { useIsMobile } from '@/hooks/use-mobile';

// Field types
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textAndNumbers', label: 'Text & Numbers' },
  { value: 'numbers', label: 'Numbers Only' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'definedList', label: 'Dropdown List' },
  { value: 'location', label: 'Location' }
];

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
  const { userData } = useAuth();
  const isMobile = useIsMobile();
  const [currentStep] = useState(2); // Form Builder is step 2
  
  const [formFields, setFormFields] = useState<Array<{
    id: string;
    name: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
    placeholder?: string;
  }>>([]);
  
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Parse query params on load to get project data
  useEffect(() => {
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
    
    // Also try to load from localStorage in case we're returning to this page
    const storedData = localStorage.getItem('projectData');
    const storedFields = localStorage.getItem('formFields');
    
    if (storedData) {
      setProjectData(JSON.parse(storedData));
    }
    
    if (storedFields) {
      setFormFields(JSON.parse(storedFields));
    }
  }, [location.search]);

  // Handle adding a new field
  const handleAddField = () => {
    const newField = {
      id: `field_${uuidv4()}`,
      name: `Field ${formFields.length + 1}`,
      label: `Field ${formFields.length + 1}`,
      type: 'text',
      required: false,
      placeholder: ''
    };
    
    setFormFields([...formFields, newField]);
  };
  
  // Handle deleting a field
  const handleDeleteField = (id: string) => {
    setFormFields(formFields.filter(field => field.id !== id));
  };
  
  // Handle field property changes
  const handleFieldChange = (id: string, key: string, value: string | boolean) => {
    setFormFields(formFields.map(field => {
      if (field.id === id) {
        return { ...field, [key]: value };
      }
      return field;
    }));
  };
  
  // Handle adding an option to a dropdown field
  const handleAddOption = (fieldId: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId) {
        const options = field.options || [];
        return {
          ...field,
          options: [...options, `Option ${options.length + 1}`]
        };
      }
      return field;
    }));
  };
  
  // Handle modifying an option in a dropdown field
  const handleOptionChange = (fieldId: string, optionIndex: number, value: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options) {
        const newOptions = [...field.options];
        newOptions[optionIndex] = value;
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };
  
  // Handle removing an option from a dropdown field
  const handleRemoveOption = (fieldId: string, optionIndex: number) => {
    setFormFields(formFields.map(field => {
      if (field.id === fieldId && field.options && field.options.length > 1) {
        const newOptions = [...field.options];
        newOptions.splice(optionIndex, 1);
        return { ...field, options: newOptions };
      }
      return field;
    }));
  };
  
  // Handle field type change
  const handleFieldTypeChange = (id: string, type: string) => {
    setFormFields(formFields.map(field => {
      if (field.id === id) {
        // If changing to a type that doesn't use options, remove them
        if (type !== 'definedList') {
          const { options, ...rest } = field;
          return { ...rest, type };
        }
        
        // If changing to dropdown and no options exist, add default options
        if (type === 'definedList' && !field.options) {
          return {
            ...field,
            type,
            options: ['Option 1']
          };
        }
        
        return { ...field, type };
      }
      return field;
    }));
  };
  
  // Handle continuing to the review stage
  const handleContinue = () => {
    if (formFields.length === 0) {
      toast({
        variant: "destructive",
        title: "No fields added",
        description: "Please add at least one form field"
      });
      return;
    }
    
    try {
      // Save form fields to localStorage for the next step
      localStorage.setItem('formFields', JSON.stringify(formFields));
      
      // Navigate to review page with project data as URL params
      const params = new URLSearchParams();
      params.append('category', projectData.category);
      params.append('name', projectData.name);
      params.append('assetName', projectData.assetName);
      params.append('description', projectData.description);
      
      navigate(`/dashboard/review-form?${params.toString()}`);
    } catch (error: any) {
      console.error('Error saving form fields:', error);
      setError(error.message || 'Failed to continue to review');
    }
  };

  // Handle going back to project details
  const handleBack = () => {
    navigate('/dashboard/new-project');
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Form Builder</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Create the data collection form for your project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardHeader className="pb-2">
          <CardTitle>Project: {projectData.name}</CardTitle>
          <CardDescription>
            {projectData.category} • {projectData.assetName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Form Fields</h3>
            <Button onClick={handleAddField} size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Add Field
            </Button>
          </div>
          
          <div className="space-y-6">
            {formFields.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">No fields added yet</p>
                <p className="text-xs text-muted-foreground mt-1">Click 'Add Field' to create your first form field</p>
              </div>
            ) : (
              formFields.map((field, index) => (
                <Card key={field.id} className="relative border shadow-sm">
                  <CardContent className="pt-4 pb-2">
                    <div className="absolute top-2 right-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteField(field.id)}>
                        <Trash className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`field-name-${field.id}`}>Field Label</Label>
                          <Input 
                            id={`field-name-${field.id}`}
                            value={field.label} 
                            onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)} 
                            placeholder="Enter field label"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                          <Select 
                            value={field.type}
                            onValueChange={(value) => handleFieldTypeChange(field.id, value)}
                          >
                            <SelectTrigger id={`field-type-${field.id}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {FIELD_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder Text</Label>
                          <Input 
                            id={`field-placeholder-${field.id}`}
                            value={field.placeholder || ''} 
                            onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)} 
                            placeholder="Enter placeholder text"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 h-full pt-6">
                          <Switch 
                            id={`field-required-${field.id}`}
                            checked={field.required}
                            onCheckedChange={(checked) => handleFieldChange(field.id, 'required', checked)}
                          />
                          <Label htmlFor={`field-required-${field.id}`}>Required Field</Label>
                          
                          {field.required && (
                            <Badge className="ml-auto" variant="outline">Required</Badge>
                          )}
                        </div>
                      </div>
                      
                      {field.type === 'definedList' && (
                        <div className="space-y-3 pt-2">
                          <Label>Dropdown Options</Label>
                          
                          <div className="space-y-2">
                            {field.options?.map((option, optIndex) => (
                              <div key={optIndex} className="flex items-center space-x-2">
                                <Input 
                                  value={option}
                                  onChange={(e) => handleOptionChange(field.id, optIndex, e.target.value)} 
                                  placeholder={`Option ${optIndex + 1}`}
                                />
                                
                                {(field.options && field.options.length > 1) && (
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-9 w-9 shrink-0"
                                    onClick={() => handleRemoveOption(field.id, optIndex)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            ))}
                            
                            <Button 
                              variant="outline" 
                              type="button" 
                              size="sm" 
                              className="mt-2"
                              onClick={() => handleAddOption(field.id)}
                            >
                              Add Option
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className={`flex gap-2 ${isMobile ? 'flex-col mx-1' : ''}`}>
        <Button 
          variant="outline" 
          onClick={handleBack}
          className={`${isMobile ? 'h-12 text-base' : ''}`}
        >
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={isSaving || formFields.length === 0}
          className={`${isMobile ? 'h-12 text-base' : ''}`}
        >
          {isSaving ? "Saving..." : "Continue to Review"}
        </Button>
      </div>
    </>
  );
};

export default FormBuilderPage;
