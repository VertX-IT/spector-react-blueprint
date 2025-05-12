
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Project } from '@/lib/projectOperations';

const ProjectFormPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        
        // Try to fetch from Firebase first
        const projectRef = doc(db, 'projects', projectId);
        const projectDoc = await getDoc(projectRef);
        
        if (projectDoc.exists()) {
          const data = projectDoc.data();
          setProject({
            id: projectDoc.id,
            name: data.name,
            category: data.category,
            createdAt: new Date(data.createdAt),
            recordCount: data.recordCount,
            projectPin: data.projectPin,
            formFields: data.formFields || [],
            description: data.description || ''
          });
          
          // Initialize form data with empty values
          const initialData: Record<string, string> = {};
          if (data.formFields && Array.isArray(data.formFields)) {
            data.formFields.forEach((field: any) => {
              initialData[field.id] = '';
            });
          }
          setFormData(initialData);
        } else {
          // Fallback to localStorage
          const storedProjects = localStorage.getItem('myProjects');
          if (storedProjects) {
            const parsedProjects = JSON.parse(storedProjects);
            const foundProject = parsedProjects.find((p: any) => p.id === projectId);
            
            if (foundProject) {
              setProject({
                ...foundProject,
                createdAt: new Date(foundProject.createdAt),
                formFields: JSON.parse(localStorage.getItem(`formFields_${projectId}`) || '[]')
              });
              
              // Initialize form data with empty values
              const fields = JSON.parse(localStorage.getItem(`formFields_${projectId}`) || '[]');
              const initialData: Record<string, string> = {};
              fields.forEach((field: any) => {
                initialData[field.id] = '';
              });
              setFormData(initialData);
            } else {
              throw new Error('Project not found');
            }
          } else {
            throw new Error('Project not found');
          }
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        setError(error.message || 'Failed to load project');
        toast.error('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProject();
  }, [projectId]);
  
  const handleInputChange = (fieldId: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };
  
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setError(null);
      
      if (!project || !project.id) {
        throw new Error('Project data is missing');
      }
      
      // Validate required fields
      const requiredFields: string[] = [];
      project.formFields?.forEach((field: any) => {
        if (field.required && !formData[field.id]) {
          requiredFields.push(field.label);
        }
      });
      
      if (requiredFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${requiredFields.join(', ')}`);
      }
      
      // Save to Firebase
      const record = {
        projectId: project.id,
        data: formData,
        createdAt: new Date().toISOString(),
        createdBy: userData?.uid || 'anonymous',
      };
      
      const recordsCollection = collection(db, 'records');
      await addDoc(recordsCollection, record);
      
      // Update project record count in localStorage for compatibility
      const storedProjects = localStorage.getItem('myProjects');
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...p,
              recordCount: (p.recordCount || 0) + 1
            };
          }
          return p;
        });
        localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
      }
      
      toast.success('Form submitted successfully');
      
      // Reset form
      const resetData: Record<string, string> = {};
      project.formFields?.forEach((field: any) => {
        resetData[field.id] = '';
      });
      setFormData(resetData);
      
      // Navigate back to projects list
      navigate('/dashboard/my-projects');
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form');
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p>Loading project...</p>
      </div>
    );
  }
  
  if (error || !project) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {error || 'Failed to load project'}
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
        <p className="text-sm text-muted-foreground">
          {project.description || `Data collection form for ${project.category}`}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Enter Data</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {project.formFields && project.formFields.length > 0 ? (
              project.formFields.map((field: any) => (
                <div key={field.id} className="space-y-2">
                  <label 
                    htmlFor={field.id} 
                    className="text-sm font-medium flex items-center"
                  >
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  
                  {field.type === 'text' && (
                    <Input
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                    />
                  )}
                  
                  {field.type === 'textarea' && (
                    <Textarea
                      id={field.id}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      placeholder={field.placeholder || ''}
                      required={field.required}
                    />
                  )}
                  
                  {field.type === 'select' && (
                    <Select 
                      value={formData[field.id] || ''} 
                      onValueChange={(value) => handleInputChange(field.id, value)}
                    >
                      <SelectTrigger id={field.id}>
                        <SelectValue placeholder={field.placeholder || 'Select an option'} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options?.map((option: string) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <p>No form fields found for this project.</p>
              </div>
            )}
            
            {project.formFields && project.formFields.length > 0 && (
              <div className="pt-4 flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => navigate('/dashboard/my-projects')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Form'}
                </Button>
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </>
  );
};

export default ProjectFormPage;
