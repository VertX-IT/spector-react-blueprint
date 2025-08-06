import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { categories, steps } from "./form-builder-utils";
import { ProjectData } from "./types";

interface FormBuilderHeaderProps {
  currentStep: number;
  projectData: ProjectData;
  isMobile: boolean;
}

const FormBuilderHeader: React.FC<FormBuilderHeaderProps> = ({
  currentStep,
  projectData,
  isMobile,
}) => {
  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Create Form Sections & Fields</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Define your form by sections (e.g., Personal Info, Equipment Details).
        </p>
        <ProgressSteps currentStep={currentStep} totalSteps={steps.length} labels={steps} />
      </div>

      <Card className={`mb-4 ${isMobile ? "mx-1 shadow-sm" : ""}`}>
        <CardContent className={`${isMobile ? "p-3" : "pt-4"}`}>
          <div className="space-y-3">
            <h2 className="text-lg font-medium">Project Information</h2>
            <div className="grid grid-cols-1 gap-2">
              <div>
                <p className="text-sm font-semibold">Project Name</p>
                <p className="text-sm text-muted-foreground">
                  {projectData.name}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Type</p>
                <p className="text-sm text-muted-foreground">
                  {categories.find((c) => c.id === projectData.category)?.name || projectData.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">{projectData.assetName}</p>
              </div>
              {projectData.description && (
                <div>
                  <p className="text-sm font-semibold">Description</p>
                  <p className="text-sm text-muted-foreground">
                    {projectData.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FormBuilderHeader;
