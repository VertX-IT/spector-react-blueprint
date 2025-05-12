
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const joinProjectSchema = z.object({
  projectPin: z.string().length(6, { message: "Project PIN must be exactly 6 characters" })
});

type JoinProjectFormValues = z.infer<typeof joinProjectSchema>;

export const JoinProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);

  const form = useForm<JoinProjectFormValues>({
    resolver: zodResolver(joinProjectSchema),
    defaultValues: {
      projectPin: '',
    },
  });

  const onSubmit = async (values: JoinProjectFormValues) => {
    try {
      setIsJoining(true);
      
      // In a real application, this would validate the PIN against your database
      // For demo purposes, we'll check against localStorage
      const existingProjects = localStorage.getItem('myProjects')
        ? JSON.parse(localStorage.getItem('myProjects') || '[]')
        : [];
      
      const projectToJoin = existingProjects.find(
        (project: any) => project.projectPin === values.projectPin
      );
      
      if (projectToJoin) {
        // In a real app, you would add this project to the user's projects in the database
        // For now, we'll just show a success message and redirect
        toast.success('Successfully joined project!');
        navigate('/dashboard/my-projects');
      } else {
        toast.error('Invalid project PIN. Please try again.');
      }
    } catch (error) {
      console.error('Error joining project:', error);
      toast.error('Failed to join project. Please try again.');
    } finally {
      setIsJoining(false);
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
        <Button 
          type="submit" 
          form="join-project-form" 
          className="w-full" 
          disabled={isJoining}
        >
          {isJoining ? "Joining..." : "Join Project"}
        </Button>
      </CardFooter>
    </Card>
  );
};
