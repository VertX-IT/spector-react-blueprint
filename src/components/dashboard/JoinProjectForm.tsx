
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

const joinProjectSchema = z.object({
  projectPin: z.string().length(6, { message: "Project PIN must be exactly 6 characters" })
});

type JoinProjectFormValues = z.infer<typeof joinProjectSchema>;

export const JoinProjectForm: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm<JoinProjectFormValues>({
    resolver: zodResolver(joinProjectSchema),
    defaultValues: {
      projectPin: '',
    },
  });

  const onSubmit = async (values: JoinProjectFormValues) => {
    try {
      // TODO: Implement Firebase logic to join a project
      console.log('Joining project with PIN:', values.projectPin);
      
      // Navigate to the joined project
      navigate('/dashboard/my-projects');
    } catch (error) {
      console.error('Error joining project:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join a Project</CardTitle>
        <CardDescription>
          Enter the 6-digit PIN provided by the project creator to join.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form id="join-project-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="projectPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project PIN</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter 6-digit PIN" 
                      {...field} 
                      className="text-center text-2xl tracking-widest font-mono"
                      maxLength={6}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="join-project-form" className="w-full" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Joining..." : "Join Project"}
        </Button>
      </CardFooter>
    </Card>
  );
};
