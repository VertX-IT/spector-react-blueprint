import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { LocationSelector } from "@/components/survey/LocationSelector";
import { Section, FieldTemplate, FormData } from "./types";
import { getFieldsBySection } from "./project-form-utils";
import { handleScanQRBarcode } from "./project-form-utils";
import { Camera, Upload, ScanLine } from "lucide-react";

interface SectionFormProps {
  section: Section;
  sections: Section[];
  formData: FormData;
  handleInputChange: (fieldId: string, value: string | File | boolean | string[] | null) => void;
  handleSectionSubmit: (sectionId: string, sectionFields: FieldTemplate[]) => void;
  isProjectInactive: boolean;
  completedSections: string[];
  activeSectionIndex: number;
  isCollector: boolean;
  isDesigner: boolean;
  clearStorage: () => void;
}

const SectionForm: React.FC<SectionFormProps> = ({
  section,
  sections,
  formData,
  handleInputChange,
  handleSectionSubmit,
  isProjectInactive,
  completedSections,
  activeSectionIndex,
  isCollector,
  isDesigner,
  clearStorage,
}) => {
  const sectionFields = getFieldsBySection(sections, section.id);

  const renderField = (field: FieldTemplate) => {
    const isSystem = field.name === "User ID" || field.name === "Record No.";
    const isReadOnly = isSystem || isProjectInactive;

    return (
      <div key={field.id} className="space-y-2">
        <label
          htmlFor={field.id}
          className="text-sm font-medium flex items-center"
        >
          {field.label || field.name}
          {field.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
          {isSystem && (
            <span className="text-xs text-muted-foreground ml-2">(Auto-filled)</span>
          )}
        </label>

        {field.type === "text" && (
          <Input
            id={field.id}
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            required={field.required}
            disabled={isReadOnly}
            readOnly={isSystem}
            className={`${isReadOnly ? "bg-gray-100" : ""}`}
          />
        )}

        {field.type === "number" && (
          <Input
            id={field.id}
            type="number"
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || "Enter a number"}
            required={field.required}
            disabled={isReadOnly}
            readOnly={isSystem}
            className={`${isReadOnly ? "bg-gray-100" : ""}`}
          />
        )}

        {field.type === "textarea" && (
          <Textarea
            id={field.id}
            value={formData[field.id] as string || ""}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            placeholder={field.placeholder || ""}
            required={field.required}
            disabled={isReadOnly}
            readOnly={isSystem}
            className={`${isReadOnly ? "bg-gray-100" : ""}`}
          />
        )}

        {field.type === "definedList" && (
          <Select
            value={formData[field.id] as string || ""}
            onValueChange={(value) => handleInputChange(field.id, value)}
            disabled={isReadOnly}
          >
            <SelectTrigger className={`${isReadOnly ? "bg-gray-100" : ""}`}>
              <SelectValue placeholder={field.placeholder || "Select an option"} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              )) || null}
            </SelectContent>
          </Select>
        )}

        {field.type === "location" && (
          <LocationSelector
            value={formData[field.id] as string || ""}
            onChange={(value) => handleInputChange(field.id, value)}
            placeholder={field.placeholder || "Enter location"}
            disabled={isReadOnly}
          />
        )}

        {field.type === "image" && (
          <div className="flex items-center space-x-2">
            <Input
              id={field.id}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) =>
                handleInputChange(field.id, e.target.files?.[0] || null)
              }
              required={field.required}
              disabled={isReadOnly}
              className={`${isReadOnly ? "bg-gray-100" : ""} hidden`}
            />
            <Button
              type="button"
              onClick={() => document.getElementById(field.id)?.click()}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={isReadOnly}
            >
              <Camera className="h-4 w-4" />
              <span>Capture</span>
            </Button>
            <Button
              type="button"
              onClick={() => document.getElementById(field.id)?.click()}
              variant="outline"
              size="sm"
              className="flex items-center space-x-2"
              disabled={isReadOnly}
            >
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </Button>
          </div>
        )}

        {field.type === "checkbox" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={formData[field.id] as boolean || false}
              onCheckedChange={(checked) =>
                handleInputChange(field.id, checked)
              }
              disabled={isReadOnly}
            />
            <label
              htmlFor={field.id}
              className="text-sm text-muted-foreground"
            >
              {field.label || field.name}
            </label>
          </div>
        )}

        {field.type === "multipleChoice" && (
          <div className="space-y-2">
            {field.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.id}-${option}`}
                  checked={(formData[field.id] as string[] || []).includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = formData[field.id] as string[] || [];
                    const newValues = checked
                      ? [...currentValues, option]
                      : currentValues.filter((val) => val !== option);
                    handleInputChange(field.id, newValues);
                  }}
                  disabled={isReadOnly}
                />
                <label
                  htmlFor={`${field.id}-${option}`}
                  className="text-sm text-muted-foreground"
                >
                  {option}
                </label>
              </div>
            ))}
          </div>
        )}

        {field.type === "qrBarcode" && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Input
                id={field.id}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) =>
                  handleInputChange(field.id, e.target.files?.[0] || null)
                }
                required={field.required}
                disabled={isReadOnly}
                className={`${isReadOnly ? "bg-gray-100" : ""} hidden`}
              />
              <Button
                type="button"
                onClick={() => document.getElementById(field.id)?.click()}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                disabled={isReadOnly}
              >
                <Camera className="h-4 w-4" />
                <span>Capture</span>
              </Button>
              <Button
                type="button"
                onClick={() => document.getElementById(field.id)?.click()}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                disabled={isReadOnly}
              >
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleScanQRBarcode(field.id, handleInputChange)}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
                disabled={isReadOnly}
              >
                <ScanLine className="h-4 w-4" />
                <span>Scan</span>
              </Button>
            </div>
            <Input
              placeholder="Or enter QR/Barcode manually"
              value={formData[field.id] as string || ""}
              onChange={(e) => handleInputChange(field.id, e.target.value)}
              disabled={isReadOnly}
              className={`${isReadOnly ? "bg-gray-100" : ""}`}
            />
          </div>
        )}
      </div>
    );
  };

  if (!isCollector && !isDesigner) {
    return (
      <div className="text-center text-muted-foreground">
        You do not have permission to view or edit this form.
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSectionSubmit(section.id, sectionFields);
      }}
      className="space-y-4 mt-4"
    >
      <Button
        variant="outline"
        onClick={clearStorage}
        className="mt-2"
      >
        Clear Storage
      </Button>

      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium">{section.name}</h3>
          <Separator className="mt-2" />
        </div>
        <div className="space-y-4 pl-0 sm:pl-2">
          {sectionFields.length > 0 ? (
            sectionFields.map(renderField)
          ) : (
            <p className="text-center text-muted-foreground">
              No fields in this section.
            </p>
          )}
        </div>
      </div>

      {!completedSections.includes(section.id) && (
        <div className="flex justify-end">
          <Button type="submit" className="w-full sm:w-auto" disabled={isProjectInactive}>
            Submit Section
          </Button>
        </div>
      )}
    </form>
  );
};

export default SectionForm;
