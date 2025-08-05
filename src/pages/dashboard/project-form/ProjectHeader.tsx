import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import InlineBackButton from "@/components/ui/CustomButton";
import { Project } from "./types";

interface ProjectHeaderProps {
  project: Project;
  isDesigner: boolean;
  isEditMode: boolean;
  setIsEditMode: (editMode: boolean) => void;
  setIsEndSurveyDialogOpen: (open: boolean) => void;
  setIsDeleteDialogOpen: (open: boolean) => void;
}

const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  isDesigner,
  isEditMode,
  setIsEditMode,
  setIsEndSurveyDialogOpen,
  setIsDeleteDialogOpen,
}) => {
  const isProjectInactive = project.status === "inactive";

  return (
    <div className="mb-4 space-y-3">
      <InlineBackButton path="/dashboard/my-projects" />
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
  );
};

export default ProjectHeader;
