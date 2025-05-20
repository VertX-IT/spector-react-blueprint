import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
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
import { AlertCircle, Download, ChevronDown, ChevronUp } from "lucide-react";
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LocationSelector } from "@/components/survey/LocationSelector";
import { getProjectById, submitFormData, deleteProject } from "@/lib/projectOperations";
import { useSectionSurvey } from "@/hooks/useSectionSurvey";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useNetwork } from "@/contexts/NetworkContext";

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
  status?: "active" | "inactive";
  endedAt?: string;
  createdBy?: string;
}

const ProjectFormPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const isDesigner = userData?.role === "designer";

  const [project, setProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("form");
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEndSurveyDialogOpen, setIsEndSurveyDialogOpen] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const { isOnline } = useNetwork();

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

        let projectSections: Section[] = [];

        if (
          foundProject.formSections &&
          Array.isArray(foundProject.formSections)
        ) {
          projectSections = foundProject.formSections;
        } else {
          projectSections = [
            {
              id: "section_default",
              name: "General Information",
              order: 0,
            },
          ];
        }

        setSections(projectSections);

        setProject({
          ...foundProject,
          createdAt: new Date(foundProject.createdAt),
          recordCount: foundProject.recordCount || 0,
          status: foundProject.status || "active",
          formSections: projectSections,
        });

        const initialData: Record<string, string> = {};
        if (foundProject.formFields && Array.isArray(foundProject.formFields)) {
          foundProject.formFields.forEach((field: any) => {
            initialData[field.id] = "";
          });
        }
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
  }, [projectId]);

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

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSectionSubmit = async (
    sectionId: string,
    sectionFields: any[]
  ) => {
    const sectionForm: Record<string, string> = {};
    let missingFields: string[] = [];
    sectionFields.forEach((field) => {
      const value = formData[field.id];
      sectionForm[field.id] = value;
      if (field.required && !value) {
        missingFields.push(field.label || field.name);
      }
    });

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
    if (!project?.id) return;

    let surveyPayload: Record<string, any> = {};
    sectionIds.forEach((sid) => {
      Object.assign(surveyPayload, sectionData[sid] || {});
    });

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
          description:
            "Data saved locally and will sync when you're back online.",
        });
      }
      endSurvey();
      resetSurvey();
      setFormData({});
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
    if (!project?.formFields) return [];
    return project.formFields.filter((field) => field.sectionId === sectionId);
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

  const isProjectInactive = project.status === "inactive";
  const projectSections =
    sections.length > 0
      ? sections
      : [
          {
            id: "section_default",
            name: "General Information",
            order: 0,
          },
        ];

  // Toggle expanded row for viewing record details
  const handleToggleRowExpand = (recordId: string) => {
    setExpandedRows((prev) =>
      prev.includes(recordId)
        ? prev.filter((id) => id !== recordId)
        : [...prev, recordId]
    );
  };

  // Format location display (simple fallback if not an object)
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
        // not JSON, continue
      }
      return loc;
    }
    return "-";
  }

  // Export collected data as CSV
  const handleExportData = () => {
    if (!projectRecords || projectRecords.length === 0) return;
    const headers =
      project?.formFields?.map((f) => f.label || f.name || f.id) || [];
    const fieldIds = project?.formFields?.map((f) => f.id) || [];
    const rows = [
      headers,
      ...projectRecords.map((record) =>
        fieldIds.map((fid) => {
          let val = record.data?.[fid];
          if (typeof val === "object") val = JSON.stringify(val);
          return `"${(val ?? "-").toString().replace(/"/g, '""')}"`
        })
      ),
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

  // Delete project
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

  // End/Close survey
  const handleEndSurvey = async () => {
    if (!projectId) return;
    setIsEndSurveyDialogOpen(false);
    try {
      // Update project status in firestore, remove from local myProjects as well
      await updateProjectStatus(projectId, "inactive");
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

  // Utility for updating status
  async function updateProjectStatus(projectId: string, status: "active" | "inactive") {
    // Update firebase doc's status field
    await import("@/lib/projectOperations").then(async (lib) => {
      const { db } = await import("@/lib/firebase");
      const { doc, updateDoc } = await import("firebase/firestore");
      const projRef = doc(db, "projects", projectId);
      await updateDoc(projRef, { status });
    });

    // Also update localStorage (if exists)
    const stored = localStorage.getItem("myProjects");
    if (stored) {
      let arr = [];
      try {
        arr = JSON.parse(stored);
        for (let p of arr) {
          if (p.id === projectId) p.status = status;
        }
        localStorage.setItem("myProjects", JSON.stringify(arr));
      } catch {}
    }
  }


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

        {/* REMOVE OUTER Edit Button (for designers) */}
        {isDesigner && (
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* End survey and Delete only */}
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
                Fill this form to collect data for this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex overflow-x-auto gap-2 pb-2 mb-2">
                {projectSections
                  .sort((a, b) => a.order - b.order)
                  .map((section, idx) => (
                    <button
                      key={section.id}
                      onClick={() => setActiveSectionIndex(idx)}
                      className={`flex-shrink-0 px-4 py-2 rounded-lg border ${
                        activeSectionIndex === idx
                          ? "border-primary bg-primary/10 font-semibold"
                          : "border-zinc-300 bg-white"
                      }`}
                    >
                      {section.name}
                      {completedSections.includes(section.id) && (
                        <span className="ml-2 text-green-600 text-sm">&#10003;</span>
                      )}
                    </button>
                  ))}
              </div>
              {/* Editable Form - Designer can edit form directly here */}
              {isDesigner ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    // You may want to add logic here to save form structure/fields
                    toast({
                      title: "Designer Save (not implemented)",
                      description:
                        "Saving form structure is not implemented in this snippet.",
                    });
                  }}
                  className="space-y-4 border border-primary/30 p-4 rounded"
                >
                  <div>
                    <h3 className="text-lg font-medium">
                      Edit Project Form (Designer Only)
                    </h3>
                    <Separator className="mt-2" />
                  </div>
                  <div className="space-y-4 pl-0 sm:pl-2">
                    {/* Need to implement form builder UI for editing fields/sections if required */}
                    <div className="text-muted-foreground">
                      <span>
                        Editing of form structure is intended to be here. (Form Builder UI not shown here)
                      </span>
                    </div>
                  </div>
                  <Button type="submit">Save Changes</Button>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const section = projectSections[activeSectionIndex];
                    const sectionFields = getFieldsBySection(section.id);
                    handleSectionSubmit(section.id, sectionFields);
                  }}
                  className="space-y-4"
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
                          {sectionFields.map((field: any) => (
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
                                  value={formData[field.id] || ""}
                                  onChange={(e) =>
                                    handleInputChange(field.id, e.target.value)
                                  }
                                  placeholder={field.placeholder || ""}
                                  required={field.required}
                                  disabled={isProjectInactive}
                                  className={`${
                                    isProjectInactive ? "bg-gray-100" : ""
                                  }`}
                                />
                              )}
                              {field.type === "textarea" && (
                                <Textarea
                                  id={field.id}
                                  value={formData[field.id] || ""}
                                  onChange={(e) =>
                                    handleInputChange(field.id, e.target.value)
                                  }
                                  placeholder={field.placeholder || ""}
                                  required={field.required}
                                  disabled={isProjectInactive}
                                  className={`${
                                    isProjectInactive ? "bg-gray-100" : ""
                                  }`}
                                />
                              )}
                              {field.type === "definedList" && (
                                <Select
                                  value={formData[field.id] || ""}
                                  onValueChange={(value) =>
                                    handleInputChange(field.id, value)
                                  }
                                  disabled={isProjectInactive}
                                >
                                  <SelectTrigger
                                    id={field.id}
                                    className={`${
                                      isProjectInactive ? "bg-gray-100" : ""
                                    }`}
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
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                              {field.type === "location" && (
                                <LocationSelector
                                  value={formData[field.id] || ""}
                                  onChange={(value) =>
                                    handleInputChange(field.id, value)
                                  }
                                  placeholder={
                                    field.placeholder || "Enter location"
                                  }
                                  disabled={isProjectInactive}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {!completedSections.includes(
                    projectSections[activeSectionIndex].id
                  ) && (
                    <div className="flex justify-end">
                      <Button type="submit" className="w-full sm:w-auto">
                        Submit Section
                      </Button>
                    </div>
                  )}
                </form>
              )}

              {completedSections.length === sectionIds.length && !surveyCompleted && !isDesigner && (
                <div className="flex justify-end mt-4">
                  <Button onClick={handleEndSurveySubmit} className="w-full sm:w-auto">
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
                          onClick={() => handleToggleRowExpand(record.id)}
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
                            {expandedRows.includes(record.id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {expandedRows.includes(record.id) && (
                          <CardContent className="pt-0 border-t">
                            <div className="space-y-2">
                              {project.formFields?.map((field: any) => (
                                <div
                                  key={field.id}
                                  className="grid grid-cols-2 gap-2 text-sm"
                                >
                                  <div className="font-medium text-muted-foreground">
                                    {field.label || field.name}:
                                  </div>
                                  <div>
                                    {field.type === "location"
                                      ? formatLocationForDisplay(
                                          record.data[field.id] || ""
                                        )
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
