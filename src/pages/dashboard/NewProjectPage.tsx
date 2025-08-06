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
import InlineBackButton from '@/components/ui/CustomButton';
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
      if (data.name || data.assetName || data.description || data.category) {
        setIsSaving(true);
        autoSaveProjectData(data);
        setLastSaved(new Date());
        setIsSaving(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, isDataLoaded]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      // Save the form data to localStorage
      autoSaveProjectData(data);

      // Navigate to the next step
      navigate('/dashboard/form-builder', {
        state: { projectData: data }
      });
    } catch (error) {
      console.error('Error saving project data:', error);
      toast.error('Failed to save project data');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <InlineBackButton path="/dashboard/my-projects" />
        <h1 className="text-2xl font-bold tracking-tight mt-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Set up your project details and configuration
        </p>
      </div>

      <AutoSaveIndicator isSaving={isSaving} lastSaved={lastSaved} />

      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="mb-6">
            <ProgressSteps
              currentStep={currentStep}
              totalSteps={steps.length}
              labels={steps}
            />
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter project name"
                          {...field}
                          className={isMobile ? "h-12 text-base" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="assetName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter asset name"
                          {...field}
                          className={isMobile ? "h-12 text-base" : ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className={isMobile ? "h-12 text-base" : ""}>
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter project description (optional)"
                          {...field}
                          rows={4}
                          className={isMobile ? "text-base" : ""}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide additional details about your project
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/my-projects')}
                  className={`flex-1 ${isMobile ? "h-12 text-base" : ""}`}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 ${isMobile ? "h-12 text-base" : ""}`}
                >
                  {isSubmitting ? 'Saving...' : 'Continue to Form Builder'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NewProjectPage;
