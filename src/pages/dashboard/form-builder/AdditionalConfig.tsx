import React from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { dataTypes, barcodeTypes } from "./form-builder-utils";
import { FieldTemplate } from "./types";

interface AdditionalConfigProps {
  isSheetOpen: boolean;
  setIsSheetOpen: (open: boolean) => void;
  newField: FieldTemplate;
  setNewField: (field: FieldTemplate) => void;
  optionsInput: string;
  setOptionsInput: (value: string) => void;
  handleSaveEdit: () => void;
  handleCancelEdit: () => void;
}

const AdditionalConfig: React.FC<AdditionalConfigProps> = ({
  isSheetOpen,
  setIsSheetOpen,
  newField,
  setNewField,
  optionsInput,
  setOptionsInput,
  handleSaveEdit,
  handleCancelEdit,
}) => {
  // Handle options for definedList and multipleChoice
  const handleOptionsChange = (value: string) => {
    setOptionsInput(value);
    const options = value.split(",").map(opt => opt.trim()).filter(opt => opt);
    setNewField({ ...newField, options });
  };

  const isIdentityField = (name: string) => name === "Record No." || name === "User ID";
  const isProtectedField = (name: string) => name === "Record No." || name === "User ID" || name === "Date and Time";

  // Render additional configuration fields based on field type
  const renderAdditionalConfig = (isEditing: boolean) => {
    const field = isEditing ? newField : newField;
    return (
      <>
        {(field.type === "text" || field.type === "numbers" || field.type === "textAndNumbers") && !isIdentityField(field.name) && (
          <div className="w-full">
            <label className="text-sm mb-1 block">Placeholder</label>
            <Input
              value={field.placeholder || ""}
              onChange={(e) =>
                setNewField({ ...field, placeholder: e.target.value })
              }
              placeholder="Enter placeholder text"
              className="h-10 text-base"
            />
          </div>
        )}
        {(field.type === "definedList" || field.type === "multipleChoice") && (
          <div className="w-full">
            <label className="text-sm mb-1 block">Options (comma-separated)</label>
            <Input
              value={optionsInput}
              onChange={(e) => handleOptionsChange(e.target.value)}
              placeholder="Option1, Option2, Option3"
              className="h-10 text-base"
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
          <div className="w-full">
            <label className="text-sm mb-1 block">Barcode Type</label>
            <Select
              value={field.barcodeType || "qr"}
              onValueChange={(value) =>
                setNewField({ ...field, barcodeType: value as "qr" | "barcode" })
              }
            >
              <SelectTrigger className="h-10 text-base">
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
          {!isProtectedField(newField.name) && (
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
          )}
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
  );
};

export default AdditionalConfig;
