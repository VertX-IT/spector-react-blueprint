import React from "react";

interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultChecked?: boolean;
  barcodeType?: "qr" | "barcode";
}

interface SectionFormProps {
  section: { id: string; name: string; fields: FieldTemplate[] };
  formData: Record<string, any>;
  handleInputChange: (fieldId: string, value: any) => void;
  handleSectionSubmit: (sectionId: string, sectionFields: FieldTemplate[]) => void;
  isProjectInactive: boolean;
  completedSections: string[];
  submitButtonLabel?: string;
}

const SectionForm: React.FC<SectionFormProps> = ({
  section,
  formData,
  handleInputChange,
  handleSectionSubmit,
  isProjectInactive,
  completedSections,
  submitButtonLabel = "Submit Section",
}) => {
  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSectionSubmit(section.id, section.fields);
      }}
      className="space-y-4 mt-4"
    >
      <h3 className="text-lg font-medium mb-2">{section.name}</h3>
      {section.fields.length > 0 ? (
        section.fields.map(field => (
          <div key={field.id} className="space-y-2">
            <label htmlFor={field.id} className="text-sm font-medium flex items-center">
              {field.label || field.name}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {/* Placeholder: use real UI components in full refactor */}
            {field.type === "text" && (
              <input
                id={field.id}
                value={formData[field.id] || ""}
                onChange={e => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder || ""}
                disabled={isProjectInactive}
              />
            )}
            {field.type === "textarea" && (
              <textarea
                id={field.id}
                value={formData[field.id] || ""}
                onChange={e => handleInputChange(field.id, e.target.value)}
                placeholder={field.placeholder || ""}
                disabled={isProjectInactive}
              />
            )}
            {/* Add more field types as needed */}
          </div>
        ))
      ) : (
        <p className="text-center text-muted-foreground">No fields in this section.</p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={isProjectInactive} className="px-4 py-2 bg-blue-500 text-white rounded">
          {submitButtonLabel}
        </button>
      </div>
    </form>
  );
};

export default SectionForm;
