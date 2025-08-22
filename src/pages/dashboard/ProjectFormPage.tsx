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
  ScanLine,
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
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import InlineBackButton from "@/components/ui/CustomButton";
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { generateSystemFieldValues, isSystemField, formatDateForDisplay } from "@/lib/formUtils";
import { getNextRecordNumber } from "@/lib/formUtils";
import ProjectHeader from "./project-form/ProjectHeader";
import SectionTabs from "./project-form/SectionTabs";
import SectionForm from "./project-form/SectionForm";
import ProjectRecordsTable from "./project-form/ProjectRecordsTable";
import { fileToBase64, getFieldsBySection, formatLocationForDisplay, handleExportData } from "./project-form/project-form-utils";
import { Section, FieldTemplate, ProjectRecord, Project, FormData } from "./project-form/types";

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
  const [activeTab, setActiveTab] = useState("data");
  const [projectRecords, setProjectRecords] = useState<ProjectRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
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
      section.fields.filter((field) => field.type === "image" || field.type === "qrBarcode")
    );
    const duplicateIds = imageFields.filter(
      (field, index, self) =>
        self.findIndex((f) => f.id === field.id) !== index
    );
    if (duplicateIds.length > 0) {
      console.warn("Duplicate field IDs for image or qrBarcode fields detected:", duplicateIds);
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
            })),
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

        // Compose user identifier as display name + unique id suffix
        const composedUserId = `${userData?.displayName || "User"}-${currentUserId.slice(0, 8)}`;
        const initialData: FormData = { userId: composedUserId };
        const recordNoField = allFields.find((field) => field.name === "Record No.");
        allFields.forEach((field: FieldTemplate) => {
          if (field.type === "checkbox") {
            initialData[field.id] = field.defaultChecked || false;
          } else if (field.type === "multipleChoice" && Array.isArray(field.options)) {
            initialData[field.id] = [];
          } else {
            initialData[field.id] = "";
          }
        });

        // Generate automatic values for system fields based on live DB record count
        let dbRecordCount = foundProject.recordCount || 0;
        try {
          if (foundProject.id) {
            const existing = await getProjectRecords(foundProject.id);
            dbRecordCount = Array.isArray(existing) ? existing.length : dbRecordCount;
          }
        } catch (e) {
          // fallback to project's recordCount if fetch fails
        }
        const systemValues = generateSystemFieldValues(composedUserId, dbRecordCount);
        
        // Set system field values
        allFields.forEach((field: FieldTemplate) => {
          if (isSystemField(field.name)) {
            initialData[field.id] = systemValues[field.name] || "";
          }
        });

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

  const clearStorage = () => {
    localStorage.clear();
    toast({
      title: "Success",
      description: "Storage cleared. Please try submitting again.",
    });
  };

  const checkCameraPermission = async () => {
    try {
      const permissionStatus = await BarcodeScanner.checkPermission({ force: false });
      if (permissionStatus.granted) {
        return true;
      }
      const result = await BarcodeScanner.checkPermission({ force: true });
      if (result.granted) {
        return true;
      }
      toast({
        variant: "destructive",
        title: "Permission Denied",
        description: "Camera permission is required to scan QR codes or barcodes.",
      });
      return false;
    } catch (error: any) {
      console.error("Error checking camera permission:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check camera permission.",
      });
      return false;
    }
  };

  const handleScanQRBarcode = async (fieldId: string) => {
    if (!Capacitor.isNativePlatform()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Barcode scanning is only available on mobile devices.",
      });
      return;
    }

    const hasPermission = await checkCameraPermission();
    if (!hasPermission) return;

    try {
      await BarcodeScanner.hideBackground();
      document.body.classList.add("scanner-active");

      const result = await BarcodeScanner.startScan();
      document.body.classList.remove("scanner-active");
      await BarcodeScanner.showBackground();

      if (result.hasContent) {
        console.log("Scanned content:", result.content);
        handleInputChange(fieldId, result.content);
        toast({
          title: "Scan Successful",
          description: `Scanned value: ${result.content}`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "No Data Scanned",
          description: "No QR code or barcode data was detected.",
        });
      }
    } catch (error: any) {
      console.error("Error scanning QR/Barcode:", error);
      toast({
        variant: "destructive",
        title: "Scan Error",
        description: "Failed to scan QR code or barcode.",
      });
    } finally {
      document.body.classList.remove("scanner-active");
      await BarcodeScanner.showBackground();
    }
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
    if (!project?.id || (!isCollector && !isDesigner)) return;

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
            (value as File).size,
            "File type:",
            (value as File).type
          );
          const base64String = await fileToBase64(value as File);
          console.log("Image converted to Base64. Length:", base64String.length);

          const base64SizeInBytes = (base64String.length * 3) / 4 - 2;
          const maxFirestoreSize = 1 * 1024 * 1024;
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
          const base64String = await fileToBase64(value as File);
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
        surveyPayload[fieldId] = value as string;
      } else if (field?.type === "checkbox" && typeof value === "boolean") {
        surveyPayload[fieldId] = value as boolean;
      } else if (field?.type === "multipleChoice" && Array.isArray(value)) {
        surveyPayload[fieldId] = value as string[];
      } else if (value !== undefined) {
        surveyPayload[fieldId] = value;
      }
    }

    // Ensure system fields are forced with latest values
    try {
      const existing = await getProjectRecords(project.id);
      const nextRecordNo = getNextRecordNumber(Array.isArray(existing) ? existing.length : 0);
      const composedUserId = `${userData?.displayName || "User"}-${(userData?.uid || "").slice(0, 8)}`;
      const nowIso = new Date().toISOString();

      surveyPayload["userId"] = composedUserId;

      const allFields: FieldTemplate[] = sections.flatMap((s) => s.fields);
      const recordNoField = allFields.find((f) => f.name === "Record No.");
      const userIdField = allFields.find((f) => f.name === "User ID");
      const dateTimeField = allFields.find((f) => f.name === "Date and Time");
      if (recordNoField) surveyPayload[recordNoField.id] = nextRecordNo;
      if (userIdField) surveyPayload[userIdField.id] = composedUserId;
      if (dateTimeField) surveyPayload[dateTimeField.id] = nowIso;
    } catch (e) {
      // if DB count fails, continue with existing payload
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
      setFormData({ userId: `${userData?.displayName || "User"}-${(userData?.uid || "").slice(0, 8)}`, recordNo: "" });
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

  const getFieldsBySectionSafe = (sections: Section[], sectionId: string) => {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Error Loading Project</h2>
          <p className="text-muted-foreground mb-4">{error || "Project not found"}</p>
          <Button onClick={() => navigate("/dashboard/my-projects")}>
            Back to Projects
          </Button>
        </div>
      </div>
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

  const requestStoragePermission = async () => {
    if (!Capacitor.isNativePlatform()) return true;
    const permission = await Filesystem.requestPermissions();
    if (permission.publicStorage !== 'granted') {
      alert('Storage permission is required to save the CSV file.');
      return false;
    }
    return true;
  };

  const handleExportData = async () => {
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

    try {
      if (Capacitor.isNativePlatform()) {
        // Request storage permissions for mobile
        const hasPermission = await requestStoragePermission();
        if (!hasPermission) return;

        // Mobile app logic with corrected encoding
        const fileName = `${project?.name || "project"}-data-${new Date().toISOString().slice(0, 10)}.csv`;
        const result = await Filesystem.writeFile({
          path: fileName,
          data: csvContent,
          directory: Directory.Documents,
          encoding: Encoding.UTF8, // Corrected to use Encoding.UTF8
        });
        console.log('File written to:', result.uri);

        const uri = await Filesystem.getUri({
          path: fileName,
          directory: Directory.Documents,
        });
        alert(`CSV file saved to: ${uri.uri}. Check your device storage (Documents folder).`);
      } else {
        // Web browser logic (existing code)
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
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert(`Failed to export CSV: ${error.message}`);
    }
  };

  return (
    <>
      <ProjectHeader
        project={project}
        isDesigner={isDesigner}
        isEditMode={isEditMode}
        setIsEditMode={setIsEditMode}
      />
      <SectionForm
        section={projectSections[activeSectionIndex]}
        sections={projectSections}
        activeSectionIndex={activeSectionIndex}
        isCollector={isCollector}
        isDesigner={isDesigner}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSectionSubmit={handleSectionSubmit}
        isProjectInactive={isProjectInactive}
        completedSections={completedSections}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="data" className="flex-1">
            View Data
          </TabsTrigger>
          <TabsTrigger value="export" className="flex-1">
            Export
          </TabsTrigger>
        </TabsList>

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
    </>
  );
};

export default ProjectFormPage;