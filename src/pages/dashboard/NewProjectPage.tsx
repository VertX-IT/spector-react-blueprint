
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

// Form Schema for project creation
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Project name must be at least 3 characters.",
  }),
  description: z.string().optional(),
  category: z.string({
    required_error: "Please select a category.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Asset categories
const categories = [
  { id: 'land', name: 'Land' },
  { id: 'buildings', name: 'Buildings' },
  { id: 'equipment', name: 'Equipment' },
  { id: 'vehicles', name: 'Motor Vehicles' },
  { id: 'furniture', name: 'Furniture & Fixtures' },
  { id: 'it', name: 'IT Assets' },
  { id: 'other', name: 'Other' },
];

const NewProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize the form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  // Form submission handler
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // TODO: Implement actual project creation with backend
      console.log('Creating project:', data);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Project created successfully!');
      navigate('/dashboard/my-projects');
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">Create New Project</h1>
        <p className="text-sm text-muted-foreground">
          Set up a new data collection project
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder="E.g., Land Asset Survey" {...field} />
                    </FormControl>
                    <FormDescription>
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
                    <FormLabel>Asset Category</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select asset category" />
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
                    <FormDescription>
                      Select the type of assets this project will track.
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of this project's purpose..." 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard/my-projects')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create Project'}
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
