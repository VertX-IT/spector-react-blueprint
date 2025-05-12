
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Project, getProjectById, submitFormData, getProjectRecords } from '@/lib/projectOperations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProjectRecord {
  id?: string;
  projectId: string;
  data: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

const ProjectFormPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDesigner = userData?.role === 'designer';
  
  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('form');
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEndSurveyDialogOpen, setIsEndSurveyDialogOpen] = useState(false);
  
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        
        const projectData = await getProjectById(projectId);
        if (projectData) {
          setProject(projectData);
          
          // Initialize form data with empty values
          const initialData: Record<string, string> = {};
          if (projectData.formFields && Array.isArray(projectData.formFields)) {
            projectData.formFields.forEach((field: any) => {
              initialData[field.id] = '';
            });
          }
          setFormData(initialData);
        } else {
          throw new Error('Project not found');
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
      
      await submitFormData(project.id, formData, userData?.uid || 'anonymous');
      
      toast.success('Form submitted successfully');
      
      // Reset form
      const resetData: Record<string, string> = {};
      project.formFields?.forEach((field: any) => {
        resetData[field.id] = '';
      });
      setFormData(resetData);
      
      // Refresh data records if we're on the data tab
      if (activeTab === 'data') {
        fetchProjectRecords();
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form');
      toast.error(error.message || 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchProjectRecords = async () => {
    if (!project?.id) return;
    
    setLoadingRecords(true);
    try {
      const records = await getProjectRecords(project.id);
      setProjectRecords(records);
    } catch (error: any) {
      console.error('Error fetching records:', error);
      toast.error('Failed to load project data');
    } finally {
      setLoadingRecords(false);
    }
  };
  
  // Load data records when switching to the data tab
  useEffect(() => {
    if (activeTab === 'data' && project?.id && isDesigner) {
      fetchProjectRecords();
    }
  }, [activeTab, project?.id, isDesigner]);
  
  const handleDeleteProject = async () => {
    if (!projectId) return;
    
    try {
      // Delete the project
      const projectRef = doc(db, 'projects', projectId);
      await deleteDoc(projectRef);
      
      // Delete all records for this project
      const recordsCollection = collection(db, 'records');
      const projectRecords = await getProjectRecords(projectId);
      
      // Delete each record
      const deletePromises = projectRecords.map(record => {
        if (record.id) {
          const recordRef = doc(db, 'records', record.id);
          return deleteDoc(recordRef);
        }
        return Promise.resolve();
      });
      
      await Promise.all(deletePromises);
      
      toast.success('Project deleted successfully');
      navigate('/dashboard/my-projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleEndSurvey = async () => {
    if (!project?.id) return;
    
    try {
      // Mark project as inactive in Firestore
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        status: 'inactive',
        endedAt: new Date().toISOString()
      });
      
      setProject(prev => prev ? {...prev, status: 'inactive'} : null);
      toast.success('Survey ended successfully');
    } catch (error: any) {
      console.error('Error ending survey:', error);
      toast.error('Failed to end survey');
    } finally {
      setIsEndSurveyDialogOpen(false);
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

  const isProjectInactive = project.status === 'inactive';
  
  return (
    <>
      <div className="mb-4 flex justify-between items-start">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.description || `Data collection form for ${project.category}`}
          </p>
          {isProjectInactive && (
            <Badge variant="destructive" className="mt-2">Survey Ended</Badge>
          )}
        </div>
        
        {isDesigner && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/dashboard/projects/${projectId}/edit`)}
            >
              Edit Survey
            </Button>
            <Button
              variant="outline"
              size="sm" 
              className="text-amber-500 hover:text-amber-600"
              onClick={() => setIsEndSurveyDialogOpen(true)}
              disabled={isProjectInactive}
            >
              {isProjectInactive ? 'Survey Ended' : 'End Survey'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      
      {isDesigner ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="form">Form</TabsTrigger>
            <TabsTrigger value="data">View Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="form">
            <Card>
              <CardHeader>
                <CardTitle>Data Collection Form</CardTitle>
                <CardDescription>Fill this form to collect data for this project</CardDescription>
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
                            disabled={isProjectInactive}
                          />
                        )}
                        
                        {field.type === 'textarea' && (
                          <Textarea
                            id={field.id}
                            value={formData[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            placeholder={field.placeholder || ''}
                            required={field.required}
                            disabled={isProjectInactive}
                          />
                        )}
                        
                        {field.type === 'select' && (
                          <Select 
                            value={formData[field.id] || ''} 
                            onValueChange={(value) => handleInputChange(field.id, value)}
                            disabled={isProjectInactive}
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
                  
                  {project.formFields && project.formFields.length > 0 && !isProjectInactive && (
                    <div className="pt-4 flex justify-end space-x-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => navigate('/dashboard/my-projects')}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitting || isProjectInactive}>
                        {submitting ? 'Submitting...' : 'Submit Form'}
                      </Button>
                    </div>
                  )}
                  
                  {isProjectInactive && (
                    <Alert variant="destructive" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        This survey has been closed and is no longer accepting submissions.
                      </AlertDescription>
                    </Alert>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Collected Data</CardTitle>
                <CardDescription>View all submitted data for this project</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingRecords ? (
                  <div className="py-8 text-center">
                    <p>Loading records...</p>
                  </div>
                ) : projectRecords.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          {project.formFields?.map((field: any) => (
                            <TableHead key={field.id}>{field.label}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {projectRecords.map((record, index) => (
                          <TableRow key={record.id || index}>
                            <TableCell>
                              {new Date(record.createdAt).toLocaleDateString()}
                            </TableCell>
                            {project.formFields?.map((field: any) => (
                              <TableCell key={field.id}>
                                {record.data[field.id] || '-'}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No data has been collected for this project yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
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
                        disabled={isProjectInactive}
                      />
                    )}
                    
                    {field.type === 'textarea' && (
                      <Textarea
                        id={field.id}
                        value={formData[field.id] || ''}
                        onChange={(e) => handleInputChange(field.id, e.target.value)}
                        placeholder={field.placeholder || ''}
                        required={field.required}
                        disabled={isProjectInactive}
                      />
                    )}
                    
                    {field.type === 'select' && (
                      <Select 
                        value={formData[field.id] || ''} 
                        onValueChange={(value) => handleInputChange(field.id, value)}
                        disabled={isProjectInactive}
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
              
              {project.formFields && project.formFields.length > 0 && !isProjectInactive && (
                <div className="pt-4 flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/my-projects')}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || isProjectInactive}>
                    {submitting ? 'Submitting...' : 'Submit Form'}
                  </Button>
                </div>
              )}
              
              {isProjectInactive && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This survey has been closed and is no longer accepting submissions.
                  </AlertDescription>
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      )}
      
      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* End Survey Confirmation Dialog */}
      <AlertDialog open={isEndSurveyDialogOpen} onOpenChange={setIsEndSurveyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the survey and prevent any further submissions. You will still be able to view collected data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSurvey}>
              End Survey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectFormPage;
