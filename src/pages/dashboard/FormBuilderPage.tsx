import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BackButton } from "@/components/ui/back-button";
import { loadProjectData, loadFormSections, autoSaveFormSections } from "@/lib/projectCreationState";
import { isSystemField } from "@/lib/formUtils";

// Data types available for form fields
const dataTypes = [
  { id: "text", name: "Text" },
  { id: "numbers", name: "Numbers" },
  { id: "textAndNumbers", name: "Text and Numbers" },
  { id: "coordinates", name: "Geographical Coordinates" },
  { id: "image", name: "Image (Take new, Add existing)" },
  { id: "definedList", name: "Defined List (Select One)" },
  { id: "checkbox", name: "Checkbox (Yes/No)" },
  { id: "multipleChoice", name: "Multiple Choice" },
  { id: "qrBarcode", name: "QR/Barcode Reader" },
  { id: "dateTime", name: "Date and Time" },
];

// Barcode types for qrBarcode fields
const barcodeTypes = [
  { id: "qr", name: "QR Code" },
  { id: "barcode", name: "Barcode" },
];

// Asset categories
const categories = [
  { id: "land", name: "Land" },
  { id: "buildings", name: "Buildings" },
  { id: "biological", name: "Biological Assets" },
  { id: "machinery", name: "Machinery" },
  { id: "furniture", name: "Furniture & Fixtures" },
  { id: "equipment", name: "Equipment" },
  { id: "vehicles", name: "Motor Vehicles" },
  { id: "other", name: "Other" },
];

