/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit,
  Camera,
  Upload,
} from "lucide-react";
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
import {
  getProjectById,
  submitFormData,
  deleteProject,
  updateProject,
  getProjectRecords,
} from "@/lib/projectOperations";
import { useSectionSurvey } from "@/hooks/useSectionSurvey";
import { useFirebaseSync } from "@/hooks/useFirebaseSync";
import { useNetwork } from "@/contexts/NetworkContext";
import { Capacitor } from "@capacitor/core";
import lz from "lz-string";

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
  defaultChecked?: boolean;
  barcodeType?: "qr" | "barcode";
}

interface ProjectRecord {
  id?: string;
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
  [key: string]: string | File | boolean | string[] | null;
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
  const [localCompletedSections, setLocalCompletedSections] = useState<string[]>([]);
  const [imagePreviews, setImagePreviews] = useState<{ [key: string]: string | null }>({});

  // Clean up image preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      Object.values(imagePreviews).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [imagePreviews]);

  // Check for duplicate field IDs to ensure unique image previews
  useEffect(() => {
    const imageFields = sections.flatMap((section) =>
      section.fields.filter((field) => field.type === "image")
    );
    const duplicateIds = imageFields.filter(
      (field, index, self) =>
        self.findIndex((f) => f.id === field.id) !== index
    );
    if (duplicateIds.length > 0) {
      console.warn("Duplicate field IDs for image fields detected:", duplicateIds);
    }
  }, [sections]);

