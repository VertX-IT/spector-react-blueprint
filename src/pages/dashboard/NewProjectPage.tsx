
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { useIsMobile } from '@/hooks/use-mobile';
import { Copy, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { sriLankaProvinces, getDistrictsForProvince } from '@/lib/location-data';
import { cn } from '@/lib/utils';

// Form Schema for project creation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Project name must be at least 3 characters.",
  }),
  assetName: z.string().min(2, {
    message: "Asset name must be at least 2 characters.",
  }),
  description: z.string().optional(),
  category: z.string({
    required_error: "Please select a category.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Project creation steps
const steps = [
  "Basic Details",
  "Form Fields",
  "Review",
  "Security"
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

// Field template for form questions
type FieldTemplate = {
  id: string;
  question: string;
  type: string;
  required: boolean;
  options?: string[];
  isLocationField?: boolean;
  province?: string;
  district?: string;
  usePreloadedData?: boolean;
};

const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const isMobile = useIsMobile();
  const [formFields, setFormFields] = useState<FieldTemplate[]>([
    { id: crypto.randomUUID(), question: '', type: 'text', required: false }
  ]);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      assetName: '',
      description: '',
      category: '',
    },
  });

  // Add a new field to the form
  const addField = () => {
    setFormFields([
      ...formFields,
      { id: crypto.randomUUID(), question: '', type: 'text', required: false }
    ]);
  };

  // Duplicate a field
  const duplicateField = (index: number) => {
    const fieldToDuplicate = formFields[index];
    const duplicatedField = {
      ...fieldToDuplicate,
      id: crypto.randomUUID(),
      question: `${fieldToDuplicate.question} (Copy)`
    };
    
    const newFormFields = [...formFields];
    newFormFields.splice(index + 1, 0, duplicatedField);
    setFormFields(newFormFields);
    
    toast.success('Question duplicated successfully');
  };

  // Remove a field from the form
  const removeField = (index: number) => {
    if (formFields.length > 1) {
      setFormFields(formFields.filter((_, i) => i !== index));
    } else {
      toast.error('You need at least one field in the form');
    }
  };

  // Handle field changes
  const handleFieldChange = (index: number, field: Partial<FieldTemplate>) => {
    const updatedFields = [...formFields];
    updatedFields[index] = { ...updatedFields[index], ...field };
    
    // Reset location data when switching between location types
    if ('isLocationField' in field) {
      updatedFields[index] = {
        ...updatedFields[index], 
        province: undefined,
        district: undefined,
        usePreloadedData: field.isLocationField || false
      };
    }
    
    // Reset district when province changes
    if ('province' in field) {
      updatedFields[index] = {
        ...updatedFields[index], 
        district: undefined
      };
    }
    
    setFormFields(updatedFields);
  };

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Store form fields and project data
      localStorage.setItem('formFields', JSON.stringify(formFields));
      localStorage.setItem('projectData', JSON.stringify(data));
      
      // Move to next step
      setCurrentStep(2);
      
      // Navigate to the form builder page with project data
      navigate(`/dashboard/form-builder?category=${data.category}&name=${encodeURIComponent(data.name)}&assetName=${encodeURIComponent(data.assetName)}&description=${encodeURIComponent(data.description || '')}`);
      
      toast.success('Basic details saved! Ready for form creation.');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to save project details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Set up a new data collection project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      <Card className={`${isMobile ? 'mx-1 shadow-sm' : ''} mb-4`}>
        <CardContent className={`pt-4 ${isMobile ? 'px-3' : ''}`}>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Land Asset Survey" {...field} className={isMobile ? 'text-base h-12' : ''} />
                    </FormControl>
                    <FormDescription className={isMobile ? 'text-xs' : ''}>
                      Give your data collection project a descriptive name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Asset Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className={isMobile ? 'text-base h-12' : ''}>
                          <SelectValue placeholder="Select asset category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className={isMobile ? 'text-base' : ''}>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className={isMobile ? 'text-xs' : ''}>
                      Select the type of assets this project will track.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="assetName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Asset Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Main Building, Company Vehicle" {...field} className={isMobile ? 'text-base h-12' : ''} />
                    </FormControl>
                    <FormDescription className={isMobile ? 'text-xs' : ''}>
                      Enter a name for the specific asset being tracked.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this project's purpose..." 
                        className={`resize-none ${isMobile ? 'text-base' : ''}`}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium">Form Fields</h2>
                  <Button type="button" variant="outline" onClick={addField}>
                    Add Field
                  </Button>
                </div>
                
                {formFields.map((field, index) => (
                  <Card key={field.id} className="p-4 relative">
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="col-span-2">
                          <FormLabel htmlFor={`question-${index}`}>Question</FormLabel>
                          <Input
                            id={`question-${index}`}
                            value={field.question}
                            onChange={(e) => handleFieldChange(index, { question: e.target.value })}
                            placeholder="Enter question text"
                          />
                        </div>
                        
                        <div>
                          <FormLabel htmlFor={`type-${index}`}>Type</FormLabel>
                          <Select
                            value={field.type}
                            onValueChange={(value) => handleFieldChange(index, { type: value })}
                          >
                            <SelectTrigger id={`type-${index}`}>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="number">Number</SelectItem>
                              <SelectItem value="date">Date</SelectItem>
                              <SelectItem value="select">Select</SelectItem>
                              <SelectItem value="location">Location</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {field.type === 'location' && (
                        <div className="space-y-4 border-l-2 pl-4 ml-2 border-l-muted">
                          <div className="flex items-center space-x-3">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Location Settings</p>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`preloaded-data-${index}`}
                              checked={field.usePreloadedData || false}
                              onCheckedChange={(checked) => 
                                handleFieldChange(index, { 
                                  usePreloadedData: checked, 
                                  isLocationField: true 
                                })
                              }
                            />
                            <FormLabel htmlFor={`preloaded-data-${index}`} className="text-sm cursor-pointer">
                              Use preloaded location data (Sri Lanka)
                            </FormLabel>
                          </div>
                          
                          {field.usePreloadedData && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                              <div>
                                <FormLabel htmlFor={`province-${index}`}>Province</FormLabel>
                                <Select
                                  value={field.province}
                                  onValueChange={(value) => handleFieldChange(index, { province: value })}
                                >
                                  <SelectTrigger id={`province-${index}`}>
                                    <SelectValue placeholder="Select province" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sriLankaProvinces.map((province) => (
                                      <SelectItem key={province.province} value={province.province}>
                                        {province.province}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div>
                                <FormLabel htmlFor={`district-${index}`}>District</FormLabel>
                                <Select
                                  value={field.district}
                                  onValueChange={(value) => handleFieldChange(index, { district: value })}
                                  disabled={!field.province}
                                >
                                  <SelectTrigger id={`district-${index}`}>
                                    <SelectValue placeholder={field.province ? "Select district" : "Select province first"} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {field.province && 
                                      getDistrictsForProvince(field.province).map((district) => (
                                        <SelectItem key={district} value={district}>
                                          {district}
                                        </SelectItem>
                                      ))
                                    }
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`required-${index}`}
                          checked={field.required}
                          onCheckedChange={(checked) => handleFieldChange(index, { required: checked })}
                        />
                        <FormLabel htmlFor={`required-${index}`} className="text-sm cursor-pointer">
                          Required field
                        </FormLabel>
                      </div>
                      
                      <div className="flex justify-end space-x-2 pt-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateField(index)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Duplicate
                        </Button>
                        
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => removeField(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <Separator />
              
              <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/my-projects')}
                  className={isMobile ? 'h-12 text-base w-full' : ''}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className={isMobile ? 'h-12 text-base w-full' : ''}
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Form Builder'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
};

export default NewProjectPage;