// Template fields per category
const templatesByCategory = {
  land: [
    { name: "Land Name", type: "text", required: true, placeholder: "Enter land name" },
    { name: "Address", type: "textAndNumbers", required: true, placeholder: "Enter address" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  buildings: [
    { name: "Building Name", type: "text", required: true, placeholder: "Enter building name" },
    { name: "Address", type: "textAndNumbers", required: true, placeholder: "Enter address" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Year of Construction", type: "numbers", required: false, placeholder: "Enter year" },
    { name: "Building Area", type: "definedList", required: true, options: ["Small", "Medium", "Large"] },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Condition", type: "definedList", required: true, options: ["Good", "Fair", "Poor"] },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  biological: [
    { name: "Location", type: "text", required: true, placeholder: "Enter location" },
    { name: "Field Name", type: "text", required: true, placeholder: "Enter field name" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Species", type: "text", required: true, placeholder: "Enter species" },
    { name: "Inspection Image", type: "image", required: true },
    { name: "Diameter", type: "numbers", required: false, placeholder: "Enter diameter in cm" },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  machinery: [
    { name: "Machine Name", type: "text", required: true, placeholder: "Enter machine name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  furniture: [
    { name: "Furniture Name", type: "text", required: true, placeholder: "Enter furniture name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  equipment: [
    { name: "Equipment Name", type: "text", required: true, placeholder: "Enter equipment name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  vehicles: [
    { name: "Vehicle Name", type: "text", required: true, placeholder: "Enter vehicle name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Model", type: "text", required: true, placeholder: "Enter model" },
    { name: "YOM", type: "numbers", required: true, placeholder: "Enter year of manufacture" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  other: [
    { name: "Record No.", type: "textAndNumbers", required: true, placeholder: "Enter record number" },
    { name: "User ID", type: "textAndNumbers", required: true, placeholder: "Enter user ID" },
    { name: "Date and Time", type: "dateTime", required: true },
  ],
};

// Fields always included at top of every form section 1.
const systemFields = [
  { name: "Record No.", type: "textAndNumbers", required: true, placeholder: "Enter record number" },
  { name: "User ID", type: "textAndNumbers", required: true, placeholder: "Enter user ID" },
  { name: "Date and Time", type: "dateTime", required: true },
];

// Project creation steps
const steps = ["Basic Details", "Form Fields", "Review", "Security"];

// Section and Field types
type FieldTemplate = {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string; // For text, numbers, textAndNumbers
  options?: string[]; // For definedList, multipleChoice
  defaultChecked?: boolean; // For checkbox
  barcodeType?: "qr" | "barcode"; // For qrBarcode
};

type FormSection = {
  id: string;
  name: string;
  fields: FieldTemplate[];
};

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(2);

  // Sectioned state
  const [sections, setSections] = useState<FormSection[]>([]);

  // Index of the section being edited
  const [activeSection, setActiveSection] = useState<number>(0);

  // Project data for summary
  const [projectData, setProjectData] = useState({
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

  // Load project data and sections from localStorage
  useEffect(() => {
    // Load project data from localStorage first, fallback to URL params
    const projectDataFromStorage = loadProjectData();
    
    const category = projectDataFromStorage?.category || 
      new URLSearchParams(location.search).get("category") || "land";
    const urlParams = new URLSearchParams(location.search);

    setProjectData({
      category,
      name: projectDataFromStorage?.name || urlParams.get("name") || "Sample Project",
      assetName: projectDataFromStorage?.assetName || urlParams.get("assetName") || "Sample Asset",
      description: projectDataFromStorage?.description || urlParams.get("description") || "This is a sample project",
    });

    // Load existing sections from localStorage if available
    const storedSections = loadFormSections();
    if (storedSections && storedSections.length > 0) {
      setSections(storedSections);
      setActiveSection(0);
      return;
    }

    // If no stored sections, create default sections based on category
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

  // Auto-save sections whenever they change
  useEffect(() => {
    if (sections.length > 0) {
      autoSaveFormSections(sections);
    }
  }, [sections]);

  // Field name prettifier
  const getDataTypeName = (typeId: string) =>
    dataTypes.find((t) => t.id === typeId)?.name || typeId;

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

  // Handle options for definedList and multipleChoice
  const handleOptionsChange = (value: string) => {
    setOptionsInput(value);
    const options = value.split(",").map(opt => opt.trim()).filter(opt => opt);
    setNewField(prev => ({ ...prev, options }));
  };

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

  // Persist sections and projectData to localStorage
  const handleNext = () => {
    localStorage.setItem("formSections", JSON.stringify(sections));
    localStorage.setItem("projectData", JSON.stringify(projectData));
    toast.success("Form template (with sections) saved! Ready for review.");
    navigate("/dashboard/review-form");
  };

  // UI Components

  const renderSectionsNav = () => (
    <div
      className={
        isMobile
          ? "flex items-center gap-3 flex-nowrap mb-4 overflow-x-auto pb-1 px-1"
          : "flex gap-2 flex-wrap mb-4"
      }
      style={isMobile ? { WebkitOverflowScrolling: "touch" } : undefined}
    >
      {sections.map((section, idx) => (
        <div
          key={section.id}
          className={
            isMobile
              ? `relative flex flex-col items-center justify-center bg-white rounded-lg drop-shadow-sm border min-w-[120px] px-3 py-1 mr-2 ${activeSection === idx
                ? "border-[#8B5CF6] shadow-md"
                : "border-gray-200"
              }`
              : "relative"
          }
          style={isMobile ? { minWidth: 130, marginRight: 8 } : undefined}
        >
          <Button
            size={isMobile ? "sm" : "default"}
            variant={activeSection === idx ? "default" : "outline"}
            className={
              isMobile
                ? `w-full justify-center rounded-lg text-sm font-semibold py-2 px-3 !shadow-none transition-colors ${activeSection === idx
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white text-[#8B5CF6] border border-[#DDD6FE]"
                }`
                : `rounded-full px-4 ${activeSection === idx ? "font-bold" : ""}`
            }
            style={isMobile ? { minHeight: 44, minWidth: 110 } : undefined}
            onClick={() => setActiveSection(idx)}
          >
            <span
              className={isMobile ? "truncate max-w-[72px] block" : ""}
              title={section.name}
            >
              {section.name}
            </span>
          </Button>
          {isMobile ? (
            <div className="flex justify-center gap-2 mt-1 w-full">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Rename section"
                onClick={() => setEditingSectionName(section.name)}
              >
                <Edit className="w-4 h-4 text-[#8B5CF6]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                title="Remove section"
                onClick={() => handleRemoveSection(idx)}
              >
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          ) : (
            <>
              {activeSection === idx && (
                <button
                  title="Rename section"
                  className="absolute right-0 top-0 bg-transparent p-1"
                  onClick={() => setEditingSectionName(section.name)}
                  style={{ marginLeft: "0.2rem" }}
                >
                  <Edit className="w-4 h-4 text-[#9b87f5]" />
                </button>
              )}
              {sections.length > 1 && (
                <button
                  title="Remove section"
                  className="absolute right-0 top-7 bg-transparent text-red-500 p-1"
                  onClick={() => handleRemoveSection(idx)}
                  style={{ display: "block" }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      ))}
      <Button
        onClick={handleAddSection}
        variant="ghost"
        className={
          isMobile
            ? "rounded-lg py-2 px-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white shadow border border-[#DDD6FE]"
            : "rounded-full px-3"
        }
        title="Add section"
      >
        <Plus className="h-5 w-5 text-[#8B5CF6]" />
        <span className="sr-only">Add section</span>
      </Button>
    </div>
  );

  const renderSectionRenameEditor = () => {
    if (!editingSectionName) return null;
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/30">
        <div className="bg-white rounded-md p-6">
          <h3 className="font-bold text-lg mb-2">Edit Section Name</h3>
          <Input
            autoFocus
            value={editingSectionName}
            onChange={(e) => setEditingSectionName(e.target.value)}
            className="mb-3"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                handleRenameSection(activeSection, editingSectionName);
                setEditingSectionName("");
              }}
            >
              Save
            </Button>
            <Button variant="outline" onClick={() => setEditingSectionName("")}>
              Cancel
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Render additional configuration fields based on field type
  const renderAdditionalConfig = (isEditing: boolean) => {
    const field = isEditing ? newField : newField;
    return (
      <>
        {(field.type === "text" || field.type === "numbers" || field.type === "textAndNumbers") && (
          <div className={isMobile ? "w-full" : "flex-1 min-w-[200px]"}>
            <label className="text-sm mb-1 block">Placeholder</label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) =>
                setNewField({ ...field, placeholder: e.target.value })
              }
              placeholder="Enter placeholder text"
              className={isMobile ? "h-10 text-base" : ""}
            />
          </div>
        )}
        {(field.type === "definedList" || field.type === "multipleChoice") && (
          <div className={isMobile ? "w-full" : "flex-1 min-w-[200px]"}>
            <label className="text-sm mb-1 block">Options (comma-separated)</label>
            <Input
              value={optionsInput}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Option1, Option2, Option3"
              className={isMobile ? "h-10 text-base" : ""}
            />
          </div>
        )}
        {field.type === "checkbox" && (
          <div className="flex items-center gap-2">
            <span className="text-sm">Default Checked</span>
            <Switch
              checked={field.defaultChecked || false}
              onCheckedChange={(checked) =>
                setNewField({ ...field, defaultChecked: checked })
              }
            />
          </div>
        )}
        {field.type === "qrBarcode" && (
          <div className={isMobile ? "w-full" : "w-[180px]"}>
            <label className="text-sm mb-1 block">Barcode Type</label>
            <Select
              value={field.barcodeType || "qr"}
              onValueChange={(value) =>
                setNewField({ ...field, barcodeType: value as "qr" | "barcode" })
              }
            >
              <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                <SelectValue placeholder="Select barcode type" />
              </SelectTrigger>
              <SelectContent>
                {barcodeTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="mb-4 px-1">
        <div className="mb-3">
          <BackButton 
            to="/dashboard/new-project"
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          />
        </div>
        
        <h1 className="text-xl font-bold tracking-tight">Form Builder</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Design your data collection form
        </p>
        
        <ProgressSteps
          currentStep={currentStep}
          totalSteps={steps.length}
          labels={steps}
        />
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

      {renderSectionsNav()}
      {renderSectionRenameEditor()}

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
          <div
            className={`space-y-3 mb-5 ${isMobile ? "max-h-[60vh] overflow-y-auto pb-2" : ""
              }`}
          >
            {sections[activeSection]?.fields.map((field, i) => (
              <div
                key={i}
                className={`flex flex-col ${isMobile ? "p-2" : "p-3"} border rounded-md ${editingFieldIndex === i && !isMobile
                  ? "border-brand-green bg-gray-50"
                  : ""
                  }`}
              >
                {editingFieldIndex === i && !isMobile ? (
                  <div className="w-full space-y-3">
                    <div className="flex flex-col md:flex-row gap-3">
                      <Input
                        value={newField.name}
                        onChange={(e) =>
                          setNewField({ ...newField, name: e.target.value })
                        }
                        placeholder="Field name"
                        className="flex-1"
                      />
                      <Select
                        value={newField.type}
                        onValueChange={(value) =>
                          setNewField({ ...newField, type: value })
                        }
                      >
                        <SelectTrigger className="w-full md:w-[180px]">
                          <SelectValue placeholder="Select data type" />
                        </SelectTrigger>
                        <SelectContent>
                          {dataTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Required</span>
                        <Switch
                          checked={newField.required}
                          onCheckedChange={(checked) =>
                            setNewField({ ...newField, required: checked })
                          }
                        />
                      </div>
                    </div>
                    <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-3 items-end`}>
                      {renderAdditionalConfig(true)}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSaveEdit}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium ${isMobile ? "text-base" : ""}`}>
                          {field.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {getDataTypeName(field.type)}
                        </p>
                        {field.placeholder && (
                          <p className="text-xs text-muted-foreground">
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Options: {field.options.join(", ")}
                          </p>
                        )}
                        {field.defaultChecked !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Default Checked: {field.defaultChecked ? "Yes" : "No"}
                          </p>
                        )}
                        {field.barcodeType && (
                          <p className="text-xs text-muted-foreground">
                            Barcode Type: {barcodeTypes.find(bt => bt.id === field.barcodeType)?.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {field.required ? (
                          <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full">
                            Required
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-gray-50 text-gray-700 rounded-full">
                            Optional
                          </span>
                        )}
                      </div>
                    </div>
                    {isMobile && (
                      <div className="flex mt-2 border-t pt-2 justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleRequired(i)}
                          className="flex-1 text-xs h-8"
                          disabled={isSystemField(field.name)}
                        >
                          {field.required ? "Make Optional" : "Make Required"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditField(i)}
                          className="flex-1 text-xs h-8"
                          disabled={isSystemField(field.name)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveField(i)}
                          className="flex-1 text-xs h-8 text-red-500"
                          disabled={isSystemField(field.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    {!isMobile && (
                      <div className="flex items-center gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleRequired(i)}
                          className="h-8 w-8"
                          title={field.required ? "Make optional" : "Make required"}
                          disabled={isSystemField(field.name)}
                        >
                          {field.required ? (
                            <ToggleRight className="h-4 w-4" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditField(i)}
                          className="h-8 w-8"
                          disabled={isSystemField(field.name)}
                          title={isSystemField(field.name) ? "System field cannot be edited" : "Edit field"}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveField(i)}
                          className="h-8 w-8 text-red-500"
                          disabled={isSystemField(field.name)}
                          title={
                            isSystemField(field.name)
                              ? "System field cannot be removed"
                              : "Remove field"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <div
            className={`border rounded-md p-3 mb-5 ${isMobile ? "space-y-3" : ""}`}
          >
            <h3 className="text-md font-medium mb-3">Add Custom Field</h3>
            <div className={`flex ${isMobile ? "flex-col" : "flex-wrap"} gap-3 items-end`}>
              <div className={`${isMobile ? "w-full" : "flex-1 min-w-[200px]"}`}>
                <label className="text-sm mb-1 block">Field Name</label>
                <Input
                  value={newField.name}
                  onChange={(e) =>
                    setNewField({ ...newField, name: e.target.value })
                  }
                  placeholder="Enter field name"
                  className={isMobile ? "h-10 text-base" : ""}
                />
              </div>
              <div className={isMobile ? "w-full" : "w-[180px]"}>
                <label className="text-sm mb-1 block">Data Type</label>
                <Select
                  value={newField.type}
                  onValueChange={(value) =>
                    setNewField({ ...newField, type: value })
                  }
                >
                  <SelectTrigger className={isMobile ? "h-10 text-base" : ""}>
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Required</span>
                <Switch
                  checked={newField.required}
                  onCheckedChange={(checked) =>
                    setNewField({ ...newField, required: checked })
                  }
                />
              </div>
              {renderAdditionalConfig(false)}
              <Button
                variant="outline"
                className={`flex items-center gap-1 ${isMobile ? "w-full h-10 text-base" : ""}`}
                onClick={handleAddField}
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </div>
          </div>
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
        </CardContent>
      </Card>
      {isMobile && (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetContent className="h-[80vh] w-full">
            <SheetHeader className="pb-4">
              <SheetTitle>Edit Field</SheetTitle>
            </SheetHeader>
            <div className="space-y-5 pt-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Field Name</label>
                <Input
                  value={newField.name}
                  onChange={(e) =>
                    setNewField({ ...newField, name: e.target.value })
                  }
                  placeholder="Field name"
                  className="text-base h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Data Type</label>
                <Select
                  value={newField.type}
                  onValueChange={(value) =>
                    setNewField({ ...newField, type: value })
                  }
                >
                  <SelectTrigger className="text-base h-12">
                    <SelectValue placeholder="Select data type" />
                  </SelectTrigger>
                  <SelectContent>
                    {dataTypes.map((type) => (
                      <SelectItem
                        key={type.id}
                        value={type.id}
                        className="text-base"
                      >
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-base font-medium">Required Field</span>
                <Switch
                  checked={newField.required}
                  onCheckedChange={(checked) =>
                    setNewField({ ...newField, required: checked })
                  }
                />
              </div>
              {renderAdditionalConfig(true)}
              <div className="flex flex-col gap-3 pt-4">
                <Button onClick={handleSaveEdit} className="h-12 text-base">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-12 text-base"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default FormBuilderPage;