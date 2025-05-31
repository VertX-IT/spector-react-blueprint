/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { AlertCircle, Download, ChevronDown, ChevronUp, Trash2, Edit } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Separator } from "@/components/ui/separator";
import { LocationSelector } from "@/components/survey/LocationSelector";
import { getProjectById, submitFormData, deleteProject, updateProject, getProjectRecords } from "@/lib/projectOperations";
import { useSectionSurvey } from "@/hooks/useSectionSurvey";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useNetwork } from "@/contexts/NetworkContext";

interface Section {
  id: string;
  name: string;
  order: number;
  fields: FieldTemplate[];
}

interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  sectionId?: string;
  options?: string[];
  placeholder?: string;
}

interface ProjectRecord {
  id?: string; // Changed from required to optional
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
  formSections?: Section[];
  description?: string;
  status?: "active" | "inactive";
  endedAt?: string;
  createdBy?: string;
}

interface FormData {
  [key: string]: string | File | null;
}

const ProjectFormPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDesigner = userData?.role === "designer";
  const isCollector = userData?.role === "collector";
  const currentUserId = userData?.uid || "N/A";

  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<FormData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("form");
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEndSurveyDialogOpen, setIsEndSurveyDialogOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const { isOnline } = useNetwork();

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!projectId) {
          throw new Error("Project ID is missing");
        }

        const storedProjects = localStorage.getItem("myProjects");
        let foundProject: any = null;

        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          foundProject = parsedProjects.find((p: any) => p.id === projectId);
        }

        if (!foundProject) {
          const firebaseProject = await getProjectById(projectId);
          if (firebaseProject) {
            foundProject = firebaseProject;
          } else {
            throw new Error("Project not found");
          }
        }

        if (!foundProject) {
          throw new Error("Project data is invalid");
        }

        let projectSections: Section[] = [];
        if (
          foundProject.formSections &&
          Array.isArray(foundProject.formSections) &&
          foundProject.formSections.length > 0
        ) {
          projectSections = foundProject.formSections.map((section: any) => ({
            id: section.id,
            name: section.name,
            order: section.order || 0,
            fields: (section.fields || []).map((field: any, fieldIndex: number) => ({
              id: field.id || `${section.id}_${fieldIndex}`,
              name: field.name || field.label || `Field ${fieldIndex}`,
              label: field.label || field.name || `Field ${fieldIndex}`,
              type: field.type || "text",
              required: field.required !== undefined ? field.required : false,
              sectionId: section.id,
              placeholder: field.placeholder || "",
              options: field.options || [],
            })).filter(field => field.name !== "User ID" && field.name !== "Record No"),
          }));
        } else {
          projectSections = [
            {
              id: "section_default",
              name: "Section 1",
              order: 0,
              fields: [],
            },
          ];
        }

        const allFields: FieldTemplate[] = projectSections.flatMap(section => section.fields);

        setSections(projectSections);
        setProject({
          ...foundProject,
          createdAt: new Date(foundProject.createdAt),
          recordCount: foundProject.recordCount || 0,
          status: foundProject.status || "active",
          formSections: projectSections,
        });

        const initialData: FormData = {};
        allFields.forEach((field: FieldTemplate) => {
          initialData[field.id] = "";
        });
        initialData["userId"] = currentUserId;
        initialData["recordNo"] = "";
        setFormData(initialData);
      } catch (error: any) {
        console.error("Error fetching project:", error);
        setError(error.message || "Failed to load project");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load project",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, currentUserId]);

  // Fetch records when the "View Data" tab is active
  useEffect(() => {
    const fetchRecords = async () => {
      if (!projectId || activeTab !== "data") return;

      try {
        setLoadingRecords(true);
        let records = await getProjectRecords(projectId);

        // Filter records based on user role
        if (isCollector && !isDesigner) {
          records = records.filter(record => record.createdBy === currentUserId);
        }
        // For designer, no filtering needed; they see all records

        setProjectRecords(records);
      } catch (error: any) {
        console.error("Error fetching project records:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load project records",
        });
      } finally {
        setLoadingRecords(false);
      }
    };

    fetchRecords();
  }, [projectId, activeTab, isCollector, isDesigner, currentUserId]);

  const sectionIds = sections.map((section) => section.id);
  const {
    sectionData,
    completedSections,
    surveyCompleted,
    submitSection,
    endSurvey,
    resetSurvey,
  } = useSectionSurvey(sectionIds);

  useFirebaseSync(project?.id || "", userData?.uid || "");

  const handleInputChange = (fieldId: string, value: string | File | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSectionSubmit = async (
    sectionId: string,
    sectionFields: FieldTemplate[]
  ) => {
    if (!isCollector) return;

    const sectionForm: Record<string, any> = {};
    const missingFields: string[] = [];

    // Process fields including image to base64
    for (const field of sectionFields) {
      const value = formData[field.id];
      if (field.required && (!value || (typeof value === "string" && !value.trim()))) {
        missingFields.push(field.label || field.name || field.id);
      }
      if (field.type === "image" && value instanceof File) {
        try {
          const base64String = await fileToBase64(value);
          sectionForm[field.id] = base64String; // Store as data URL (e.g., data:image/jpeg;base64,...)
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process image.",
          });
          return;
        }
      } else {
        sectionForm[field.id] = value;
      }
    }

    // Add User ID and Record No. to the submitted form
    sectionForm["userId"] = formData["userId"];
    sectionForm["recordNo"] = formData["recordNo"];

    if (missingFields.length > 0) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: `Please fill in: ${missingFields.join(", ")}`,
      });
      return;
    }

    submitSection(sectionId, sectionForm);

    const record = {
      ...sectionForm,
      __sectionId: sectionId,
      __timestamp: new Date().toISOString(),
      __completed: false,
    };

    const key = `records_${project?.id}_draft`;
    const prevDrafts = JSON.parse(localStorage.getItem(key) || "[]");
    const updatedDrafts = prevDrafts.filter((d: any) => d.__sectionId !== sectionId);
    updatedDrafts.push(record);
    localStorage.setItem(key, JSON.stringify(updatedDrafts));

    toast({
      title: "Section submitted",
      description: "Section saved. Continue with the next section or finish.",
    });
  };

  const handleEndSurveySubmit = async () => {
    if (!project?.id || !isCollector) return;

    const surveyPayload: Record<string, any> = {};
    sectionIds.forEach((sid) => {
      Object.assign(surveyPayload, sectionData[sid] || {});
    });

    // Process any remaining image fields
    for (const fieldId in formData) {
      const value = formData[fieldId];
      const field = sections.flatMap(s => s.fields).find(f => f.id === fieldId);
      if (field?.type === "image" && value instanceof File) {
        try {
          const base64String = await fileToBase64(value);
          surveyPayload[fieldId] = base64String;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process image.",
          });
          return;
        }
      } else {
        surveyPayload[fieldId] = value;
      }
    }

    // Ensure User ID and Record No. are included
    surveyPayload["userId"] = formData["userId"];
    surveyPayload["recordNo"] = formData["recordNo"];

    try {
      if (isOnline) {
        await submitFormData(project.id, surveyPayload, userData.uid);
        toast({
          title: "Survey submitted",
          description: "Your responses have been saved.",
        });
      } else {
        const key = `offline_records_${project.id}`;
        const arr = JSON.parse(localStorage.getItem(key) || "[]");
        arr.push(surveyPayload);
        localStorage.setItem(key, JSON.stringify(arr));
        toast({
          title: "Offline submission",
          description: "Data saved locally and will sync when you're back online.",
        });
      }
      endSurvey();
      resetSurvey();
      setFormData({ userId: currentUserId, recordNo: "" });
      setActiveSectionIndex(0);
      localStorage.removeItem(`records_${project.id}_draft`);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error submitting survey",
        description: err.message || "Submission failed.",
      });
    }
  };

  const getFieldsBySection = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.fields : [];
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!project || !isDesigner) return;

    const updatedSections = sections.filter((section) => section.id !== sectionId);

    setSections(updatedSections);
    setProject((prev) => prev ? { ...prev, formSections: updatedSections } : null);

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = { ...storedProjects[projectIndex], formSections: updatedSections };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
    }
    toast({ title: "Section deleted", description: "Section has been removed." });
  };

  const handleToggleRequired = (fieldId: string) => {
    if (!project || !isDesigner) return;

    console.log("Toggling required for fieldId:", fieldId);
    let fieldFound = false;

    const updatedSections = sections.map(section => {
      const updatedFields = section.fields.map(field => {
        if (field.id === fieldId) {
          fieldFound = true;
          console.log(`Found field ${field.id}, toggling required from ${field.required} to ${!field.required}`);
          return { ...field, required: !field.required };
        }
        return { ...field };
      });
      return { ...section, fields: updatedFields };
    });

    if (!fieldFound) {
      console.error(`Field with ID ${fieldId} not found in sections`);
      return;
    }

    console.log("Updated sections:", JSON.stringify(updatedSections, null, 2));
    setSections(updatedSections);
    setProject((prev) => prev ? { ...prev, formSections: updatedSections } : null);

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = { ...storedProjects[projectIndex], formSections: updatedSections };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
    }
    toast({ title: "Field updated", description: "Required status has been toggled." });
  };

  const handleRenameSection = (sectionId: string, newName: string) => {
    if (!project || !isDesigner) return;

    const updatedSections = sections.map((section) =>
      section.id === sectionId ? { ...section, name: newName } : section
    );
    setSections(updatedSections);
    setProject((prev) => prev ? { ...prev, formSections: updatedSections } : null);

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = { ...storedProjects[projectIndex], formSections: updatedSections };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
    }
    toast({ title: "Section renamed", description: "Section name has been updated." });
  };

  const handleUpdateFieldName = (fieldId: string, newName: string) => {
    if (!project || !isDesigner) return;

    console.log("Updating field name for fieldId:", fieldId, "to:", newName);
    let fieldFound = false;

    const updatedSections = sections.map(section => {
      const updatedFields = section.fields.map(field => {
        if (field.id === fieldId) {
          fieldFound = true;
          console.log(`Found field ${field.id}, updating name from ${field.name} to ${newName}`);
          return { ...field, label: newName, name: newName };
        }
        return { ...field };
      });
      return { ...section, fields: updatedFields };
    });

    if (!fieldFound) {
      console.error(`Field with ID ${fieldId} not found in sections`);
      return;
    }

    console.log("Updated sections:", JSON.stringify(updatedSections, null, 2));
    setSections(updatedSections);
    setProject((prev) => prev ? { ...prev, formSections: updatedSections } : null);

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = { ...storedProjects[projectIndex], formSections: updatedSections };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
    }
    toast({ title: "Field renamed", description: "Field name has been updated." });
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
        <AlertDescription>{error || "Failed to load project"}</AlertDescription>
      </Alert>
    );
  }

  console.log("project.formSections before rendering:", project.formSections);

  const isProjectInactive = project.status === "inactive";
  const projectSections =
    sections.length > 0
      ? sections
      : [
        {
          id: "section_default",
          name: "Section 1",
          order: 0,
          fields: [],
        },
      ];

  const handleToggleRowExpand = (recordId: string) => {
    setExpandedRows((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  function formatLocationForDisplay(loc: any) {
    if (!loc) return "-";
    if (typeof loc === "object" && (loc.lat || loc.lng)) {
      return `Lat: ${loc.lat}, Lng: ${loc.lng}`;
    }
    if (typeof loc === "string") {
      try {
        const obj = JSON.parse(loc);
        if (obj && obj.lat && obj.lng) {
          return `Lat: ${obj.lat}, Lng: ${obj.lng}`;
        }
      } catch {
        return loc;
      }
      return loc;
    }
    return "-";
  }

  const handleExportData = () => {
    if (!projectRecords || projectRecords.length === 0) return;
    const allFields = projectSections.flatMap(s => s.fields);
    const headers = [
      ...allFields.map((f) => f.label || f.name || f.id),
      "User ID",
      "Record No.",
    ];
    const fieldIds = allFields.map((f) => f.id);
    const rows = [
      headers,
      ...projectRecords.map((record) => {
        const fieldValues = fieldIds.map((fid) => {
          let val = record.data?.[fid];
          if (typeof val === "string" && val.startsWith("data:image/")) {
            val = "Image (Base64)"; // Indicate base64 image in CSV
          } else if (val instanceof File) {
            val = val.name;
          } else if (typeof val === "object") {
            val = JSON.stringify(val);
          }
          return `"${(val ?? "-").toString().replace(/"/g, '""')}"`;
        });
        return [
          ...fieldValues,
          `"${(record.data?.userId ?? "-").toString().replace(/"/g, '""')}"`,
          `"${(record.data?.recordNo ?? "-").toString().replace(/"/g, '""')}"`,
        ];
      }),
    ];
    const csvContent = rows.map((r) => r.join(",")).join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.name || "project"}-data.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleDeleteProject = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      setIsDeleteDialogOpen(false);
      await deleteProject(projectId);
      toast({
        title: "Project deleted",
        description: "Project and all its data have been permanently deleted.",
      });
      navigate("/dashboard/my-projects");
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Error deleting project",
        description: err.message || "Could not delete project.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEndSurvey = async () => {
    if (!projectId) return;
    setIsEndSurveyDialogOpen(false);
    try {
      await updateProject(projectId, { status: "inactive" });
      toast({
        title: "Survey Ended",
        description: "Survey is now closed for new submissions.",
      });
      setProject((prev) =>
        prev
          ? {
            ...prev,
            status: "inactive",
          }
          : prev
      );
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to end survey",
        description: err.message || "Could not close survey.",
      });
    }
  };

  return (
    <>
      <div className="mb-4 space-y-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight line-clamp-2">
            {project.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {project.description ||
              `Data collection form for ${project.category}`}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              PIN: {project.projectPin}
            </Badge>
            {isProjectInactive && (
              <Badge variant="destructive" className="text-xs">
                Survey Ended
              </Badge>
            )}
          </div>
        </div>

        {isDesigner && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex-1 min-w-[80px] sm:flex-none"
            >
              {isEditMode ? "Cancel Edit" : "Edit Form"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-[80px] sm:flex-none text-amber-500 hover:text-amber-600"
              onClick={() => setIsEndSurveyDialogOpen(true)}
              disabled={isProjectInactive}
            >
              {isProjectInactive ? "Survey Ended" : "End Survey"}
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
          <TabsTrigger value="form" className="flex-1">
            Form
          </TabsTrigger>
          <TabsTrigger value="data" className="flex-1">
            View Data
          </TabsTrigger>
          {(!isDesigner || (isDesigner && projectRecords.length > 0)) && (
            <TabsTrigger value="export" className="flex-1">
              Export
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="form">
          <Card className="mb-4">
            <CardHeader>
              <CardTitle>Data Collection Form</CardTitle>
              <CardDescription>
                {isDesigner
                  ? "Edit the form structure"
                  : "Fill this form to collect data for this project"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDesigner ? (
                <div className="space-y-4">
                  {projectSections
                    .sort((a, b) => a.order - b.order)
                    .map((section, idx) => (
                      <div key={section.id} className="relative">
                        <div className="flex items-center gap-2">
                          {isEditMode ? (
                            <Input
                              value={section.name}
                              onChange={(e) => handleRenameSection(section.id, e.target.value)}
                              className="w-full border p-1"
                            />
                          ) : (
                            <h3 className="text-lg font-medium">{section.name}</h3>
                          )}
                          {isEditMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSection(section.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <Separator className="my-2" />
                        <div className="ml-4 space-y-2">
                          {section.fields.map((field: FieldTemplate) => (
                            <div key={field.id} className="flex items-center gap-2">
                              {isEditMode ? (
                                <Input
                                  value={field.label || field.name || ""}
                                  onChange={(e) => handleUpdateFieldName(field.id, e.target.value)}
                                  className="w-full border p-1"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {field.label || field.name}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </span>
                              )}
                              {isEditMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleRequired(field.id)}
                                  className={`ml-2 ${field.required ? "text-red-500" : "text-green-500"}`}
                                >
                                  {field.required ? "Required" : "Optional"}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              ) : isCollector ? (
                <div className="flex overflow-x-auto gap-2 pb-2 mb-2">
                  {projectSections
                    .sort((a, b) => a.order - b.order)
                    .map((section, idx) => (
                      <button
                        key={section.id}
                        onClick={() => setActiveSectionIndex(idx)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg border ${activeSectionIndex === idx
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-zinc-300 bg-white"
                          }`}
                      >
                        {section.name}
                        {completedSections.includes(section.id) && (
                          <span className="ml-2 text-green-600 text-sm">✓</span>
                        )}
                      </button>
                    ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">
                  You do not have permission to view or edit this form.
                </p>
              )}
              {isCollector && !isDesigner && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const section = projectSections[activeSectionIndex];
                    const sectionFields = getFieldsBySection(section.id);
                    handleSectionSubmit(section.id, sectionFields);
                  }}
                  className="space-y-4 mt-4"
                >
                  {(() => {
                    const section = projectSections[activeSectionIndex];
                    const sectionFields = getFieldsBySection(section.id);

                    return (
                      <div className="mb-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">{section.name}</h3>
                          <Separator className="mt-2" />
                        </div>
                        <div className="space-y-4 pl-0 sm:pl-2">
                          <div className="space-y-2">
                            <label htmlFor="userId" className="text-sm font-medium flex items-center">
                              User ID
                            </label>
                            <Input
                              id="userId"
                              value={formData["userId"] as string || ""}
                              readOnly
                              disabled
                              className="bg-gray-100"
                            />
                          </div>
                          <div className="space-y-2">
                            <label htmlFor="recordNo" className="text-sm font-medium flex items-center">
                              Record No.
                            </label>
                            <Input
                              id="recordNo"
                              value={formData["recordNo"] as string || ""}
                              onChange={(e) => handleInputChange("recordNo", e.target.value)}
                              placeholder="Enter Record No."
                              disabled={isProjectInactive}
                              className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                            />
                          </div>
                          {sectionFields.length > 0 ? (
                            sectionFields.map((field: FieldTemplate) => (
                              <div key={field.id} className="space-y-2">
                                <label
                                  htmlFor={field.id}
                                  className="text-sm font-medium flex items-center"
                                >
                                  {field.label || field.name}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </label>
                                {field.type === "text" && (
                                  <Input
                                    id={field.id}
                                    value={formData[field.id] as string || ""}
                                    onChange={(e) =>
                                      handleInputChange(field.id, e.target.value)
                                    }
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                                {field.type === "textAndnumbers" && (
                                  <Input
                                    id={field.id}
                                    value={formData[field.id] as string || ""}
                                    onChange={(e) =>
                                      handleInputChange(field.id, e.target.value)
                                    }
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                                {field.type === "textarea" && (
                                  <Textarea
                                    id={field.id}
                                    value={formData[field.id] as string || ""}
                                    onChange={(e) =>
                                      handleInputChange(field.id, e.target.value)
                                    }
                                    placeholder={field.placeholder || ""}
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                                {field.type === "definedList" && (
                                  <Select
                                    value={formData[field.id] as string || ""}
                                    onValueChange={(value) =>
                                      handleInputChange(field.id, value)
                                    }
                                    disabled={isProjectInactive}
                                  >
                                    <SelectTrigger
                                      id={field.id}
                                      className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                    >
                                      <SelectValue
                                        placeholder={
                                          field.placeholder || "Select an option"
                                        }
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {field.options?.map((option: string) => (
                                        <SelectItem key={option} value={option}>
                                          {option}
                                        </SelectItem>
                                      )) || null}
                                    </SelectContent>
                                  </Select>
                                )}
                                {field.type === "location" && (
                                  <LocationSelector
                                    value={formData[field.id] as string || ""}
                                    onChange={(value) =>
                                      handleInputChange(field.id, value)
                                    }
                                    placeholder={
                                      field.placeholder || "Enter location"
                                    }
                                    disabled={isProjectInactive}
                                  />
                                )}
                                {field.type === "coordinates" && (
                                  <LocationSelector
                                    value={formData[field.id] as string || ""}
                                    onChange={(value) =>
                                      handleInputChange(field.id, value)
                                    }
                                    placeholder={
                                      field.placeholder || "Enter coordinates"
                                    }
                                    disabled={isProjectInactive}
                                  />
                                )}
                                {field.type === "image" && (
                                  <Input
                                    id={field.id}
                                    type="file"
                                    onChange={(e) =>
                                      handleInputChange(
                                        field.id,
                                        e.target.files?.[0] || null
                                      )
                                    }
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                                {field.type === "date" && (
                                  <Input
                                    id={field.id}
                                    type="date"
                                    value={formData[field.id] as string || ""}
                                    onChange={(e) =>
                                      handleInputChange(field.id, e.target.value)
                                    }
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                                {field.type === "dateTime" && (
                                  <Input
                                    id={field.id}
                                    type="datetime-local"
                                    value={formData[field.id] as string || ""}
                                    onChange={(e) =>
                                      handleInputChange(field.id, e.target.value)
                                    }
                                    required={field.required}
                                    disabled={isProjectInactive}
                                    className={`${isProjectInactive ? "bg-gray-100" : ""}`}
                                  />
                                )}
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No fields available for this section.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {!completedSections.includes(
                    projectSections[activeSectionIndex].id
                  ) && (
                      <div className="flex justify-end">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isProjectInactive}>
                          Submit Section
                        </Button>
                      </div>
                    )}
                </form>
              )}
              {isCollector && !isDesigner && completedSections.length === sectionIds.length && !surveyCompleted && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleEndSurveySubmit} className="w-full sm:w-auto" disabled={isProjectInactive}>
                    End Survey
                  </Button>
                </div>
              )}
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
                  <div className="space-y-4">
                    {projectRecords.map((record, index) => (
                      <Card key={record.id || index} className="border">
                        <div
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                          onClick={() => handleToggleRowExpand(record.id || `record_${index}`)} // Use index as fallback if id is undefined
                        >
                          <div>
                            <p className="font-medium text-sm">
                              Record {index + 1} -{" "}
                              {new Date(record.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            {expandedRows.includes(record.id || `record_${index}`) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {expandedRows.includes(record.id || `record_${index}`) && (
                          <CardContent className="pt-0 border-t">
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-medium text-muted-foreground">
                                  User ID:
                                </div>
                                <div>{record.data?.userId || "-"}</div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="font-medium text-muted-foreground">
                                  Record No.:
                                </div>
                                <div>{record.data?.recordNo || "-"}</div>
                              </div>
                              {projectSections.flatMap(s => s.fields).map((field: any) => (
                                <div
                                  key={field.id}
                                  className="grid grid-cols-2 gap-2 text-sm"
                                >
                                  <div className="font-medium text-muted-foreground">
                                    {field.label || field.name}:
                                  </div>
                                  <div>
                                    {field.type === "location" || field.type === "coordinates"
                                      ? formatLocationForDisplay(
                                        record.data[field.id] || ""
                                      )
                                      : field.type === "image" && typeof record.data[field.id] === "string" && record.data[field.id].startsWith("data:image/")
                                        ? <img src={record.data[field.id]} alt="Uploaded" style={{ maxWidth: "100px" }} />
                                        : record.data[field.id] || "-"}
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
                  Click the button below to export the data as a CSV file. The
                  file will contain all
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              project and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProject}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={isEndSurveyDialogOpen}
        onOpenChange={setIsEndSurveyDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this survey?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the survey and prevent any further submissions.
              You will still be able to view collected data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-x-2 sm:space-y-0">
            <AlertDialogCancel className="w-full sm:w-auto">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEndSurvey}
              className="w-full sm:w-auto"
            >
              End Survey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ProjectFormPage;