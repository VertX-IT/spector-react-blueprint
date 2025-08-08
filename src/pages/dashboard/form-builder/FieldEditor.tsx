import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { dataTypes, barcodeTypes, getDataTypeName } from "./form-builder-utils";
import { FieldTemplate } from "./types";

interface FieldEditorProps {
  sections: any[];
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
}

const FieldEditor: React.FC<FieldEditorProps> = ({
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
}) => {
  // Handle options for definedList and multipleChoice
  const handleOptionsChange = (value: string) => {
    setOptionsInput(value);
    const options = value.split(",").map(opt => opt.trim()).filter(opt => opt);
    setNewField({ ...newField, options });

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
    <div className={`space-y-3 mb-5 ${isMobile ? "max-h-[60vh] overflow-y-auto pb-2" : ""}`}>
      {sections[activeSection]?.fields.map((field: FieldTemplate, i: number) => (
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
                    disabled={activeSection === 0 && i < 3}
                  >
                    {field.required ? "Make Optional" : "Make Required"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditField(i)}
                    className="flex-1 text-xs h-8"
                    disabled={activeSection === 0 && i < 3}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveField(i)}
                    className="flex-1 text-xs h-8 text-red-500"
                    disabled={activeSection === 0 && i < 3}
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
                    disabled={activeSection === 0 && i < 3}
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
                    disabled={activeSection === 0 && i < 3}
                    title="Edit field"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveField(i)}
                    className="h-8 w-8 text-red-500"
                    disabled={activeSection === 0 && i < 3}
                    title={
                      activeSection === 0 && i < 3
                        ? "Cannot remove system field"
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
      <div className={`border rounded-md p-3 mb-5 ${isMobile ? "space-y-3" : ""}`}>
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
    </div>
  );
};

export default FieldEditor;
