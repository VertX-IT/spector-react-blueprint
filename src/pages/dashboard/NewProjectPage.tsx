import React, { useState, useEffect } from 'react';
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
import { BackButton } from '@/components/ui/back-button';
import { loadProjectData, autoSaveProjectData } from '@/lib/projectCreationState';
import { AutoSaveIndicator } from '@/components/ui/auto-save-indicator';


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

const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const isMobile = useIsMobile();

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

  // Load existing project data when component mounts
  useEffect(() => {
    const loadExistingData = () => {
      const existingData = loadProjectData();
      if (existingData) {
        form.reset({
          name: existingData.name || '',
          assetName: existingData.assetName || '',
          description: existingData.description || '',
          category: existingData.category || '',
        });
      }
      setIsDataLoaded(true);
    };

    loadExistingData();
  }, [form]);

  // Auto-save form data when it changes
  useEffect(() => {
    if (!isDataLoaded) return;
    
    const subscription = form.watch((data) => {
      if (data.name || data.assetName || data.category) {
        setIsSaving(true);
        autoSaveProjectData({
          name: data.name || '',
          assetName: data.assetName || '',
          description: data.description || '',
          category: data.category || '',
        });
        
        // Simulate save completion
        setTimeout(() => {
          setIsSaving(false);
          setLastSaved(new Date());
        }, 300);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isDataLoaded]);

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);

    try {
      // Store form data for next steps
      console.log('Project details:', data);

      // Store project data in localStorage for the multi-step form process
      localStorage.setItem('projectData', JSON.stringify({
        name: data.name,
        assetName: data.assetName,
        description: data.description || '',
        category: data.category
      }));

      // Move to next step
      setCurrentStep(2);

      // Navigate to the form builder page with all project data as parameters
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
        {/* Back Button */}
        <div className="mb-3">
          <BackButton 
            to="/dashboard/my-projects"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold tracking-tight">Create New Project</h1>
          <AutoSaveIndicator 
            isSaving={isSaving}
            lastSaved={lastSaved}
          />
        </div>
        
        <p className="text-sm text-muted-foreground mb-4">
          Set up a new data collection project
        </p>

        <ProgressSteps
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      <Card className={`${isMobile ? 'mx-1 shadow-sm' : ''}`}>
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