  // Sync offline data when connection is restored
  useEffect(() => {
    if (!isOnline || !project?.id) return;

    const syncOfflineData = async () => {
      try {
        // Sync designer data
        const offlineDesignerData = localStorage.getItem(`offline_designer_${project.id}`);
        if (offlineDesignerData) {
          const decompressed = lz.decompress(offlineDesignerData);
          const designerData = decompressed ? JSON.parse(decompressed) : null;
          if (designerData) {
            await updateProject(project.id, designerData);
            localStorage.removeItem(`offline_designer_${project.id}`);
            toast({
              title: "Designer Data Synced",
              description: "Offline designer data has been synced.",
            });
          }
        }

        // Sync collector data
        const offlineCollectorRecords = localStorage.getItem(`offline_records_${project.id}`);
        if (offlineCollectorRecords) {
          const decompressed = lz.decompress(offlineCollectorRecords);
          const recordsArray = decompressed ? JSON.parse(decompressed) : [];
          for (const record of recordsArray) {
            await submitFormData(project.id, record, userData.uid);
          }
          localStorage.removeItem(`offline_records_${project.id}`);
          toast({
            title: "Collector Data Synced",
            description: "Offline collector data has been synced.",
          });
        }
      } catch (error: any) {
        console.error("Error syncing offline data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to sync offline data.",
        });
      }
    };

    syncOfflineData();
  }, [isOnline, project?.id, userData.uid]);

  // Fetch project details
  useEffect(() => {
    console.log(
      "useEffect for fetchProject triggered. projectId:",
      projectId,
      "currentUserId:",
      currentUserId
    );
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!projectId) {
          throw new Error("Project ID is missing");
        }

        console.log("Fetching project with ID:", projectId);

        const isCapacitor = Capacitor.isNativePlatform();
        let storedProjects = null;
        if (isCapacitor) {
          const { Preferences } = await import("@capacitor/preferences");
          const { value } = await Preferences.get({ key: "myProjects" });
          console.log("Capacitor Storage 'myProjects':", value);
          storedProjects = value;
        } else {
          storedProjects = localStorage.getItem("myProjects");
          console.log("localStorage 'myProjects':", storedProjects);
        }

        let foundProject: any = null;
        if (storedProjects) {
          const parsedProjects = JSON.parse(storedProjects);
          console.log("Parsed projects:", parsedProjects);
          foundProject = parsedProjects.find((p: any) => p.id === projectId);
        }

        if (!foundProject) {
          console.log("Project not found in storage, fetching from Firebase...");
          const firebaseProject = await getProjectById(projectId);
          if (firebaseProject) {
            foundProject = firebaseProject;
            console.log("Fetched project from Firebase:", foundProject);
          } else {
            throw new Error("Project not found in Firebase");
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
              type: field.type === "numbers" ? "number" : field.type || "text",
              required: field.required !== undefined ? field.required : false,
              sectionId: section.id,
              placeholder: field.placeholder || "",
              options: field.options || [],
              defaultChecked: field.defaultChecked !== undefined ? field.defaultChecked : false,
              barcodeType: field.barcodeType || "qr",
            })).filter((field) => field.name !== "User ID"),
          }));
          console.log("Populated projectSections:", projectSections);
        } else {
          console.warn("No formSections found, using default section with Record No.");
          projectSections = [
            {
              id: "section_default",
              name: "Section 1",
              order: 0,
              fields: [
                {
                  id: "section_default_0",
                  name: "Record No.",
                  label: "Record No.",
                  type: "text",
                  required: true,
                  sectionId: "section_default",
                  placeholder: "Enter Record No.",
                  options: [],
                  defaultChecked: false,
                  barcodeType: "qr",
                },
              ],
            },
          ];
        }

        const allFields: FieldTemplate[] = projectSections.flatMap(
          (section) => section.fields
        );
        console.log("All fields:", allFields);

        setSections(projectSections);
        setProject({
          ...foundProject,
          createdAt: new Date(foundProject.createdAt),
          recordCount: foundProject.recordCount || 0,
          status: foundProject.status || "active",
          formSections: projectSections,
        });

        const initialData: FormData = { userId: currentUserId };
        const recordNoField = allFields.find((field) => field.name === "Record No.");
        allFields.forEach((field: FieldTemplate) => {
          if (field.type === "checkbox") {
            initialData[field.id] = field.defaultChecked || false;
          } else if (field.type === "multipleChoice") {
            initialData[field.id] = [];
          } else {
            initialData[field.id] = "";
          }
        });
        if (recordNoField) {
          initialData[recordNoField.id] = "";
        }
        console.log("Initial formData:", initialData);
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
    console.log(
      "useEffect for fetchRecords triggered. projectId:",
      projectId,
      "activeTab:",
      activeTab
    );
    const fetchRecords = async () => {
      if (!projectId || activeTab !== "data") return;

      try {
        setLoadingRecords(true);
        let records = await getProjectRecords(projectId);

        // Filter records based on user role
        if (isCollector && !isDesigner) {
          records = records.filter((record) => record.createdBy === currentUserId);
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
    submitSection,
    endSurvey,
    resetSurvey,
  } = useSectionSurvey(sectionIds);

  // Memoize dependencies for useFirebaseSync to prevent continuous logs
  const memoizedProjectId = useMemo(() => project?.id || "", [project?.id]);
  const memoizedUserId = useMemo(() => userData?.uid || "", [userData?.uid]);
  useFirebaseSync(memoizedProjectId, memoizedUserId);

  const handleInputChange = (fieldId: string, value: string | File | boolean | string[] | null) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Handle image preview with debugging
    if (value instanceof File) {
      const oldUrl = imagePreviews[fieldId];
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      const newUrl = URL.createObjectURL(value);
      console.log("Generated preview URL for field", fieldId, ":", newUrl);
      setImagePreviews((prev) => ({
        ...prev,
        [fieldId]: newUrl,
      }));
    } else if (value === null) {
      const oldUrl = imagePreviews[fieldId];
      if (oldUrl) {
        URL.revokeObjectURL(oldUrl);
      }
      setImagePreviews((prev) => ({
        ...prev,
        [fieldId]: null,
      }));
    }
  };

  // Helper function to resize an image
  const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while preserving aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get canvas context"));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to convert image to blob"));
            }
          },
          file.type,
          0.8 // JPEG quality (0 to 1)
        );
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
        URL.revokeObjectURL(img.src);
      };
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSizeInBytes) {
        reject(
          new Error(
            `Image size exceeds 5MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
          )
        );
        return;
      }

      // Use an IIFE to handle async logic inside the executor
      (async () => {
        try {
          // Resize the image to a maximum of 800x800 pixels
          const resizedBlob = await resizeImage(file, 800, 800);
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log("fileToBase64 success. Base64 string length:", result.length);
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error("fileToBase64 error:", error);
            reject(error);
          };
          reader.readAsDataURL(resizedBlob);
        } catch (error) {
          reject(error);
        }
      })();
    });
  };

  const clearStorage = () => {
    localStorage.clear();
    toast({
      title: "Success",
      description: "Storage cleared. Please try submitting again.",
    });
  };

  const handleSectionSubmit = async (sectionId: string, sectionFields: FieldTemplate[]) => {
    try {
      const sectionData = await sectionFields.reduce(async (accPromise, field) => {
        const acc = await accPromise;
        let value = formData[field.id];
        if (field.type === "image" && value instanceof File) {
          value = await fileToBase64(value);
        } else if (field.type === "qrBarcode" && value instanceof File) {
          value = await fileToBase64(value);
        }
        acc[field.id] = value;
        return acc;
      }, Promise.resolve({} as FormData));

      const record = {
        sectionId,
        data: sectionData,
        timestamp: new Date().toISOString(),
        userId: currentUserId,
      };

      const offlineRecords = localStorage.getItem("offline_records");
      let recordsArray = [];
      if (offlineRecords) {
        const decompressed = lz.decompress(offlineRecords);
        recordsArray = decompressed ? JSON.parse(decompressed) : [];
      }

      recordsArray.push(record);

      if (recordsArray.length > 5) {
        recordsArray = recordsArray.slice(-5);
      }

      const compressedRecords = lz.compress(JSON.stringify(recordsArray));
      localStorage.setItem("offline_records", compressedRecords);

      setLocalCompletedSections((prev) => {
        if (!prev.includes(sectionId)) {
          return [...prev, sectionId];
        }
        return prev;
      });

      submitSection(sectionId, sectionData);
      toast({
        title: "Success",
        description: "Section submitted successfully.",
      });

      if (activeSectionIndex < projectSections.length - 1) {
        setActiveSectionIndex(activeSectionIndex + 1);
      }
    } catch (error: any) {
      console.error("Error submitting section:", error);
      if (error.message.includes("quota")) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Storage quota exceeded. Please clear data or sync online.",
        });
        localStorage.clear();
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to submit section.",
        });
      }
    }
  };

  const handleEndSurveySubmit = async () => {
    if (!project?.id || !isCollector) return;

    const surveyPayload: Record<string, any> = {};
    sectionIds.forEach((sid) => {
      Object.assign(surveyPayload, sectionData[sid] || {});
    });

    for (const fieldId in formData) {
      const value = formData[fieldId];
      const field = sections.flatMap((s) => s.fields).find((f) => f.id === fieldId);

      if (field?.type === "image" && value instanceof File) {
        try {
          console.log(
            "Processing image for field:",
            fieldId,
            "File size:",
            value.size,
            "File type:",
            value.type
          );
          const base64String = await fileToBase64(value);
          console.log("Image converted to Base64. Length:", base64String.length);

          // Check if the Base64 string is too large for Firestore (1 MB limit per document)
          const base64SizeInBytes = (base64String.length * 3) / 4 - 2; // Approximate size in bytes
          const maxFirestoreSize = 1 * 1024 * 1024; // 1 MB
          if (base64SizeInBytes > maxFirestoreSize) {
            throw new Error(
              `Base64 image size exceeds Firestore limit of 1 MB. Size: ${(base64SizeInBytes / (1024 * 1024)).toFixed(2)} MB`
            );
          }

          surveyPayload[fieldId] = base64String;
        } catch (error: any) {
          console.error("Error processing image:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to process image.",
          });
          return;
        }
      } else if (field?.type === "qrBarcode" && value instanceof File) {
        try {
          const base64String = await fileToBase64(value);
          const base64SizeInBytes = (base64String.length * 3) / 4 - 2;
          const maxFirestoreSize = 1 * 1024 * 1024;
          if (base64SizeInBytes > maxFirestoreSize) {
            throw new Error(
              `Base64 QR/Barcode image size exceeds Firestore limit of 1 MB. Size: ${(base64SizeInBytes / (1024 * 1024)).toFixed(2)} MB`
            );
          }
          surveyPayload[fieldId] = base64String;
        } catch (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process QR/Barcode image.",
          });
          return;
        }
      } else if (field?.type === "qrBarcode" && typeof value === "string") {
        surveyPayload[fieldId] = value;
      } else if (field?.type === "checkbox" && typeof value === "boolean") {
        surveyPayload[fieldId] = value;
      } else if (field?.type === "multipleChoice" && Array.isArray(value)) {
        surveyPayload[fieldId] = value;
      } else if (value !== undefined) { // Explicitly exclude undefined values
        surveyPayload[fieldId] = value;
      }
    }

    surveyPayload["userId"] = formData["userId"];
    const recordNoField = projectSections[0]?.fields.find((f) => f.name === "Record No.");
    if (recordNoField) {
      surveyPayload[recordNoField.id] = formData[recordNoField.id];
    }

    try {
      console.log("isOnline status:", isOnline);
      if (isOnline) {
        console.log("Submitting data to Firebase:", surveyPayload);
        await submitFormData(project.id, surveyPayload, userData.uid);
        toast({
          title: "Survey submitted",
          description: "Your responses have been saved.",
        });
      } else {
        console.log("Offline mode: Saving to localStorage");
        const offlineRecords = localStorage.getItem(`offline_records_${project.id}`);
        let recordsArray = [];
        if (offlineRecords) {
          const decompressed = lz.decompress(offlineRecords);
          recordsArray = decompressed ? JSON.parse(decompressed) : [];
        }
        recordsArray.push(surveyPayload);
        const compressedData = lz.compress(JSON.stringify(recordsArray));
        localStorage.setItem(`offline_records_${project.id}`, compressedData);
        toast({
          title: "Offline submission",
          description: "Data will be saved after connection is restored.",
        });
        navigate("/dashboard/my-projects"); // Navigate to project tabs
      }
      endSurvey();
      resetSurvey();
      setFormData({ userId: currentUserId, recordNo: "" });
      setActiveSectionIndex(0);
      localStorage.removeItem(`records_${project.id}_draft`);
    } catch (err: any) {
      console.error("Error submitting to Firebase:", err);
      toast({
        variant: "destructive",
        title: "Error submitting survey",
        description: err.message || "Submission failed.",
      });
    }
  };

  const getFieldsBySection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    return section ? section.fields : [];
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!project || !isDesigner) return;

    const updatedSections = sections.filter((section) => section.id !== sectionId);

    setSections(updatedSections);
    setProject((prev) =>
      prev ? { ...prev, formSections: updatedSections } : null
    );

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = {
          ...storedProjects[projectIndex],
          formSections: updatedSections,
        };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
      const compressedData = lz.compress(JSON.stringify({ formSections: updatedSections }));
      localStorage.setItem(`offline_designer_${project.id}`, compressedData);
      toast({
        title: "Offline submission",
        description: "Data will be saved after connection is restored.",
      });
      navigate("/dashboard/my-projects");
    }
    toast({ title: "Section deleted", description: "Section has been removed." });
  };

  const handleToggleRequired = (fieldId: string) => {
    if (!project || !isDesigner) return;

    console.log("Toggling required for fieldId:", fieldId);
    let fieldFound = false;

    const updatedSections = sections.map((section) => {
      const updatedFields = section.fields.map((field) => {
        if (field.id === fieldId) {
          fieldFound = true;
          console.log(
            `Found field ${field.id}, toggling required from ${field.required} to ${!field.required}`
          );
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
    setProject((prev) =>
      prev ? { ...prev, formSections: updatedSections } : null
    );

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = {
          ...storedProjects[projectIndex],
          formSections: updatedSections,
        };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
      const compressedData = lz.compress(JSON.stringify({ formSections: updatedSections }));
      localStorage.setItem(`offline_designer_${project.id}`, compressedData);
      toast({
        title: "Offline submission",
        description: "Data will be saved after connection is restored.",
      });
      navigate("/dashboard/my-projects");
    }
    toast({ title: "Field updated", description: "Required status has been toggled." });
  };

  const handleRenameSection = (sectionId: string, newName: string) => {
    if (!project || !isDesigner) return;

    const updatedSections = sections.map((section) =>
      section.id === sectionId ? { ...section, name: newName } : section
    );
    setSections(updatedSections);
    setProject((prev) =>
      prev ? { ...prev, formSections: updatedSections } : null
    );

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = {
          ...storedProjects[projectIndex],
          formSections: updatedSections,
        };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
      const compressedData = lz.compress(JSON.stringify({ formSections: updatedSections }));
      localStorage.setItem(`offline_designer_${project.id}`, compressedData);
      toast({
        title: "Offline submission",
        description: "Data will be saved after connection is restored.",
      });
      navigate("/dashboard/my-projects");
    }
    toast({ title: "Section renamed", description: "Section name has been updated." });
  };

  const handleUpdateFieldName = (fieldId: string, newName: string) => {
    if (!project || !isDesigner) return;

    console.log("Updating field name for fieldId:", fieldId, "to:", newName);
    let fieldFound = false;

    const updatedSections = sections.map((section) => {
      const updatedFields = section.fields.map((field) => {
        if (field.id === fieldId) {
          fieldFound = true;
          console.log(
            `Found field ${field.id}, updating name from ${field.name} to ${newName}`
          );
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
    setProject((prev) =>
      prev ? { ...prev, formSections: updatedSections } : null
    );

    if (isOnline) {
      updateProject(project.id, { formSections: updatedSections });
    } else {
      const storedProjects = JSON.parse(localStorage.getItem("myProjects") || "[]");
      const projectIndex = storedProjects.findIndex((p: any) => p.id === project.id);
      if (projectIndex !== -1) {
        storedProjects[projectIndex] = {
          ...storedProjects[projectIndex],
          formSections: updatedSections,
        };
        localStorage.setItem("myProjects", JSON.stringify(storedProjects));
      }
      const compressedData = lz.compress(JSON.stringify({ formSections: updatedSections }));
      localStorage.setItem(`offline_designer_${project.id}`, compressedData);
      toast({
        title: "Offline submission",
        description: "Data will be saved after connection is restored.",
      });
      navigate("/dashboard/my-projects");
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
    const allFields = projectSections.flatMap((s) => s.fields);
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
            val = "Image (Base64)";
          } else if (val instanceof File) {
            val = val.name;
          } else if (Array.isArray(val)) {
            val = val.join("; ");
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
      navigate("/dashboard/my-projects"); // Navigate to project tabs after ending survey
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
                              onChange={(e) =>
                                handleRenameSection(section.id, e.target.value)
                              }
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
                                  onChange={(e) =>
                                    handleUpdateFieldName(field.id, e.target.value)
                                  }
                                  className="w-full border p-1"
                                />
                              ) : (
                                <span className="text-sm font-medium">
                                  {field.label || field.name}
                                  {field.required && (
                                    <span className="text-red-500 ml-1">*</span>
                                  )}
                                </span>
                              )}
                              {isEditMode && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleRequired(field.id)}
                                  className={`ml-2 ${field.required
                                    ? "text-red-500"
                                    : "text-green-500"
                                    }`}
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
                        {localCompletedSections.includes(section.id) && (
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
                  <Button
                    variant="outline"
                    onClick={clearStorage}
                    className="mt-2"
                  >
                    Clear Storage
                  </Button>
                  {(() => {
                    const section = projectSections[activeSectionIndex];
                    const sectionFields = getFieldsBySection(section.id);
                    console.log("Current section:", section);
                    console.log("Section fields:", sectionFields);

                    return (
                      <div className="mb-6">
                        <div className="mb-4">
                          <h3 className="text-lg font-medium">{section.name}</h3>
                          <Separator className="mt-2" />
                        </div>
                        <div className="space-y-4 pl-0 sm:pl-2">
                          {activeSectionIndex === 0 && (
                            <>
                              <div className="space-y-2">
                                <label
                                  htmlFor="userId"
                                  className="text-sm font-medium flex items-center"
                                >
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
                              {(() => {
                                const recordNoField = projectSections[0]?.fields.find(
                                  (f) => f.name === "Record No."
                                );
                                console.log("Record No. field:", recordNoField);
                                if (recordNoField) {
                                  return (
                                    <div className="space-y-2">
                                      <label
                                        htmlFor={recordNoField.id}
                                        className="text-sm font-medium flex items-center"
                                      >
                                        Record No.
                                        {recordNoField.required && (
                                          <span className="text-red-500 ml-1">*</span>
                                        )}
                                      </label>
                                      <Input
                                        id={recordNoField.id}
                                        value={formData[recordNoField.id] as string || ""}
                                        onChange={(e) =>
                                          handleInputChange(
                                            recordNoField.id,
                                            e.target.value
                                          )
                                        }
                                        placeholder="Enter Record No."
                                        disabled={isProjectInactive}
                                        className={`${isProjectInactive ? "bg-gray-100" : ""
                                          }`}
                                      />
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </>
                          )}
                          {sectionFields.length > 0 ? (
                            sectionFields.map((field: FieldTemplate) => {
                              const recordNoField =
                                activeSectionIndex === 0
                                  ? projectSections[0]?.fields.find(
                                    (f) => f.name === "Record No."
                                  )
                                  : null;
                              if (
                                field.name === "Record No." &&
                                recordNoField &&
                                formData[recordNoField.id] !== undefined
                              )
                                return null;

                              return (
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
                                      className={`${isProjectInactive ? "bg-gray-100" : ""
                                        }`}
                                    />
                                  )}
                                  {field.type === "textAndNumbers" && (
                                    <Input
                                      id={field.id}
                                      value={formData[field.id] as string || ""}
                                      onChange={(e) =>
                                        handleInputChange(field.id, e.target.value)
                                      }
                                      placeholder={field.placeholder || ""}
                                      required={field.required}
                                      disabled={isProjectInactive}
                                      className={`${isProjectInactive ? "bg-gray-100" : ""
                                        }`}
                                    />
                                  )}
                                  {(field.type === "number" ||
                                    field.type === "numbers") && (
                                      <Input
                                        id={field.id}
                                        type="number"
                                        value={formData[field.id] as string || ""}
                                        onChange={(e) =>
                                          handleInputChange(field.id, e.target.value)
                                        }
                                        placeholder={field.placeholder || "Enter a number"}
                                        required={field.required}
                                        disabled={isProjectInactive}
                                        className={`${isProjectInactive ? "bg-gray-100" : ""
                                          }`}
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
                                      className={`${isProjectInactive ? "bg-gray-100" : ""
                                        }`}
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
                                        className={`${isProjectInactive ? "bg-gray-100" : ""
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
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          id={field.id}
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) =>
                                            handleInputChange(
                                              field.id,
                                              e.target.files?.[0] || null
                                            )
                                          }
                                          required={field.required}
                                          disabled={isProjectInactive}
                                          className={`${isProjectInactive ? "bg-gray-100" : ""
                                            } hidden`}
                                        />
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            document.getElementById(field.id)?.click()
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center space-x-2"
                                          disabled={isProjectInactive}
                                        >
                                          <Camera className="h-4 w-4" />
                                          <span>Capture</span>
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            document.getElementById(field.id)?.click()
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center space-x-2"
                                          disabled={isProjectInactive}
                                        >
                                          <Upload className="h-4 w-4" />
                                          <span>Upload</span>
                                        </Button>
                                        {formData[field.id] && (
                                          <Button
                                            type="button"
                                            onClick={() => handleInputChange(field.id, null)}
                                            variant="outline"
                                            size="sm"
                                            className="flex items-center space-x-2 text-red-500"
                                            disabled={isProjectInactive}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                            <span>Clear</span>
                                          </Button>
                                        )}
                                      </div>
                                      {imagePreviews[field.id] && (
                                        <div className="mt-2">
                                          <img
                                            src={imagePreviews[field.id]!}
                                            alt="Preview"
                                            className="max-w-full h-auto rounded-md"
                                            style={{ maxHeight: "200px" }}
                                          />
                                        </div>
                                      )}
                                    </div>
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
                                      className={`${isProjectInactive ? "bg-gray-100" : ""
                                        }`}
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
                                      className={`${isProjectInactive ? "bg-gray-100" : ""
                                        }`}
                                    />
                                  )}
                                  {field.type === "checkbox" && (
                                    <div className="flex items-center space-x-1">
                                      <Checkbox
                                        id={field.id}
                                        checked={formData[field.id] as boolean || false}
                                        onCheckedChange={(checked) =>
                                          handleInputChange(field.id, checked)
                                        }
                                        disabled={isProjectInactive}
                                      />
                                      <label
                                        htmlFor={field.id}
                                        className="text-xs text-muted-foreground"
                                      >
                                        {field.label || field.name}
                                      </label>
                                    </div>
                                  )}
                                  {field.type === "multipleChoice" && (
                                    <div className="space-y-1">
                                      {field.options?.map((option: string) => (
                                        <div
                                          key={option}
                                          className="flex items-center space-x-1"
                                        >
                                          <Checkbox
                                            id={`${field.id}-${option}`}
                                            checked={
                                              (formData[field.id] as string[] || []).includes(
                                                option
                                              )
                                            }
                                            onCheckedChange={(checked) => {
                                              const currentValues =
                                                formData[field.id] as string[] || [];
                                              const newValues = checked
                                                ? [...currentValues, option]
                                                : currentValues.filter(
                                                  (val) => val !== option
                                                );
                                              handleInputChange(field.id, newValues);
                                            }}
                                            disabled={isProjectInactive}
                                          />
                                          <label
                                            htmlFor={`${field.id}-${option}`}
                                            className="text-xs text-muted-foreground"
                                          >
                                            {option}
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {field.type === "qrBarcode" && (
                                    <div className="space-y-2">
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          id={`${field.id}-text`}
                                          value={
                                            typeof formData[field.id] === "string"
                                              ? (formData[field.id] as string)
                                              : ""
                                          }
                                          onChange={(e) =>
                                            handleInputChange(field.id, e.target.value)
                                          }
                                          placeholder={
                                            field.barcodeType === "qr"
                                              ? "Enter QR Code value"
                                              : "Enter Barcode value"
                                          }
                                          disabled={isProjectInactive}
                                          className={`${isProjectInactive ? "bg-gray-100" : ""
                                            }`}
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          id={`${field.id}-image`}
                                          type="file"
                                          accept="image/*"
                                          capture="environment"
                                          onChange={(e) =>
                                            handleInputChange(
                                              field.id,
                                              e.target.files?.[0] || null
                                            )
                                          }
                                          required={field.required}
                                          disabled={isProjectInactive}
                                          className={`${isProjectInactive ? "bg-gray-100" : ""
                                            } hidden`}
                                        />
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            document.getElementById(`${field.id}-image`)?.click()
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center space-x-2"
                                        >
                                          <Camera className="h-4 w-4" />
                                          <span>Capture</span>
                                        </Button>
                                        <Button
                                          type="button"
                                          onClick={() =>
                                            document.getElementById(`${field.id}-image`)?.click()
                                          }
                                          variant="outline"
                                          size="sm"
                                          className="flex items-center space-x-2"
                                        >
                                          <Upload className="h-4 w-4" />
                                          <span>Upload</span>
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No fields available for this section. Please check project
                              configuration.
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
                        <Button
                          type="submit"
                          className="w-full sm:w-auto"
                          disabled={isProjectInactive}
                        >
                          Submit Section
                        </Button>
                      </div>
                    )}
                </form>
              )}
              {isCollector &&
                !isDesigner &&
                completedSections.length === sectionIds.length && (
                  <div className="flex justify-end mt-4">
                    <Button
                      onClick={handleEndSurveySubmit}
                      className="w-full sm:w-auto"
                      disabled={isProjectInactive}
                    >
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
                      <Card
                        key={record.id || index}
                        className="border"
                      >
                        <div
                          className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            handleToggleRowExpand(record.id || `record_${index}`)
                          }
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
                            {expandedRows.includes(
                              record.id || `record_${index}`
                            ) ? (
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
                              {projectSections
                                .flatMap((s) => s.fields)
                                .map((field: any) => (
                                  <div
                                    key={field.id}
                                    className="grid grid-cols-2 gap-2 text-sm"
                                  >
                                    <div className="font-medium text-muted-foreground">
                                      {field.label || field.name}:
                                    </div>
                                    <div>
                                      {field.type === "location" ||
                                        field.type === "coordinates"
                                        ? formatLocationForDisplay(
                                          record.data[field.id] || ""
                                        )
                                        : (field.type === "image" ||
                                          field.type === "qrBarcode") &&
                                          typeof record.data[field.id] ===
                                          "string" &&
                                          record.data[field.id].startsWith(
                                            "data:image/"
                                          )
                                          ? (
                                            <img
                                              src={record.data[field.id]}
                                              alt="Uploaded"
                                              style={{ maxWidth: "100px" }}
                                            />
                                          )
                                          : field.type === "multipleChoice" &&
                                            Array.isArray(record.data[field.id])
                                            ? record.data[field.id].join(", ")
                                            : field.type === "checkbox"
                                              ? record.data[field.id]
                                                ? "Yes"
                                                : "No"
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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