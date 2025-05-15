
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressSteps } from '@/components/ui/progress-steps';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { 
  DropdownMenu,
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight, Check, X, ListOrdered, ArrowDown, ArrowUp, Grab } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Separator } from '@/components/ui/separator';

// Template types for different asset categories
interface FieldTemplate {
  name: string;
  type: string;
  required: boolean;
  sectionId?: string;
}

interface Section {
  id: string;
  name: string;
  order: number;
}

// Data types available for form fields
const dataTypes = [
  { id: 'text', name: 'Text' },
  { id: 'numbers', name: 'Numbers' },
  { id: 'textAndNumbers', name: 'Text and Numbers' },
  { id: 'coordinates', name: 'Geographical Coordinates' },
  { id: 'image', name: 'Image (Take new, Add existing)' },
  { id: 'definedList', name: 'Defined List (Select One)' },
  { id: 'checkbox', name: 'Checkbox (Yes/No)' },
  { id: 'multipleChoice', name: 'Multiple Choice' },
  { id: 'qrBarcode', name: 'QR/Barcode Reader' },
  { id: 'dateTime', name: 'Date and Time' },
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

// Template definitions for each asset category
const templatesByCategory: Record<string, FieldTemplate[]> = {
  land: [
    { name: 'Land Name', type: 'text', required: true },
    { name: 'Address', type: 'textAndNumbers', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  buildings: [
    { name: 'Building Name', type: 'text', required: true },
    { name: 'Address', type: 'textAndNumbers', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Year of Construction', type: 'numbers', required: false },
    { name: 'Building Area', type: 'definedList', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Condition', type: 'definedList', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  biological: [
    { name: 'Location', type: 'text', required: true },
    { name: 'Field Name', type: 'text', required: true },
    { name: 'Geographic Coordinates', type: 'coordinates', required: true },
    { name: 'Species', type: 'text', required: true },
    { name: 'Inspection Image', type: 'image', required: true },
    { name: 'Diameter', type: 'numbers', required: false },
    { name: 'Comments', type: 'text', required: false }
  ],
  machinery: [
    { name: 'Machine Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  furniture: [
    { name: 'Furniture Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  equipment: [
    { name: 'Equipment Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Asset Code', type: 'qrBarcode', required: true },
    { name: 'Model Number', type: 'textAndNumbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  vehicles: [
    { name: 'Vehicle Name', type: 'text', required: true },
    { name: 'Brand', type: 'text', required: true },
    { name: 'Model', type: 'text', required: true },
    { name: 'YOM', type: 'numbers', required: true },
    { name: 'Quantity', type: 'numbers', required: true },
    { name: 'Inspection Images', type: 'image', required: true },
    { name: 'Comments', type: 'text', required: false }
  ],
  other: [
    { name: 'Record No.', type: 'textAndNumbers', required: true },
    { name: 'User ID', type: 'textAndNumbers', required: true },
    { name: 'Date and Time', type: 'dateTime', required: true }
  ]
};

// Project creation steps
const steps = [
  "Basic Details",
  "Form Fields",
  "Review",
  "Security"
];

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(2);
  const [fields, setFields] = useState<FieldTemplate[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [projectData, setProjectData] = useState({
    category: '',
    name: '',
    assetName: '',
    description: ''
  });
  
  const isMobile = useIsMobile();
  
  // Custom field state
  const [newField, setNewField] = useState<FieldTemplate>({
    name: '',
    type: 'text',
    required: false,
    sectionId: '',
  });
  
  // Section state
  const [isAddingSectionDialog, setIsAddingSectionDialog] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [activeSectionTab, setActiveSectionTab] = useState('');
  const [isEditingSectionDialog, setIsEditingSectionDialog] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState('');
  const [editingSectionName, setEditingSectionName] = useState('');
  
  // Edit mode state
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // This would be populated from the previous step in a real implementation
  useEffect(() => {
    // Get category from URL params
    const category = new URLSearchParams(location.search).get('category') || 'land';
    
    // In a real app, you would fetch project data from context/state management
    const urlParams = new URLSearchParams(location.search);
    
    // Set project data from URL params
    setProjectData({
      category,
      name: urlParams.get('name') || 'Sample Project',
      assetName: urlParams.get('assetName') || 'Sample Asset',
      description: urlParams.get('description') || 'This is a sample project'
    });

    // Create a default section
    const defaultSection: Section = {
      id: 'section_default',
      name: 'General Information',
      order: 0
    };
    
    setSections([defaultSection]);
    setActiveSectionTab(defaultSection.id);

    // Set initial fields based on category
    const initialFields = [
      // Common fields for all forms
      { name: 'Record No.', type: 'textAndNumbers', required: true, sectionId: defaultSection.id },
      { name: 'User ID', type: 'textAndNumbers', required: true, sectionId: defaultSection.id },
      { name: 'Date and Time', type: 'dateTime', required: true, sectionId: defaultSection.id },
      
      // Template-specific fields, assign them to the default section
      ...(templatesByCategory[category] || []).map(field => ({
        ...field,
        sectionId: defaultSection.id
      }))
    ];
    
    setFields(initialFields);
    
    // Set the new field's section to the active section
    setNewField(prev => ({ ...prev, sectionId: defaultSection.id }));
  }, [location.search]);

  const handleNext = () => {
    // Store form fields in URL params to pass to review page
    const searchParams = new URLSearchParams(location.search);
    
    // Save form field data and sections in localStorage for the review page
    localStorage.setItem('formFields', JSON.stringify(fields));
    localStorage.setItem('formSections', JSON.stringify(sections));
    localStorage.setItem('projectData', JSON.stringify(projectData));
    
    toast.success('Form template saved! Ready for review.');
    
    // Navigate to review page with the same URL parameters
    navigate(`/dashboard/review-form?${searchParams.toString()}`);
  };
  
  const handleRemoveField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    toast.success('Field removed');
  };
  
  const handleToggleRequired = (index: number) => {
    const newFields = [...fields];
    newFields[index].required = !newFields[index].required;
    setFields(newFields);
  };
  
  const handleEditField = (index: number) => {
    setEditingIndex(index);
    setNewField({...fields[index]});
    setIsDialogOpen(true);
  };
  
  const handleSaveEdit = () => {
    if (!newField.name.trim()) {
      toast.error('Field name cannot be empty');
      return;
    }
    
    if (editingIndex !== null) {
      const newFields = [...fields];
      newFields[editingIndex] = {...newField};
      setFields(newFields);
      setEditingIndex(null);
      setNewField({ name: '', type: 'text', required: false, sectionId: activeSectionTab });
      setIsDialogOpen(false);
      toast.success('Field updated');
    }
  };
  
  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewField({ name: '', type: 'text', required: false, sectionId: activeSectionTab });
    setIsDialogOpen(false);
  };
  
  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast.error('Please enter a field name');
      return;
    }
    
    // Make sure field has a sectionId (should be current active section)
    const fieldToAdd = {
      ...newField,
      sectionId: activeSectionTab
    };
    
    setFields([...fields, fieldToAdd]);
    setNewField({ name: '', type: 'text', required: false, sectionId: activeSectionTab });
    toast.success('Custom field added');
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) {
      toast.error('Section name cannot be empty');
      return;
    }
    
    const newSection: Section = {
      id: `section_${Date.now()}`,
      name: newSectionName,
      order: sections.length,
    };
    
    setSections([...sections, newSection]);
    setActiveSectionTab(newSection.id);
    setNewSectionName('');
    setIsAddingSectionDialog(false);
    
    toast.success('Section added');
  };
  
  const handleRemoveSection = (sectionId: string) => {
    // Don't allow removing the default section
    if (sectionId === 'section_default') {
      toast.error('Cannot remove the general section');
      return;
    }
    
    // Move fields from this section to the default section
    const updatedFields = fields.map(field => {
      if (field.sectionId === sectionId) {
        return { ...field, sectionId: 'section_default' };
      }
      return field;
    });
    
    const updatedSections = sections.filter(section => section.id !== sectionId);
    
    setSections(updatedSections);
    setFields(updatedFields);
    setActiveSectionTab('section_default');
    
    toast.success('Section removed');
  };
  
  const handleEditSection = (section: Section) => {
    setEditingSectionId(section.id);
    setEditingSectionName(section.name);
    setIsEditingSectionDialog(true);
  };
  
  const handleSaveEditSection = () => {
    if (!editingSectionName.trim()) {
      toast.error('Section name cannot be empty');
      return;
    }
    
    const updatedSections = sections.map(section => {
      if (section.id === editingSectionId) {
        return { ...section, name: editingSectionName };
      }
      return section;
    });
    
    setSections(updatedSections);
    setIsEditingSectionDialog(false);
    toast.success('Section updated');
  };
  
  const handleSectionOrderChange = (sectionId: string, direction: 'up' | 'down') => {
    const sectionIndex = sections.findIndex(s => s.id === sectionId);
    if ((direction === 'up' && sectionIndex === 0) || 
        (direction === 'down' && sectionIndex === sections.length - 1)) {
      return;
    }
    
    const newSections = [...sections];
    const swapIndex = direction === 'up' ? sectionIndex - 1 : sectionIndex + 1;
    
    // Swap order properties
    const tempOrder = newSections[sectionIndex].order;
    newSections[sectionIndex].order = newSections[swapIndex].order;
    newSections[swapIndex].order = tempOrder;
    
    // Swap positions in array
    [newSections[sectionIndex], newSections[swapIndex]] = 
    [newSections[swapIndex], newSections[sectionIndex]];
    
    setSections(newSections);
  };

  const getDataTypeName = (typeId: string) => {
    return dataTypes.find(t => t.id === typeId)?.name || typeId;
  };
  
  // Get fields for the current active section
  const getSectionFields = (sectionId: string) => {
    return fields.filter(field => field.sectionId === sectionId);
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Create Form Fields</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Define the data you want to collect in this project
        </p>
        
        <ProgressSteps 
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
      </div>

      <Card className={`mb-4 ${isMobile ? 'mx-1 shadow-sm' : ''}`}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Project Information</h2>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-semibold">Project Name</p>
                <p className="text-sm text-muted-foreground">{projectData.name}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Type</p>
                <p className="text-sm text-muted-foreground">
                  {categories.find(c => c.id === projectData.category)?.name || projectData.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">{projectData.assetName}</p>
              </div>
              {projectData.description && (
                <div>
                  <p className="text-sm font-semibold">Description</p>
                  <p className="text-sm text-muted-foreground">{projectData.description}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? 'mx-1 shadow-sm' : ''}>
        <CardContent className={`${isMobile ? 'p-3' : 'pt-4'}`}>
          <h2 className="text-lg font-medium mb-3">Form Template</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Add sections to organize your survey fields. You can customize the fields within each section.
          </p>
          
          {/* Section Manager */}
          <div className="mb-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-md font-medium">Sections</h3>
              <Button 
                variant="outline" 
                size={isMobile ? "sm" : "default"}
                onClick={() => setIsAddingSectionDialog(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </Button>
            </div>
            
            {/* Sections Tab List */}
            <div className="mb-6">
              <Tabs value={activeSectionTab} onValueChange={setActiveSectionTab} className="w-full">
                <TabsList className="mb-2 w-full flex flex-wrap h-auto">
                  {sections.sort((a, b) => a.order - b.order).map((section) => (
                    <div key={section.id} className="flex items-center">
                      <TabsTrigger 
                        value={section.id} 
                        className={`flex-1 h-10 ${isMobile ? 'text-sm' : ''}`}
                      >
                        {section.name}
                      </TabsTrigger>
                      {section.id !== 'section_default' && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditSection(section)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSectionOrderChange(section.id, 'up')}
                              disabled={section.order === 0}
                            >
                              <ArrowUp className="h-4 w-4 mr-2" />
                              Move Up
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleSectionOrderChange(section.id, 'down')}
                              disabled={section.order === sections.length - 1}
                            >
                              <ArrowDown className="h-4 w-4 mr-2" />
                              Move Down
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleRemoveSection(section.id)}
                              className="text-red-500 focus:text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </TabsList>
                
                {sections.map((section) => (
                  <TabsContent key={section.id} value={section.id} className="mt-4">
                    <div className={`space-y-3 mb-5 ${isMobile ? 'max-h-[55vh] overflow-y-auto pb-2' : ''}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">{section.name} Fields</h3>
                      </div>
                      
                      {getSectionFields(section.id).length > 0 ? (
                        getSectionFields(section.id).map((field, index) => {
                          const globalIndex = fields.findIndex(f => f === field);
                          return (
                            <div 
                              key={index} 
                              className={`flex flex-col ${isMobile ? 'p-2' : 'p-3'} border rounded-md`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className={`font-medium ${isMobile ? 'text-base' : ''}`}>{field.name}</p>
                                  <p className="text-xs text-muted-foreground">{getDataTypeName(field.type)}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {field.required ? (
                                    <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">Required</span>
                                  ) : (
                                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">Optional</span>
                                  )}
                                </div>
                              </div>
                              
                              {isMobile && (
                                <div className="flex mt-2 border-t pt-2 justify-between">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleToggleRequired(globalIndex)}
                                    className="flex-1 text-xs h-8"
                                  >
                                    {field.required ? "Make Optional" : "Make Required"}
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleEditField(globalIndex)}
                                    className="flex-1 text-xs h-8"
                                  >
                                    Edit
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveField(globalIndex)}
                                    className="flex-1 text-xs h-8 text-red-500"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              )}
                              
                              {!isMobile && (
                                <div className="flex items-center gap-2 mt-2 justify-end">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleToggleRequired(globalIndex)}
                                    className="h-8 w-8"
                                    title={field.required ? "Make optional" : "Make required"}
                                  >
                                    {field.required ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleEditField(globalIndex)}
                                    className="h-8 w-8"
                                    title="Edit field"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => handleRemoveField(globalIndex)}
                                    className="h-8 w-8 text-red-500"
                                    title="Remove field"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center border border-dashed rounded-md">
                          <p className="text-sm text-muted-foreground">No fields in this section yet.</p>
                          <p className="text-sm text-muted-foreground">Add fields using the form below.</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Add field form for this section */}
                    <div className={`border rounded-md p-3 mb-5 ${isMobile ? 'space-y-3' : ''}`}>
                      <h3 className="text-md font-medium mb-3">Add Field to {section.name}</h3>
                      <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap'} gap-3 items-end`}>
                        <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'}`}>
                          <label className="text-sm mb-1 block">Field Name</label>
                          <Input 
                            value={newField.name} 
                            onChange={(e) => setNewField({...newField, name: e.target.value})}
                            placeholder="Enter field name"
                            className={isMobile ? "h-10 text-base" : ""}
                          />
                        </div>
                        <div className={isMobile ? 'w-full' : 'w-[180px]'}>
                          <label className="text-sm mb-1 block">Data Type</label>
                          <Select 
                            value={newField.type}
                            onValueChange={(value) => setNewField({...newField, type: value})}
                          >
                            <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                              <SelectValue placeholder="Select data type" />
                            </SelectTrigger>
                            <SelectContent>
                              {dataTypes.map((type) => (
                                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Required</span>
                          <Switch 
                            checked={newField.required}
                            onCheckedChange={(checked) => setNewField({...newField, required: checked})}
                          />
                        </div>
                        <Button 
                          variant="outline" 
                          className={`flex items-center gap-1 ${isMobile ? 'w-full h-10 text-base' : ''}`}
                          onClick={handleAddField}
                        >
                          <Plus className="h-4 w-4" />
                          Add Field
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
          
          <div className={`flex gap-2 ${isMobile ? 'flex-col' : ''}`}>
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/new-project')}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Back
            </Button>
            <Button 
              onClick={handleNext}
              className={isMobile ? 'h-12 text-base w-full' : ''}
            >
              Continue to Review
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialog for editing fields */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className={`${isMobile ? 'w-[90%] max-w-md p-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Edit Field</DialogTitle>
            <DialogDescription className="text-center">
              Make changes to your form field below
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Field Name</label>
              <Input 
                value={newField.name} 
                onChange={(e) => setNewField({...newField, name: e.target.value})}
                placeholder="Field name"
                className={isMobile ? "h-10 text-base" : ""}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Type</label>
              <Select 
                value={newField.type}
                onValueChange={(value) => setNewField({...newField, type: value})}
              >
                <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  {dataTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id} className={isMobile ? "text-base" : ""}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Section</label>
              <Select 
                value={newField.sectionId}
                onValueChange={(value) => setNewField({...newField, sectionId: value})}
              >
                <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {sections.map((section) => (
                    <SelectItem key={section.id} value={section.id} className={isMobile ? "text-base" : ""}>
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between py-2">
              <span className={`${isMobile ? "text-base" : "text-sm"} font-medium`}>Required Field</span>
              <Switch 
                checked={newField.required}
                onCheckedChange={(checked) => setNewField({...newField, required: checked})}
              />
            </div>
          </div>
          
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
            <Button 
              variant="outline" 
              onClick={handleCancelEdit}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEdit}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Add Section Dialog */}
      <Dialog open={isAddingSectionDialog} onOpenChange={setIsAddingSectionDialog}>
        <DialogContent className={`${isMobile ? 'w-[90%] max-w-md p-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Add New Section</DialogTitle>
            <DialogDescription className="text-center">
              Create a new section to organize your form fields
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Name</label>
              <Input 
                value={newSectionName} 
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="E.g., Hardware Details"
                className={isMobile ? "h-10 text-base" : ""}
              />
            </div>
          </div>
          
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingSectionDialog(false)}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddSection}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Add Section
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Section Dialog */}
      <Dialog open={isEditingSectionDialog} onOpenChange={setIsEditingSectionDialog}>
        <DialogContent className={`${isMobile ? 'w-[90%] max-w-md p-4' : ''}`}>
          <DialogHeader>
            <DialogTitle className="text-center text-lg">Edit Section</DialogTitle>
            <DialogDescription className="text-center">
              Update the name of this section
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Section Name</label>
              <Input 
                value={editingSectionName} 
                onChange={(e) => setEditingSectionName(e.target.value)}
                placeholder="Section Name"
                className={isMobile ? "h-10 text-base" : ""}
              />
            </div>
          </div>
          
          <DialogFooter className={`${isMobile ? 'flex-col gap-2' : ''}`}>
            <Button 
              variant="outline" 
              onClick={() => setIsEditingSectionDialog(false)}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSaveEditSection}
              className={isMobile ? "h-10 w-full" : ""}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormBuilderPage;
