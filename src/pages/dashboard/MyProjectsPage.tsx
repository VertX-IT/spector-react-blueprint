/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNetwork } from "@/contexts/NetworkContext";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  getUserProjects,
  deleteProject,
  Project,
  duplicateProject,
  saveProject,
  verifyFirebaseConnection,
  generateSequentialPin,
} from "@/lib/projectOperations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import lz from 'lz-string'; // Import lz-string for decompression

const MyProjectsPage: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();
  const isDesigner = userData?.role === "designer";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [projectToDuplicate, setProjectToDuplicate] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);
  const wasOfflineRef = useRef(false); // Track previous offline state

  // Move loadProjects to component scope so it can be called elsewhere
  const loadProjects = async () => {
    setLoading(true);
    try {
      let allProjects: Project[] = [];

      // Fetch from localStorage
      const storedProjects = localStorage.getItem("myProjects");
      if (storedProjects) {
        const parsedProjects: Project[] = JSON.parse(storedProjects);
        allProjects = parsedProjects.map((project) => ({
          ...project,
          createdAt: new Date(project.createdAt),
        }));
        console.log("LocalStorage Projects:", allProjects);
      } else {
        localStorage.setItem("myProjects", JSON.stringify([]));
      }

      // Fetch from Firebase if online and user is authenticated
      if (isOnline && currentUser?.uid) {
        console.log("Fetching from Firebase with UID:", currentUser.uid);
        const firebaseProjects = await getUserProjects(currentUser.uid);
        console.log("Firebase Projects:", firebaseProjects);
        const firebaseProjectsWithDates = firebaseProjects.map((project) => ({
          ...project,
          createdAt: new Date(project.createdAt),
          formSections: Array.isArray(project.formSections) ? project.formSections : [],
        }));

        // Merge projects, prioritizing Firebase data
        const mergedProjects = [
          ...allProjects.filter((local) => !firebaseProjects.some((fb) => fb.id === local.id)),
          ...firebaseProjectsWithDates,
        ];
        console.log("Merged Projects before set:", mergedProjects);

        if (mergedProjects.length > 0) {
          localStorage.setItem("myProjects", JSON.stringify(mergedProjects));
          setProjects([...mergedProjects]); // Ensure new array reference
          console.log("Projects state set to:", mergedProjects);
        } else {
          console.log("No projects to set, using local fallback");
          setProjects([...allProjects]); // Ensure new array reference
        }
      } else {
        console.log("Offline or no user, using local projects");
        setProjects([...allProjects]); // Ensure new array reference
      }
    } catch (error) {
      console.error("Error loading projects:", error);
      toast.error("Failed to load projects");
      setProjects([]); // Reset state in case of error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [userData, currentUser, isOnline]);

  // Debug effect to log projects state
  useEffect(() => {
    if (!loading && projects.length > 0) {
      console.log("Current projects state:", projects);
    }
  }, [projects, loading]);

  // Sync offline data when connection changes from offline to online
  useEffect(() => {
    if (isOnline && wasOfflineRef.current && currentUser?.uid) {
      console.log("Connection restored, initiating sync...");
      syncOfflineProject();
    }
    wasOfflineRef.current = !isOnline; // Update previous state
  }, [isOnline, currentUser?.uid]);

  const syncOfflineProject = async () => {
    const offlineData = localStorage.getItem('offline_project_creation');
    if (!offlineData) {
      console.log('No offline data to sync');
      return;
    }

    try {
      console.log('Starting offline project sync...');
      const decompressed = lz.decompress(offlineData);
      const projectCreationData = decompressed ? JSON.parse(decompressed) : null;
      if (!projectCreationData) {
        console.log('Failed to parse offline data');
        return;
      }

      // Generate a new PIN for the offline project
      let latestPin: string = '000000';
      let firebaseHighestPin: string = '000000';
      try {
        const pinFromFirebase = await generateSequentialPin();
        const numericPin = parseInt(pinFromFirebase);
        if (!isNaN(numericPin) && numericPin > 0) {
          firebaseHighestPin = (numericPin - 1).toString().padStart(6, '0');
        }
      } catch (e) {
        console.log('Failed to fetch PIN from Firebase, using local fallback:', e);
      }

      const projects = localStorage.getItem('myProjects')
        ? JSON.parse(localStorage.getItem('myProjects') || '[]')
        : [];
      let localHighestPin: string = '000000';
      if (projects.length > 0) {
        localHighestPin = projects.reduce((max: string, prj: any) => {
          if (typeof prj.projectPin === 'string' && /^\d{6}$/.test(prj.projectPin) && prj.projectPin > max) {
            return prj.projectPin;
          }
          return max;
        }, '000000');
      }

      latestPin = [firebaseHighestPin, localHighestPin].sort().reverse()[0] || '000000';
      const numericPin = parseInt(latestPin, 10) || 0;
      let newPin = numericPin + 1;
      if (newPin > 999999) newPin = 0;
      const offlineProjectPin = newPin.toString().padStart(6, '0');
      console.log('Generated new PIN for offline project:', offlineProjectPin);

      const formFields = localStorage.getItem('formFields')
        ? JSON.parse(localStorage.getItem('formFields') || '[]')
        : [];
      const formSections = localStorage.getItem('formSections')
        ? JSON.parse(localStorage.getItem('formSections') || '[]')
        : [];
      const projectDataToSync = projectCreationData.projectData || projectCreationData.data;

      const completeProjectData = {
        name: projectDataToSync.name,
        category: projectDataToSync.category,
        assetName: projectDataToSync.assetName,
        description: projectDataToSync.description || '',
        formFields,
        formSections,
        projectPin: offlineProjectPin,
        createdAt: new Date(),
        recordCount: 0,
        createdBy: currentUser?.uid || 'anonymous',
      };

      const connectionCheck = await verifyFirebaseConnection();
      if (!connectionCheck.success) {
        throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
      }

      const savedProject = await saveProject(completeProjectData);
      console.log('Offline project saved to Firebase:', savedProject);

      const existingProjects = localStorage.getItem('myProjects')
        ? JSON.parse(localStorage.getItem('myProjects') || '[]')
        : [];
      const newProject = {
        id: savedProject.id || Date.now().toString(),
        name: completeProjectData.name,
        category: completeProjectData.category,
        assetName: completeProjectData.assetName,
        description: completeProjectData.description,
        createdAt: new Date().toISOString(),
        recordCount: 0,
        formFields,
        formSections,
        projectPin: completeProjectData.projectPin,
      };

      existingProjects.push(newProject);
      localStorage.setItem('myProjects', JSON.stringify(existingProjects));

      // Clear offline data
      localStorage.removeItem('offline_project_creation');
      localStorage.removeItem('formFields');
      localStorage.removeItem('formSections');
      localStorage.removeItem('projectData');

      toast.success('Offline project automatically synced!');
      // Reload projects to reflect the new synced project
      await loadProjects();
    } catch (error: any) {
      console.error('Error syncing offline project:', error);
      toast.error(`Failed to sync offline project: ${error.message}`);
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      // Delete from Firebase if online
      if (isOnline && currentUser?.uid) {
        await deleteProject(id);
      }

      // Delete from localStorage
      const storedProjects = localStorage.getItem("myProjects");
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.filter((p: any) => p.id !== id);
        localStorage.setItem("myProjects", JSON.stringify(updatedProjects));
      }

      const updatedProjects = projects.filter((project) => project.id !== id);
      setProjects([...updatedProjects]); // Ensure new array reference
      toast.success("Project deleted successfully");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  const handleDuplicateClick = (id: string) => {
    const project = projects.find((p) => p.id === id);
    if (project) {
      setNewProjectName(`${project.name} (Copy)`);
      setNewProjectCategory(project.category);
      setProjectToDuplicate(id);
      setIsDuplicateDialogOpen(true);
    }
  };

  const handleDuplicateProject = async () => {
    if (!projectToDuplicate) return;

    setIsDuplicating(true);
    try {
      const userId = currentUser?.uid;
      if (!userId) throw new Error("User not logged in");

      const firebaseProjects = await getUserProjects(userId);
      const storedProjects = localStorage.getItem("myProjects");
      const localProjects = storedProjects ? JSON.parse(storedProjects) : [];

      let highestPin = 0;
      [...firebaseProjects, ...localProjects].forEach((p: any) => {
        const pinNumber = parseInt(p.projectPin);
        if (!isNaN(pinNumber) && pinNumber > highestPin) {
          highestPin = pinNumber;
        }
      });

      const nextPin = (highestPin + 1).toString().padStart(6, "0");

      const localOriginal = localProjects.find(
        (p: any) => p.id === projectToDuplicate
      );

      if (localOriginal) {
        const newLocalProject = {
          ...localOriginal,
          id: `proj_${Date.now()}`,
          name: newProjectName,
          category: newProjectCategory,
          projectPin: nextPin,
          createdAt: new Date().toISOString(),
          recordCount: 0,
        };

        const updatedProjects = [...localProjects, newLocalProject];
        localStorage.setItem("myProjects", JSON.stringify(updatedProjects));

        setProjects((prev) => [
          ...prev,
          {
            ...newLocalProject,
            createdAt: new Date(newLocalProject.createdAt),
          },
        ]);

        toast.success("Project duplicated locally");
      } else {
        const duplicatedFirebaseProject = await duplicateProject(
          projectToDuplicate,
          newProjectName
        );

        const newLocalEntry = {
          ...duplicatedFirebaseProject,
          createdAt: duplicatedFirebaseProject.createdAt.toISOString(),
        };
        const updatedProjects = [...localProjects, newLocalEntry];
        localStorage.setItem("myProjects", JSON.stringify(updatedProjects));

        setProjects((prev) => [
          ...prev,
          {
            ...duplicatedFirebaseProject,
            createdAt: new Date(duplicatedFirebaseProject.createdAt),
          },
        ]);

        toast.success("Project duplicated from Firebase");
      }

      setIsDuplicateDialogOpen(false);
    } catch (error) {
      console.error("Error duplicating project:", error);
      toast.error("Failed to duplicate project");
    } finally {
      setIsDuplicating(false);
    }
  };

  return (
    <>
      <div className="mb-4">
        <h1 className="text-xl font-bold tracking-tight">My Projects</h1>
        <p className="text-sm text-muted-foreground">
          {isDesigner
            ? "Manage your surveys and data collection projects"
            : "Access your data collection projects"}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <p>Loading projects...</p>
        </div>
      ) : projects.length > 0 ? (
        <div className="space-y-3" key={projects.length}>
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id || ""}
              name={project.name}
              category={project.category}
              createdAt={new Date(project.createdAt)}
              recordCount={project.recordCount || 0}
              projectPin={project.projectPin}
              status={project.status || "active"}
              onDelete={isDesigner ? handleDeleteProject : undefined}
              onDuplicate={isDesigner ? handleDuplicateClick : undefined}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No projects yet"
          description={
            isDesigner
              ? "Create your first project to start collecting data"
              : "Join a project to start collecting data"
          }
          buttonText={isDesigner ? "Create project" : "Join a project"}
          buttonLink={
            isDesigner ? "/dashboard/new-project" : "/dashboard/join-project"
          }
          icon={<FolderOpen size={48} />}
        />
      )}

      <Dialog
        open={isDuplicateDialogOpen}
        onOpenChange={setIsDuplicateDialogOpen}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Duplicate Project</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">
                Category
              </Label>
              <Select
                value={newProjectCategory}
                onValueChange={(value) => setNewProjectCategory(value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="land">Land</SelectItem>
                  <SelectItem value="buildings">Buildings</SelectItem>
                  <SelectItem value="biological">Biological Assets</SelectItem>
                  <SelectItem value="machinery">Machinery</SelectItem>
                  <SelectItem value="furniture">Furniture & Fixtures</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="vehicles">Motor Vehicles</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDuplicateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleDuplicateProject} disabled={isDuplicating}>
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MyProjectsPage;