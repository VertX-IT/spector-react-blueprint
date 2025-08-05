import React from "react";

interface ProjectHeaderProps {
  project: any;
  isDesigner: boolean;
  isEditMode: boolean;
  setIsEditMode: (v: boolean) => void;
  setIsEndSurveyDialogOpen: (v: boolean) => void;
  setIsDeleteDialogOpen: (v: boolean) => void;
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
    <div className="mb-4 px-1">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            {project.category} • {project.recordCount} records
          </p>
        </div>
        {/* Project Actions for designer */}
        {isDesigner && (
          <div className="flex gap-2">
            {/* These should be Button components in the parent */}
            <button onClick={() => setIsEditMode(!isEditMode)}>{isEditMode ? "Done" : "Edit"}</button>
            <button onClick={() => setIsEndSurveyDialogOpen(true)} disabled={isProjectInactive}>End Survey</button>
            <button onClick={() => setIsDeleteDialogOpen(true)}>Delete</button>
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-1">
        <span className="border px-2 py-1 rounded text-xs">PIN: {project.projectPin}</span>
        {isProjectInactive && (
          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Survey Ended</span>
        )}
      </div>
    </div>
  );
};

export default ProjectHeader;
