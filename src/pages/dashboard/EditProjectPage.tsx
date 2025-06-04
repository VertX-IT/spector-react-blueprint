/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectEditForm } from "@/components/dashboard/ProjectEditForm";
import { getUserProjects, getProjectById, saveProject as saveProjectToFirebase, Project as ProjectType } from "@/lib/projectOperations";
import { useAuth } from "@/contexts/AuthContext";
import { useNetwork } from "@/contexts/NetworkContext";
import { toast } from "sonner";
import InlineBackButton from "@/components/ui/CustomButton";

const EditProjectPage: React.FC = () => {
  const { projectId } = useParams();
  const { userData, currentUser } = useAuth();
  const { isOnline } = useNetwork();
  const navigate = useNavigate();

  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      setLoading(true);
      let loaded: ProjectType | null = null;
      // Try to get from Firebase first when online
      if (isOnline && currentUser?.uid) {
        try {
          const remote = await getProjectById(projectId!);
          if (remote) {
            loaded = remote;
          }
        } catch (e) {
          // Fail quietly and fallback to localStorage
        }
      }
      // Try localStorage
      if (!loaded) {
        const stored = localStorage.getItem("myProjects");
        if (stored) {
          const arr = JSON.parse(stored);
          const local = arr.find((p: any) => p.id === projectId);
          if (local) {
            loaded = {
              ...local,
              createdAt: new Date(local.createdAt),
              // Ensure formFields and formSections exist and are arrays
              formFields: Array.isArray(local.formFields) ? local.formFields : [],
              formSections: Array.isArray(local.formSections) ? local.formSections : [],
            };
          }
        }
      }
      setProject(loaded);
      setLoading(false);
    }
    loadProject();
  }, [projectId, isOnline, currentUser]);

  async function handleSave(updated: any) {
    if (!updated?.id) return;
    if (isOnline && currentUser?.uid) {
      try {
        await saveProjectToFirebase(updated);
        toast.success("Project updated in the cloud!");
      } catch (e: any) {
        toast.error("Error updating cloud: " + (e.message || "Unknown error"));
        return;
      }
    } else {
      // Save to local storage
      const stored = localStorage.getItem("myProjects");
      let arr = [];
      if (stored) arr = JSON.parse(stored);
      const idx = arr.findIndex((p: any) => p.id === updated.id);
      if (idx !== -1) {
        arr[idx] = { ...arr[idx], ...updated };
        localStorage.setItem("myProjects", JSON.stringify(arr));
        toast.success("Project updated locally!");
      }
    }
    navigate("/dashboard/my-projects");
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (!project) {
    return <div className="p-8 text-center text-destructive">Project not found.</div>;
  }

  return (
    <div>
      <InlineBackButton path="/dashboard/my-projects" />
      <h1 className="text-2xl font-bold mb-4 mt-2">Edit Project</h1>
      <ProjectEditForm
        project={project}
        onCancel={() => navigate("/dashboard/my-projects")}
        onSave={handleSave}
      />
    </div>
  );
};

export default EditProjectPage;
