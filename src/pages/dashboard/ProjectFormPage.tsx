import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge'; 
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Download, ChevronDown, ChevronUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { LocationSelector } from '@/components/survey/LocationSelector';

interface Section {
  id: string;
  name: string;
  order: number;
}

interface FieldTemplate {
  id: string;
  name?: string;
  label?: string;
  type: string;
  required: boolean;
  sectionId?: string;
  options?: string[];
  placeholder?: string;
}

interface ProjectRecord {
  id: string;
  projectId: string;
  data: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

interface Project {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin: string;
  formFields?: FieldTemplate[];
  formSections?: Section[];
  description?: string;
  status?: 'active' | 'inactive';
  endedAt?: string;
  createdBy?: string;
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
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        
        // For now, load from localStorage
        const storedProjects = localStorage.getItem('myProjects');
        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          const foundProject = parsedProjects.find((p: any) => p.id === projectId);
          
          if (foundProject) {
            // Load sections if available
            let projectSections: Section[] = [];
            
            if (foundProject.formSections && Array.isArray(foundProject.formSections)) {
              projectSections = foundProject.formSections;
            } else {
              // Create a default section if none exists
              projectSections = [{
                id: 'section_default',
                name: 'General Information',
                order: 0
              }];
            }
            
            setSections(projectSections);
            
            setProject({
              ...foundProject,
              createdAt: new Date(foundProject.createdAt),
              recordCount: foundProject.recordCount || 0,
              status: foundProject.status || 'active',
              formSections: projectSections
            });
            
            // Initialize form data with empty values
            const initialData: Record<string, string> = {};
            if (foundProject.formFields && Array.isArray(foundProject.formFields)) {
              foundProject.formFields.forEach((field: any) => {
                initialData[field.id] = '';
              });
            }
            setFormData(initialData);
          } else {
            throw new Error('Project not found');
          }
        } else {
          throw new Error('No projects found');
        }
      } catch (error: any) {
        console.error('Error fetching project:', error);
        setError(error.message || 'Failed to load project');
        toast({
          variant: "destructive",
          title: "Error",
          description: 'Failed to load project'
        });
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
          requiredFields.push(field.label || field.name);
        }
      });
      
      if (requiredFields.length > 0) {
        throw new Error(`Please fill in all required fields: ${requiredFields.join(', ')}`);
      }
      
      // Create the record
      const newRecord: ProjectRecord = {
        id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        projectId: project.id,
        data: { ...formData },
        createdAt: new Date().toISOString(),
        createdBy: userData?.uid || 'anonymous',
      };
      
      // Get existing records for this project
      let projectRecords: ProjectRecord[] = [];
      const storedRecords = localStorage.getItem(`records_${project.id}`);
      if (storedRecords) {
        projectRecords = JSON.parse(storedRecords);
      }
      
      // Add the new record
      projectRecords.push(newRecord);
      localStorage.setItem(`records_${project.id}`, JSON.stringify(projectRecords));
      
      // Update project record count
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
        
        // Update current project state
        setProject(prev => prev ? {
          ...prev,
          recordCount: (prev.recordCount || 0) + 1
        } : null);
      }
      
      toast({
        title: "Success",
        description: 'Form submitted successfully'
      });
      
      // Reset form
      const resetData: Record<string, string> = {};
      project.formFields?.forEach((field: any) => {
        resetData[field.id] = '';
      });
      setFormData(resetData);
      
      // Refresh data records if we're on the data tab
      if (activeTab === 'data') {
        fetchProjectRecords();
      } else {
        // Switch to data tab to show the submitted data
        setActiveTab('data');
        fetchProjectRecords();
      }
    } catch (error: any) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to submit form'
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const fetchProjectRecords = async () => {
    if (!project?.id) return;
    
    setLoadingRecords(true);
    try {
      // Get records from localStorage
      const storedRecords = localStorage.getItem(`records_${project.id}`);
      if (storedRecords) {
        const parsedRecords = JSON.parse(storedRecords);
        
        // Filter by current user if collector
        if (!isDesigner && userData?.uid) {
          const userRecords = parsedRecords.filter((record: ProjectRecord) => 
            record.createdBy === userData.uid
          );
          setProjectRecords(userRecords);
        } else {
          // Show all records for designers
          setProjectRecords(parsedRecords);
        }
      } else {
        setProjectRecords([]);
      }
    } catch (error: any) {
      console.error('Error fetching records:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to load project data'
      });
    } finally {
      setLoadingRecords(false);
    }
  };
  
  // Group fields by section
  const getFieldsBySection = (sectionId: string) => {
    if (!project?.formFields) return [];
    return project.formFields.filter(field => field.sectionId === sectionId);
  };
  
  // Load data records when switching to the data tab
  useEffect(() => {
    if (activeTab === 'data' && project?.id) {
      fetchProjectRecords();
    }
  }, [activeTab, project?.id]);
  
  // Helper function to format location data for display
  const formatLocationForDisplay = (locationValue: string): string => {
    try {
      const location = JSON.parse(locationValue);
      if (location.province && location.district) {
        return `${location.district}, ${location.province}`;
      }
      return locationValue;
    } catch (e) {
      return locationValue || '-';
    }
  };
  
  const handleDeleteProject = async () => {
    if (!projectId) return;
    
    try {
      // Delete the project from localStorage
      const storedProjects = localStorage.getItem('myProjects');
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.filter((p: any) => p.id !== projectId);
        localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
      }
      
      // Delete all records for this project
      localStorage.removeItem(`records_${projectId}`);
      
      toast({
        title: "Success",
        description: 'Project deleted successfully'
      });
      navigate('/dashboard/my-projects');
    } catch (error: any) {
      console.error('Error deleting project:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to delete project'
      });
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  const handleEndSurvey = async () => {
    if (!project?.id) return;
    
    try {
      // Mark project as inactive in localStorage
      const storedProjects = localStorage.getItem('myProjects');
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.map((p: any) => {
          if (p.id === project.id) {
            return {
              ...p,
              status: 'inactive',
              endedAt: new Date().toISOString()
            };
          }
          return p;
        });
        localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
      }
      
      setProject(prev => prev ? {...prev, status: 'inactive'} : null);
      toast({
        title: "Success",
        description: 'Survey ended successfully'
      });
    } catch (error: any) {
      console.error('Error ending survey:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to end survey'
      });
    } finally {
      setIsEndSurveyDialogOpen(false);
    }
  };
  
  const handleExportData = () => {
    if (!project?.id) return;
    
    try {
      // Get records for export
      const storedRecords = localStorage.getItem(`records_${project.id}`);
      if (!storedRecords) {
        toast({
          variant: "destructive",
          title: "Error",
          description: 'No data to export'
        });
        return;
      }
      
      const parsedRecords = JSON.parse(storedRecords);
      
      // Filter by current user if collector
      const recordsToExport = !isDesigner && userData?.uid ? 
        parsedRecords.filter((record: ProjectRecord) => record.createdBy === userData.uid) : 
        parsedRecords;
      
      if (recordsToExport.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: 'No data to export'
        });
        return;
      }
      
      // Format records for CSV export
      const headers = ['Record ID', 'Created At', 'Created By'];
      
      // Add form field headers
      if (project.formFields && project.formFields.length > 0) {
        project.formFields.forEach(field => {
          headers.push(field.label || field.name || '');
        });
      }
      
      // Create CSV rows
      const rows = recordsToExport.map((record: ProjectRecord) => {
        const row = [record.id, record.createdAt, record.createdBy];
        
        // Add form field values
        if (project.formFields && project.formFields.length > 0) {
          project.formFields.forEach(field => {
            row.push(record.data[field.id] || '');
          });
        }
        
        return row;
      });
      
      // Convert to CSV
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Create download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${project.name}_data_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: 'Data exported successfully'
      });
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: 'Failed to export data'
      });
    }
  };
  
  const handleNavigateToEditForm = () => {
    if (!projectId) return;
    navigate(`/dashboard/projects/${projectId}/edit`);
  };
  
  const handleToggleRowExpand = (recordId: string) => {
    setExpandedRows((prev) => {
      // If the row is already expanded, remove it (collapse)
      // Otherwise add it to the expanded rows (expand)
      return prev.includes(recordId) 
        ? prev.filter(id => id !== recordId) 
        : [...prev, recordId];
    });
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
  const projectSections = sections.length > 0 ? sections : [{
    id: 'section_default',
    name: 'General Information',
    order: 0
  }];
  
  return (
    <>
      {/* Project Header - Responsive Layout */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight line-clamp-2">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.description || `Data collection form for ${project.category}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">PIN: {project.projectPin}</Badge>
            {isProjectInactive && (
              <Badge variant="destructive" className="text-xs">Survey Ended</Badge>
            )}
          </div>
        </div>
        
        {/* Action Buttons - Moved to a separate row for mobile */}
        {isDesigner && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleNavigateToEditForm}
              className="flex-1 min-w-[80px] sm:flex-none"
            >
              Edit Survey
            </Button>
            <Button
              variant="outline"
              size="sm" 
              className="flex-1 min-w-[80px] sm:flex-none text-amber-500 hover:text-amber-600"
              onClick={() => setIsEndSurveyDialogOpen(true)}
              disabled={isProjectInactive}
            >
              {isProjectInactive ? 'Survey Ended' : 'End Survey'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[80px] sm:flex-none text-destructive hover:text-destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Delete
            </Button>
          </div>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="form" className="flex-1">Form</TabsTrigger>
          <TabsTrigger value="data" className="flex-1">View Data</TabsTrigger>
          {(!isDesigner || (isDesigner && projectRecords.length > 0)) && (
            <TabsTrigger value="export" className="flex-1">Export</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="form">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Data Collection Form</CardTitle>
              <CardDescription>Fill this form to collect data for this project</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {projectSections.sort((a, b) => a.order - b.order).map((section) => {
                  const sectionFields = getFieldsBySection(section.id);
                  
                  if (sectionFields.length === 0) return null;
                  
                  return (
                    <div key={section.id} className="mb-6">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium">{section.name}</h3>
                        <Separator className="mt-2" />
                      </div>
                      
                      <div className="space-y-4 pl-0 sm:pl-2">
                        {sectionFields.map((field: any) => (
                          <div key={field.id} className="space-y-2">
                            <label 
                              htmlFor={field.id} 
                              className="text-sm font-medium flex items-center"
                            >
                              {field.label || field.name}
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
                                className={`${isProjectInactive ? 'bg-gray-100' : ''}`}
                              />
                            )}
                            
                            {field.type === 'textAndNumbers' && (
                              <Input
                                id={field.id}
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                                disabled={isProjectInactive}
                                className={`${isProjectInactive ? 'bg-gray-100' : ''}`}
                              />
                            )}
                            
                            {field.type === 'numbers' && (
                              <Input
                                id={field.id}
                                type="number"
                                value={formData[field.id] || ''}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                placeholder={field.placeholder || ''}
                                required={field.required}
                                disabled={isProjectInactive}
                                className={`${isProjectInactive ? 'bg-gray-100' : ''}`}
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
                                className={`${isProjectInactive ? 'bg-gray-100' : ''}`}
                              />
                            )}
                            
                            {field.type === 'definedList' && (
                              <Select 
                                value={formData[field.id] || ''} 
                                onValueChange={(value) => handleInputChange(field.id, value)}
                                disabled={isProjectInactive}
                              >
                                <SelectTrigger id={field.id} className={`${isProjectInactive ? 'bg-gray-100' : ''}`}>
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
                            
                            {field.type === 'location' && (
                              <LocationSelector
                                value={formData[field.id] || ''}
                                onChange={(value) => handleInputChange(field.id, value)}
                                placeholder={field.placeholder || 'Enter location'}
                                disabled={isProjectInactive}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {project.formFields && project.formFields.length > 0 && !isProjectInactive && (
                  <div className="pt-4 flex flex-wrap gap-2 justify-end">
                    <Button 
                      type="button" 
                      variant="outline"
                      className="flex-1 sm:flex-none"
                      onClick={() => navigate('/dashboard/my-projects')}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={submitting || isProjectInactive}
                      className="flex-1 sm:flex-none"
                    >
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
          <Card className="mb-4 overflow-hidden">
            <CardHeader>
              <CardTitle>Collected Data</CardTitle>
              <CardDescription>
                {isDesigner 
                  ? "View all submitted data for this project" 
                  : "View your submitted data for this project"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="py-8 text-center">
                  <p>Loading records...</p>
                </div>
              ) : projectRecords.length > 0 ? (
                <div className="overflow-auto">
                  {/* Using responsive cards instead of a table for mobile */}
                  <div className="space-y-4">
                    {projectRecords.map((record, index) => (
                      <Card key={record.id || index} className="border">
                        <div 
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleRowExpand(record.id)}
                        >
                          <div>
                            <p className="font-medium text-sm">
                              Record {index + 1} - {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            {expandedRows.includes(record.id) ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                        {expandedRows.includes(record.id) && (
                          <CardContent className="pt-0 border-t">
                            <div className="space-y-2">
                              {project.formFields?.map((field: any) => (
                                <div key={field.id} className="grid grid-cols-2 gap-2 text-sm">
                                  <div className="font-medium text-muted-foreground">{field.label || field.name}:</div>
                                  <div>
                                    {field.type === 'location' 
                                      ? formatLocationForDisplay(record.data[field.id] || '')
                                      : record.data[field.id] || '-'}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No data has been collected for this project yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>
                {isDesigner 
                  ? "Export all collected data for this project" 
                  : "Export your submitted data for this project"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="py-6 flex flex-col items-center justify-center space-y-4">
                <p className="text-center text-muted-foreground max-w-md">
                  Click the button below to export the data as a CSV file. The file will contain all 
                  {isDesigner ? "" : " your"} data collected for this project.
                </p>
                <Button 
                  onClick={handleExportData} 
                  className="mt-4 w-full sm:w-auto"
                  disabled={projectRecords.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
                
                {projectRecords.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No data available to export
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Delete Project Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEndSurvey} className="w-full sm:w-auto">
              End Survey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectFormPage;
