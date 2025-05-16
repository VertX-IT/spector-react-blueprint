import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AlertCircle, Plus, Trash, GripVertical, Save } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { v4 as uuidv4 } from 'uuid';
import { useMobile } from '@/contexts/MobileContext';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

// Field types
const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textAndNumbers', label: 'Text & Numbers' },
  { value: 'numbers', label: 'Numbers Only' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'definedList', label: 'Dropdown List' },
  { value: 'location', label: 'Location' },
];

// Project categories
const PROJECT_CATEGORIES = [
  'Agriculture',
  'Education',
  'Health',
  'Infrastructure',
  'Water & Sanitation',
  'Environment',
  'Economic Development',
  'Other'
];

interface Section {
  id: string;
  name: string;
  order: number;
}

interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  sectionId: string;
  options?: string[];
  placeholder?: string;
}

interface FormState {
  name: string;
  description: string;
  category: string;
  fields: FieldTemplate[];
  sections: Section[];
}

const FormBuilderPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const { isMobile } = useMobile();
  
  const [formState, setFormState] = useState<FormState>({
    name: '',
    description: '',
    category: 'Other',
    fields: [],
    sections: [{
      id: 'section_default',
      name: 'General Information',
      order: 0
    }]
  });
  
  const [activeTab, setActiveTab] = useState('fields');
  const [activeSection, setActiveSection] = useState<string>('section_default');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fieldToEdit, setFieldToEdit] = useState<string | null>(null);
  const [isAddingSectionDialogOpen, setIsAddingSectionDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isEditingSectionDialogOpen, setIsEditingSectionDialogOpen] = useState(false);
  const [sectionToEdit, setSectionToEdit] = useState<string | null>(null);
  const [editedSectionName, setEditedSectionName] = useState('');
  const [isDeleteSectionDialogOpen, setIsDeleteSectionDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<string | null>(null);
  
  // Load project data if editing an existing project
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      
      try {
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
            
            setFormState({
              name: foundProject.name || '',
              description: foundProject.description || '',
              category: foundProject.category || 'Other',
              fields: foundProject.formFields || [],
              sections: projectSections
            });
            
            // Set active section to the first one
            if (projectSections.length > 0) {
              setActiveSection(projectSections[0].id);
            }
          } else {
            throw new Error('Project not found');
          }
        }
      } catch (error: any) {
        console.error('Error loading project:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: 'Failed to load project'
        });
      }
    };
    
    loadProject();
  }, [projectId]);
  
  // Handle field type change
  const handleFieldTypeChange = (fieldId: string, type: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId) {
          // If changing to a type that doesn't use options, remove them
          if (type !== 'definedList') {
            const { options, ...rest } = field;
            return { ...rest, type };
          }
          // If changing to a type that uses options, initialize them
          if (type === 'definedList' && !field.options) {
            return { ...field, type, options: ['Option 1'] };
          }
          return { ...field, type };
        }
        return field;
      })
    }));
  };
  
  // Handle field required toggle
  const handleRequiredToggle = (fieldId: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId) {
          return { ...field, required: !field.required };
        }
        return field;
      })
    }));
  };
  
  // Handle field name/label change
  const handleFieldChange = (fieldId: string, key: string, value: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId) {
          return { ...field, [key]: value };
        }
        return field;
      })
    }));
  };
  
  // Add a new field
  const handleAddField = () => {
    const newField: FieldTemplate = {
      id: `field_${uuidv4()}`,
      name: `Field ${formState.fields.length + 1}`,
      label: `Field ${formState.fields.length + 1}`,
      type: 'text',
      required: false,
      sectionId: activeSection,
      placeholder: ''
    };
    
    setFormState(prev => ({
      ...prev,
      fields: [...prev.fields, newField]
    }));
    
    // Set this field to be edited immediately
    setFieldToEdit(newField.id);
  };
  
  // Delete a field
  const handleDeleteField = (fieldId: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.filter(field => field.id !== fieldId)
    }));
    
    // If we were editing this field, clear the edit state
    if (fieldToEdit === fieldId) {
      setFieldToEdit(null);
    }
  };
  
  // Handle options for dropdown fields
  const handleOptionChange = (fieldId: string, optionIndex: number, value: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId && field.options) {
          const newOptions = [...field.options];
          newOptions[optionIndex] = value;
          return { ...field, options: newOptions };
        }
        return field;
      })
    }));
  };
  
  // Add a new option to a dropdown field
  const handleAddOption = (fieldId: string) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId) {
          const options = field.options || [];
          return { 
            ...field, 
            options: [...options, `Option ${options.length + 1}`] 
          };
        }
        return field;
      })
    }));
  };
  
  // Delete an option from a dropdown field
  const handleDeleteOption = (fieldId: string, optionIndex: number) => {
    setFormState(prev => ({
      ...prev,
      fields: prev.fields.map(field => {
        if (field.id === fieldId && field.options && field.options.length > 1) {
          const newOptions = [...field.options];
          newOptions.splice(optionIndex, 1);
          return { ...field, options: newOptions };
        }
        return field;
      })
    }));
  };
  
  // Handle drag and drop reordering of fields
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const { source, destination } = result;
    
    // Reordering fields
    if (result.type === 'field') {
      const reorderedFields = [...formState.fields];
      const [removed] = reorderedFields.splice(source.index, 1);
      reorderedFields.splice(destination.index, 0, removed);
      
      setFormState(prev => ({
        ...prev,
        fields: reorderedFields
      }));
    }
    
    // Reordering sections
    if (result.type === 'section') {
      const reorderedSections = [...formState.sections];
      const [removed] = reorderedSections.splice(source.index, 1);
      reorderedSections.splice(destination.index, 0, removed);
      
      // Update order property
      const updatedSections = reorderedSections.map((section, index) => ({
        ...section,
        order: index
      }));
      
      setFormState(prev => ({
        ...prev,
        sections: updatedSections
      }));
    }
  };
  
  // Save the form
  const handleSaveForm = async () => {
    if (!formState.name.trim()) {
      toast({
        variant: "destructive",
        title: "Required field missing",
        description: "Project name is required"
      });
      return;
    }
    
    if (formState.fields.length === 0) {
      toast({
        variant: "destructive",
        title: "No fields added",
        description: "Please add at least one form field"
      });
      return;
    }
    
    try {
      setIsSaving(true);
      setError(null);
      
      // Validate that all fields have required properties
      for (const field of formState.fields) {
        if (!field.type) {
          toast({
            variant: "destructive",
            title: "Invalid field",
            description: `Field ${field.name || "unnamed"} is missing a type`
          });
          setIsSaving(false);
          return;
        }
      }
      
      const sortedSections = [...formState.sections].sort((a, b) => a.order - b.order);
      
      // Check if we're editing an existing project or creating a new one
      if (projectId) {
        // Editing existing project - get the existing project from localStorage
        const storedProjects = localStorage.getItem('myProjects');
        if (!storedProjects) {
          throw new Error('No projects found');
        }
        
        const parsedProjects = JSON.parse(storedProjects);
        const existingProject = parsedProjects.find((p: any) => p.id === projectId);
        
        if (!existingProject) {
          throw new Error('Project not found');
        }
        
        // Update the existing project with new form fields, but keep the PIN
        const updatedProject = {
          ...existingProject,
          name: formState.name,
          description: formState.description,
          category: formState.category,
          formFields: formState.fields,
          formSections: sortedSections,
          // Keep the existing PIN and createdAt
          projectPin: existingProject.projectPin,
          createdAt: existingProject.createdAt
        };
        
        // Replace the project in the array
        const updatedProjects = parsedProjects.map((p: any) => 
          p.id === projectId ? updatedProject : p
        );
        
        // Save back to localStorage
        localStorage.setItem('myProjects', JSON.stringify(updatedProjects));
        
        toast({
          title: "Success",
          description: "Project updated successfully"
        });
        
        // Redirect to project view
        navigate(`/dashboard/projects/${projectId}/form`);
      } else {
        // Creating a new project
        const newProject = {
          id: `project_${uuidv4()}`,
          name: formState.name,
          description: formState.description,
          category: formState.category,
          createdAt: new Date().toISOString(),
          recordCount: 0,
          projectPin: Math.floor(100000 + Math.random() * 900000).toString(), // 6-digit PIN
          formFields: formState.fields,
          formSections: sortedSections,
          createdBy: userData?.uid || 'anonymous',
          status: 'active'
        };
        
        // Save to localStorage
        const storedProjects = localStorage.getItem('myProjects');
        const projects = storedProjects ? JSON.parse(storedProjects) : [];
        projects.push(newProject);
        localStorage.setItem('myProjects', JSON.stringify(projects));
        
        toast({
          title: "Success",
          description: "Project created successfully"
        });
        
        // Redirect to projects list
        navigate('/dashboard/my-projects');
      }
    } catch (error: any) {
      console.error('Error saving project:', error);
      setError(error.message || 'Failed to save project');
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || 'Failed to save project'
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle adding a new section
  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      toast({
        variant: "destructive",
        title: "Required field missing",
        description: "Section name is required"
      });
      return;
    }
    
    const newSection: Section = {
      id: `section_${uuidv4()}`,
      name: newSectionName,
      order: formState.sections.length
    };
    
    setFormState(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));
    
    setNewSectionName('');
    setIsAddingSectionDialogOpen(false);
    setActiveSection(newSection.id);
  };
  
  // Handle editing a section
  const handleEditSection = () => {
    if (!editedSectionName.trim() || !sectionToEdit) {
      toast({
        variant: "destructive",
        title: "Required field missing",
        description: "Section name is required"
      });
      return;
    }
    
    setFormState(prev => ({
      ...prev,
      sections: prev.sections.map(section => {
        if (section.id === sectionToEdit) {
          return { ...section, name: editedSectionName };
        }
        return section;
      })
    }));
    
    setEditedSectionName('');
    setSectionToEdit(null);
    setIsEditingSectionDialogOpen(false);
  };
  
  // Handle deleting a section
  const handleDeleteSection = () => {
    if (!sectionToDelete) return;
    
    // Check if this is the last section
    if (formState.sections.length <= 1) {
      toast({
        variant: "destructive",
        title: "Cannot delete section",
        description: "You must have at least one section"
      });
      setIsDeleteSectionDialogOpen(false);
      return;
    }
    
    // Get fields in this section
    const fieldsInSection = formState.fields.filter(field => field.sectionId === sectionToDelete);
    
    // If there are fields in this section, ask for confirmation
    if (fieldsInSection.length > 0) {
      // Move fields to the first available section that's not being deleted
      const targetSection = formState.sections.find(section => section.id !== sectionToDelete);
      
      if (targetSection) {
        setFormState(prev => ({
          ...prev,
          sections: prev.sections.filter(section => section.id !== sectionToDelete),
          fields: prev.fields.map(field => {
            if (field.sectionId === sectionToDelete) {
              return { ...field, sectionId: targetSection.id };
            }
            return field;
          })
        }));
        
        // Set active section to the target section
        setActiveSection(targetSection.id);
      }
    } else {
      // No fields in this section, just delete it
      setFormState(prev => ({
        ...prev,
        sections: prev.sections.filter(section => section.id !== sectionToDelete)
      }));
      
      // Set active section to the first available section
      const firstSection = formState.sections.find(section => section.id !== sectionToDelete);
      if (firstSection) {
        setActiveSection(firstSection.id);
      }
    }
    
    setIsDeleteSectionDialogOpen(false);
    setSectionToDelete(null);
  };
  
  // Get fields for the current active section
  const getFieldsForActiveSection = () => {
    return formState.fields.filter(field => field.sectionId === activeSection);
  };
  
  // Render the form builder
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">
            {projectId ? 'Edit Survey Form' : 'Create New Survey Form'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {projectId ? 'Modify your existing survey form' : 'Design a new data collection form'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(projectId ? `/dashboard/projects/${projectId}/form` : '/dashboard/my-projects')}
            className="flex-1 sm:flex-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveForm} 
            disabled={isSaving}
            className="flex-1 sm:flex-none"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Basic information about your data collection project</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name <span className="text-red-500">*</span></Label>
            <Input
              id="project-name"
              value={formState.name}
              onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={formState.description}
              onChange={(e) => setFormState(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter project description"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="project-category">Category</Label>
            <Select 
              value={formState.category} 
              onValueChange={(value) => setFormState(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="project-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {PROJECT_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="fields" className="flex-1">Form Fields</TabsTrigger>
          <TabsTrigger value="sections" className="flex-1">Sections</TabsTrigger>
          <TabsTrigger value="preview" className="flex-1">Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="fields">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>Design your data collection form</CardDescription>
              </div>
              <Button onClick={handleAddField} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Field
              </Button>
            </CardHeader>
            <CardContent>
              {formState.sections.length > 1 && (
                <div className="mb-4">
                  <Label htmlFor="active-section">Current Section</Label>
                  <Select 
                    value={activeSection} 
                    onValueChange={setActiveSection}
                  >
                    <SelectTrigger id="active-section">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {formState.sections.sort((a, b) => a.order - b.order).map((section) => (
                        <SelectItem key={section.id} value={section.id}>
                          {section.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {getFieldsForActiveSection().length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No fields added to this section yet.</p>
                  <p className="text-sm">Click "Add Field" to create your first field.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="fields" type="field">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-4"
                      >
                        {getFieldsForActiveSection().map((field, index) => (
                          <Draggable key={field.id} draggableId={field.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="border rounded-md p-4 bg-card"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h4 className="font-medium">
                                      {field.label || field.name || `Field ${index + 1}`}
                                    </h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setFieldToEdit(fieldToEdit === field.id ? null : field.id)}
                                    >
                                      {fieldToEdit === field.id ? 'Done' : 'Edit'}
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteField(field.id)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {fieldToEdit === field.id ? (
                                  <div className="space-y-3 mt-3 pt-3 border-t">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-name-${field.id}`}>Field Name</Label>
                                        <Input
                                          id={`field-name-${field.id}`}
                                          value={field.name}
                                          onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                                          placeholder="Internal field name"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-label-${field.id}`}>Field Label</Label>
                                        <Input
                                          id={`field-label-${field.id}`}
                                          value={field.label}
                                          onChange={(e) => handleFieldChange(field.id, 'label', e.target.value)}
                                          placeholder="Label shown to users"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-type-${field.id}`}>Field Type</Label>
                                        <Select 
                                          value={field.type} 
                                          onValueChange={(value) => handleFieldTypeChange(field.id, value)}
                                        >
                                          <SelectTrigger id={`field-type-${field.id}`}>
                                            <SelectValue placeholder="Select field type" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {FIELD_TYPES.map((type) => (
                                              <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label htmlFor={`field-placeholder-${field.id}`}>Placeholder</Label>
                                        <Input
                                          id={`field-placeholder-${field.id}`}
                                          value={field.placeholder || ''}
                                          onChange={(e) => handleFieldChange(field.id, 'placeholder', e.target.value)}
                                          placeholder="Placeholder text"
                                        />
                                      </div>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id={`required-${field.id}`}
                                        checked={field.required}
                                        onCheckedChange={() => handleRequiredToggle(field.id)}
                                      />
                                      <Label htmlFor={`required-${field.id}`}>Required field</Label>
                                    </div>
                                    
                                    {field.type === 'definedList' && (
                                      <div className="space-y-3 pt-3 border-t">
                                        <div className="flex items-center justify-between">
                                          <Label>Options</Label>
                                          <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            onClick={() => handleAddOption(field.id)}
                                          >
                                            <Plus className="mr-1 h-3 w-3" /> Add Option
                                          </Button>
                                        </div>
                                        
                                        {field.options?.map((option, optionIndex) => (
                                          <div key={optionIndex} className="flex items-center gap-2">
                                            <Input
                                              value={option}
                                              onChange={(e) => handleOptionChange(field.id, optionIndex, e.target.value)}
                                              placeholder={`Option ${optionIndex + 1}`}
                                            />
                                            {field.options && field.options.length > 1 && (
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDeleteOption(field.id, optionIndex)}
                                                className="text-destructive hover:text-destructive"
                                              >
                                                <Trash className="h-4 w-4" />
                                              </Button>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    <Badge variant="secondary">{FIELD_TYPES.find(t => t.value === field.type)?.label || field.type}</Badge>
                                    {field.required && <Badge>Required</Badge>}
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sections">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>Form Sections</CardTitle>
                <CardDescription>Organize your form into sections</CardDescription>
              </div>
              <Button onClick={() => setIsAddingSectionDialogOpen(true)} size="sm">
                <Plus className="mr-1 h-4 w-4" /> Add Section
              </Button>
            </CardHeader>
            <CardContent>
              {formState.sections.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No sections created yet.</p>
                  <p className="text-sm">Click "Add Section" to create your first section.</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections" type="section">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-3"
                      >
                        {formState.sections.sort((a, b) => a.order - b.order).map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="border rounded-md p-4 bg-card"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div {...provided.dragHandleProps} className="cursor-grab">
                                      <GripVertical className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h4 className="font-medium">{section.name}</h4>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSectionToEdit(section.id);
                                        setEditedSectionName(section.name);
                                        setIsEditingSectionDialogOpen(true);
                                      }}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSectionToDelete(section.id);
                                        setIsDeleteSectionDialogOpen(true);
                                      }}
                                      className="text-destructive hover:text-destructive"
                                      disabled={formState.sections.length <= 1}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="mt-2 text-sm text-muted-foreground">
                                  {formState.fields.filter(field => field.sectionId === section.id).length} fields
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Form Preview</CardTitle>
              <CardDescription>Preview how your form will appear to users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {formState.sections.sort((a, b) => a.order - b.order).map((section) => {
                  const sectionFields = formState.fields.filter(field => field.sectionId === section.id);
                  
                  if (sectionFields.length === 0) return null;
                  
                  return (
                    <div key={section.id} className="space-y-4">
                      <div className="mb-2">
                        <h3 className="text-lg font-medium">{section.name}</h3>
                        <Separator className="mt-2" />
                      </div>
                      
                      <div className="space-y-4 pl-0 sm:pl-2">
                        {sectionFields.map((field) => (
                          <div key={field.id} className="space-y-2">
                            <label className="text-sm font-medium flex items-center">
                              {field.label || field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            
                            {field.type === 'text' && (
                              <Input
                                disabled
                                placeholder={field.placeholder || 'Text input'}
                              />
                            )}
                            
                            {field.type === 'textAndNumbers' && (
                              <Input
                                disabled
                                placeholder={field.placeholder || 'Text & numbers input'}
                              />
                            )}
                            
                            {field.type === 'numbers' && (
                              <Input
                                type="number"
                                disabled
                                placeholder={field.placeholder || 'Numeric input'}
                              />
                            )}
                            
                            {field.type === 'textarea' && (
                              <Textarea
                                disabled
                                placeholder={field.placeholder || 'Long text input'}
                              />
                            )}
                            
                            {field.type === 'definedList' && (
                              <Select disabled>
                                <SelectTrigger>
                                  <SelectValue placeholder={field.placeholder || 'Select an option'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {field.options?.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {field.type === 'location' && (
                              <Input
                                disabled
                                placeholder={field.placeholder || 'Location selector'}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-4 flex justify-end">
                  <Button disabled>Submit Form</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Section Dialog */}
      <AlertDialog open={isAddingSectionDialogOpen} onOpenChange={setIsAddingSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Section</AlertDialogTitle>
            <AlertDialogDescription>
              Create a new section to organize your form fields.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="new-section-name">Section Name</Label>
            <Input
              id="new-section-name"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Enter section name"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddSection}>Add Section</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Section Dialog */}
      <AlertDialog open={isEditingSectionDialogOpen} onOpenChange={setIsEditingSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Section</AlertDialogTitle>
            <AlertDialogDescription>
              Update the section name.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="edit-section-name">Section Name</Label>
            <Input
              id="edit-section-name"
              value={editedSectionName}
              onChange={(e) => setEditedSectionName(e.target.value)}
              placeholder="Enter section name"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditSection}>Save Changes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Section Dialog */}
      <AlertDialog open={isDeleteSectionDialogOpen} onOpenChange={setIsDeleteSectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? Any fields in this section will be moved to another section.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FormBuilderPage;
