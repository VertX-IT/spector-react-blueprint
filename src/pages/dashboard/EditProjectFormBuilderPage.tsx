import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { getProjectById, updateProject } from "@/lib/projectOperations";
import InlineBackButton from "@/components/ui/CustomButton";
import { Save, Plus, Edit, Trash2, X } from "lucide-react";

const CATEGORIES = [
  { value: "land", label: "Land" },
  { value: "buildings", label: "Buildings" },
  { value: "biological", label: "Biological Assets" },
  { value: "machinery", label: "Machinery" },
  { value: "furniture", label: "Furniture & Fixtures" },
  { value: "equipment", label: "Equipment" },
  { value: "vehicles", label: "Motor Vehicles" },
  { value: "other", label: "Other" },
];

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Text Area" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "date", label: "Date" },
];

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
}

interface FormSection {
  id: string;
  name: string;
  order: number;
  fields: FormField[];
}

const EditProjectFormBuilderPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  
  // Basic project details
  const [basicData, setBasicData] = useState({
    name: "",
    category: "",
    description: "",
  });

  // Form sections and fields
  const [sections, setSections] = useState<FormSection[]>([]);
  const [editingSectionName, setEditingSectionName] = useState<string>("");
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<FormField>({
    id: "",
    name: "",
    label: "",
    type: "text",
    required: false,
  });

  async function loadProject() {
    if (!projectId || !userData?.uid) return;

    try {
      const foundProject = await getProjectById(projectId);
      if (foundProject) {
        setProject(foundProject);
        setBasicData({
          name: foundProject.name || "",
          category: foundProject.category || "",
          description: foundProject.description || "",
        });
        
        // Load form sections if they exist
        if (foundProject.formSections && foundProject.formSections.length > 0) {
          setSections(foundProject.formSections);
        } else {
                  // Create default section if none exist
        setSections([{
          id: crypto.randomUUID?.() ?? `${Date.now()}-default`,
          name: "Section 1",
          order: 0,
          fields: [],
        }]);
        }
      } else {
        toast.error("Project not found");
        navigate("/dashboard/my-projects");
      }
    } catch (error) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
      navigate("/dashboard/my-projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [projectId, userData?.uid]);

  async function handleSaveAll() {
    if (!projectId || !userData?.uid) return;

    setSaving(true);
    try {
      const updates = {
        name: basicData.name,
        category: basicData.category,
        description: basicData.description,
        formSections: sections,
      };
      
      await updateProject(projectId, updates);
      setProject({ ...project, ...updates });
      toast.success("Project updated successfully");
      navigate("/dashboard/my-projects");
    } catch (error) {
      console.error("Error updating project:", error);
      toast.error("Failed to update project");
    } finally {
      setSaving(false);
    }
  }

  // Section management
  const handleAddSection = () => {
    const newSection: FormSection = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-section`,
      name: `Section ${sections.length + 1}`,
      order: sections.length,
      fields: [],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (sections.length <= 1) {
      toast.error("Cannot remove the last section");
      return;
    }
    setSections(sections.filter(s => s.id !== sectionId));
    toast.success("Section removed");
  };

  const handleRenameSection = (sectionId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error("Section name is required");
      return;
    }
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, name: newName } : s
    ));
    setEditingSectionName("");
    toast.success("Section renamed");
  };

  // Field management
  const handleAddField = (sectionId: string) => {
    const newField: FormField = {
      id: crypto.randomUUID?.() ?? `${Date.now()}-field`,
      name: "New Field",
      label: "New Field",
      type: "text",
      required: false,
    };
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, fields: [...s.fields, newField] } : s
    ));
  };

  const handleEditField = (field: FormField) => {
    setEditingFieldId(field.id);
    setEditingField({ 
      ...field,
      label: field.label || field.name // Ensure label is set
    });
  };

  const handleSaveField = () => {
    if (!editingField.name.trim()) {
      toast.error("Field name is required");
      return;
    }
    
    setSections(sections.map(s => ({
      ...s,
      fields: s.fields.map(f => 
        f.id === editingFieldId ? editingField : f
      )
    })));
    
    setEditingFieldId(null);
    setEditingField({ id: "", name: "", label: "", type: "text", required: false });
    toast.success("Field updated");
  };

  const handleCancelFieldEdit = () => {
    setEditingFieldId(null);
    setEditingField({ id: "", name: "", label: "", type: "text", required: false });
  };

  const handleRemoveField = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, fields: s.fields.filter(f => f.id !== fieldId) } : s
    ));
    toast.success("Field removed");
  };

  const handleToggleRequired = (sectionId: string, fieldId: string) => {
    setSections(sections.map(s => ({
      ...s,
      fields: s.fields.map(f => 
        f.id === fieldId ? { ...f, required: !f.required } : f
      )
    })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-gray-600">Project not found</p>
        <Button onClick={() => navigate("/dashboard/my-projects")} className="mt-4">
          Back to Projects
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <InlineBackButton path="/dashboard/my-projects" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900 truncate">
              Edit Project: {project.name}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Edit basic details and form structure for your project
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-12">
            <TabsTrigger value="basic" className="text-sm font-medium">Basic Details</TabsTrigger>
            <TabsTrigger value="form" className="text-sm font-medium">Form Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Basic Project Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Project Name</Label>
                  <Input
                    id="name"
                    value={basicData.name}
                    onChange={(e) => setBasicData({ ...basicData, name: e.target.value })}
                    placeholder="Enter project name"
                    className="h-11"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Select value={basicData.category} onValueChange={(value) => setBasicData({ ...basicData, category: value })}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <Textarea
                    id="description"
                    value={basicData.description}
                    onChange={(e) => setBasicData({ ...basicData, description: e.target.value })}
                    placeholder="Enter project description"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="form" className="space-y-4 mt-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Form Structure</CardTitle>
                <p className="text-sm text-gray-600">
                  Manage your form sections and fields
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {sections.map((section, sectionIndex) => (
                  <div key={section.id} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                    {/* Section Header */}
                    <div className="flex items-center justify-between">
                      {editingSectionName === section.name ? (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full">
                          <Input
                            value={editingSectionName}
                            onChange={(e) => setEditingSectionName(e.target.value)}
                            className="flex-1 min-w-0"
                          />
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button size="sm" onClick={() => handleRenameSection(section.id, editingSectionName)} className="flex-1 sm:flex-none">
                              Save
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingSectionName("")} className="flex-1 sm:flex-none">
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full">
                          <h3 className="text-lg font-medium text-gray-900 flex-1 min-w-0 truncate">
                            {section.name}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Button size="sm" variant="ghost" onClick={() => setEditingSectionName(section.name)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {sections.length > 1 && (
                              <Button size="sm" variant="ghost" onClick={() => handleRemoveSection(section.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Fields */}
                    <div className="space-y-3">
                      {section.fields.map((field) => (
                        <div key={field.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                          {editingFieldId === field.id ? (
                            <div className="w-full space-y-3">
                              <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                  value={editingField.name}
                                  onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                                  placeholder="Field name"
                                  className="flex-1"
                                />
                                <Select value={editingField.type} onValueChange={(value) => setEditingField({ ...editingField, type: value })}>
                                  <SelectTrigger className="w-full sm:w-32">
                                    <SelectValue />
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
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleSaveField} className="flex-1 sm:flex-none">
                                  Save
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleCancelFieldEdit} className="flex-1 sm:flex-none">
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">{field.name}</span>
                                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                    {field.type}
                                  </span>
                                  {field.required && (
                                    <span className="text-xs text-red-500 bg-red-100 px-2 py-1 rounded">
                                      Required
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button size="sm" variant="ghost" onClick={() => handleEditField(field)} className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => handleToggleRequired(section.id, field.id)}
                                  className={`h-8 px-3 text-xs ${field.required ? 'text-red-600 bg-red-50' : 'text-gray-600 bg-gray-50'}`}
                                >
                                  {field.required ? "Required" : "Optional"}
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleRemoveField(section.id, field.id)} className="h-8 w-8 p-0 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddField(section.id)}
                        className="w-full h-10"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Field
                      </Button>
                    </div>
                  </div>
                ))}
                
                <Button variant="outline" onClick={handleAddSection} className="w-full h-12">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Section
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="sticky bottom-4 bg-white border-t border-gray-200 pt-4 pb-2">
          <Button onClick={handleSaveAll} disabled={saving} size="lg" className="w-full h-12 text-base font-medium">
            <Save className="h-5 w-5 mr-2" />
            {saving ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectFormBuilderPage; 