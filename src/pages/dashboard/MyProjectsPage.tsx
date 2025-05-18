import React, { useState, useEffect } from "react";
import { ProjectCard } from "@/components/dashboard/ProjectCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
  getUserProjects,
  deleteProject,
  Project,
  duplicateProject,
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

const MyProjectsPage: React.FC = () => {
  const { userData, currentUser } = useAuth(); // ✅ Added currentUser
  const navigate = useNavigate();
  const isDesigner = userData?.role === "designer";

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [projectToDuplicate, setProjectToDuplicate] = useState<string | null>(
    null
  );
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectCategory, setNewProjectCategory] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const storedProjects = localStorage.getItem("myProjects");
        if (storedProjects) {
          const parsedProjects: Project[] = JSON.parse(storedProjects);
          const projectsWithDates = parsedProjects.map((project) => ({
            ...project,
            createdAt: new Date(project.createdAt),
          }));
          setProjects(projectsWithDates);
        } else {
          localStorage.setItem("myProjects", JSON.stringify([]));
        }
      } catch (error) {
        console.error("Error loading projects:", error);
        toast.error("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };

    loadProjects();
  }, [userData]);

  const handleDeleteProject = async (id: string) => {
    try {
      const storedProjects = localStorage.getItem("myProjects");
      if (storedProjects) {
        const parsedProjects = JSON.parse(storedProjects);
        const updatedProjects = parsedProjects.filter((p: any) => p.id !== id);
        localStorage.setItem("myProjects", JSON.stringify(updatedProjects));
      }

      const updatedProjects = projects.filter((project) => project.id !== id);
      setProjects(updatedProjects);
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
        <div className="space-y-3">
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
                  <SelectItem value="furniture">
                    Furniture & Fixtures
                  </SelectItem>
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
