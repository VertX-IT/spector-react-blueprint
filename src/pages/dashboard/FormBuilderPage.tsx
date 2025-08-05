import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import FormBuilderHeader from "./form-builder/FormBuilderHeader";
import SectionNav from "./form-builder/SectionNav";
import SectionEditor from "./form-builder/SectionEditor";
import AdditionalConfig from "./form-builder/AdditionalConfig";
import { templatesByCategory, systemFields } from "./form-builder/form-builder-utils";
import { FormSection, FieldTemplate, ProjectData } from "./form-builder/types";

const FormBuilderPage: React.FC = () => {
  const location = useLocation();
  const [currentStep] = useState(2);

  // Sectioned state
  const [sections, setSections] = useState<FormSection[]>([]);

  // Index of the section being edited
  const [activeSection, setActiveSection] = useState<number>(0);

  // Project data for summary
  const [projectData, setProjectData] = useState<ProjectData>({
    category: "",
    name: "",
    assetName: "",
    description: "",
  });

  const isMobile = useIsMobile();

  // Field being added/edited in the current section only
  const [newField, setNewField] = useState<FieldTemplate>({
    name: "",
    type: "text",
    required: false,
  });

  // State for managing options for definedList and multipleChoice
  const [optionsInput, setOptionsInput] = useState<string>("");

  // Edit mode for fields in the current section
  const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Section name editing
  const [editingSectionName, setEditingSectionName] = useState<string>("");

  // Load (and migrate) from params for the selected asset category,
  // and always start with a single default section.
  useEffect(() => {
    const category =
      new URLSearchParams(location.search).get("category") || "land";
    const urlParams = new URLSearchParams(location.search);

    setProjectData({
      category,
      name: urlParams.get("name") || "Sample Project",
      assetName: urlParams.get("assetName") || "Sample Asset",
      description: urlParams.get("description") || "This is a sample project",
    });

    // All default fields into section 1.
    const sectionFields = [
      ...systemFields,
      ...(templatesByCategory[category] || []),
    ];

    setSections([
      {
        id: crypto.randomUUID?.() ?? `${Date.now()}-default`,
        name: "Section 1",
        fields: sectionFields,
      },
    ]);
    setActiveSection(0);
    setNewField({ name: "", type: "text", required: false });
    setOptionsInput("");
    setEditingFieldIndex(null);
    setIsSheetOpen(false);
  }, [location.search]);

  // SECTION CRUD

  // Add a new empty section at end, and activate it
  const handleAddSection = () => {
    setSections((prev) => {
      const nextNum = prev.length + 1;
      return [
        ...prev,
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}-sec${nextNum}`,
          name: `Section ${nextNum}`,
          fields: [],
        },
      ];
    });
    setActiveSection(sections.length);
    setNewField({ name: "", type: "text", required: false });
    setOptionsInput("");
    toast.success("Section added. Switch to the new section to add fields!");
  };

  // Rename an existing section
  const handleRenameSection = (idx: number, newName: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, name: newName.trim() || s.name } : s))
    );
    toast.success("Section renamed!");
  };

  // Remove a section
  const handleRemoveSection = (idx: number) => {
    setSections((prev) => {
      const newSections = prev.slice();
      newSections.splice(idx, 1);
      setActiveSection(Math.max(0, activeSection - 1));
      return newSections;
    });
    toast.success("Section removed.");
  };

  // FIELD CRUD

  const handleAddField = () => {
    if (!newField.name.trim()) {
      toast.error("Please enter a field name");
      return;
    }
    if ((newField.type === "definedList" || newField.type === "multipleChoice") && (!newField.options || newField.options.length === 0)) {
      toast.error("Please provide at least one option for this field");
      return;
    }
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === activeSection
          ? { ...section, fields: [...section.fields, { ...newField }] }
          : section
      )
    );
    setNewField({ name: "", type: "text", required: false });
    setOptionsInput("");
    toast.success("Custom field added");
  };

  const handleEditField = (fieldIdx: number) => {
    const field = sections[activeSection].fields[fieldIdx];
    setEditingFieldIndex(fieldIdx);
    setNewField({ ...field });
    setOptionsInput(field.options?.join(", ") || "");
    if (isMobile) setIsSheetOpen(true);
  };

  const handleSaveEdit = () => {
    if (!newField.name.trim()) {
      toast.error("Field name cannot be empty");
      return;
    }
    if ((newField.type === "definedList" || newField.type === "multipleChoice") && (!newField.options || newField.options.length === 0)) {
      toast.error("Please provide at least one option for this field");
      return;
    }
    if (editingFieldIndex !== null) {
      setSections(prev =>
        prev.map((section, idx) =>
          idx === activeSection
            ? {
              ...section,
              fields: section.fields.map((f, i) =>
                i === editingFieldIndex ? { ...newField } : f
              ),
            }
            : section
        )
      );
      setEditingFieldIndex(null);
      setNewField({ name: "", type: "text", required: false });
      setOptionsInput("");
      setIsSheetOpen(false);
      toast.success("Field updated");
    }
  };

  const handleCancelEdit = () => {
    setEditingFieldIndex(null);
    setNewField({ name: "", type: "text", required: false });
    setOptionsInput("");
    setIsSheetOpen(false);
  };

  const handleRemoveField = (fieldIdx: number) => {
    if (activeSection === 0 && fieldIdx < 3) {
      toast.error("Cannot remove mandatory system fields");
      return;
    }
    setSections((prev) =>
      prev.map((section, idx) =>
        idx === activeSection
          ? {
            ...section,
            fields: section.fields.filter((_, i) => i !== fieldIdx),
          }
          : section
      )
    );
    toast.success("Field removed");
  };

  const handleToggleRequired = (fieldIdx: number) => {
    setSections(prev =>
      prev.map((section, idx) =>
        idx === activeSection
          ? {
            ...section,
            fields: section.fields.map((field, i) =>
              i === fieldIdx
                ? { ...field, required: !field.required }
                : field
            ),
          }
          : section
      )
    );
  };

  return (
    <>
      <FormBuilderHeader
        currentStep={currentStep}
        projectData={projectData}
        isMobile={isMobile}
      />

      <SectionNav
        sections={sections}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        handleAddSection={handleAddSection}
        handleRenameSection={handleRenameSection}
        handleRemoveSection={handleRemoveSection}
        editingSectionName={editingSectionName}
        setEditingSectionName={setEditingSectionName}
        isMobile={isMobile}
      />

      <SectionEditor
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

      {isMobile && (
        <AdditionalConfig
          isSheetOpen={isSheetOpen}
          setIsSheetOpen={setIsSheetOpen}
          newField={newField}
          setNewField={setNewField}
          optionsInput={optionsInput}
          setOptionsInput={setOptionsInput}
          handleSaveEdit={handleSaveEdit}
          handleCancelEdit={handleCancelEdit}
        />
      )}
    </>
  );
};

export default FormBuilderPage;