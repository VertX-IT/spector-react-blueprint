import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import FieldEditor from "./FieldEditor";
import { FormSection, FieldTemplate } from "./types";

interface SectionEditorProps {
  sections: FormSection[];
  activeSection: number;
  newField: FieldTemplate;
  setNewField: (field: FieldTemplate) => void;
  optionsInput: string;
  setOptionsInput: (value: string) => void;
  editingFieldIndex: number | null;
  setEditingFieldIndex: (index: number | null) => void;
  handleAddField: () => void;
  handleEditField: (fieldIdx: number) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
  handleRemoveField: (fieldIdx: number) => void;
  handleToggleRequired: (fieldIdx: number) => void;
  isMobile: boolean;
  isEditMode?: boolean; // New prop to control edit vs creation mode
}

const SectionEditor: React.FC<SectionEditorProps> = ({
  sections,
  activeSection,
  newField,
  setNewField,
  optionsInput,
  setOptionsInput,
  editingFieldIndex,
  setEditingFieldIndex,
  handleAddField,
  handleEditField,
  handleSaveEdit,
  handleCancelEdit,
  handleRemoveField,
  handleToggleRequired,
  isMobile,
  isEditMode = false, // Default to creation mode
}) => {
  const navigate = useNavigate();

  // Persist sections and projectData to localStorage
  const handleNext = () => {
    localStorage.setItem("formSections", JSON.stringify(sections));
    toast.success("Form template (with sections) saved! Ready for review.");
    navigate("/dashboard/review-form");
  };

  return (
    <Card className={isMobile ? "mx-1 shadow-sm" : ""}>
      <CardContent className={isMobile ? "p-3" : "pt-4"}>
        <h2 className="text-lg font-medium mb-3">
          {sections[activeSection]?.name ? `${sections[activeSection].name} Fields` : "Section Fields"}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          <span>
            {activeSection === 0
              ? "This is the first section (includes system fields)."
              : "Custom section—add your specific fields here."}
          </span>
        </p>
        
        <FieldEditor
          sections={sections}
          activeSection={activeSection}
          newField={newField}
          setNewField={setNewField}
          optionsInput={optionsInput}
          setOptionsInput={setOptionsInput}
          editingFieldIndex={editingFieldIndex}
          setEditingFieldIndex={setEditingFieldIndex}
          handleAddField={handleAddField}
          handleEditField={handleEditField}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
          handleRemoveField={handleRemoveField}
          handleToggleRequired={handleToggleRequired}
          isMobile={isMobile}
        />
        
        {/* Only show navigation buttons in creation mode, not edit mode */}
        {!isEditMode && (
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/new-project")}
              className={isMobile ? "h-12 text-base w-full" : ""}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              className={isMobile ? "h-12 text-base w-full" : ""}
            >
              Continue to Review
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SectionEditor;
