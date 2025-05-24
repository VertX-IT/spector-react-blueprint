
import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Only basic field editing is supported; you can extend for more capabilities!
const CATEGORIES = [
  { value: "land", label: "Land" },
  { value: "buildings", label: "Buildings" },
  { value: "biological", label: "Biological Assets" },
  { value: "machinery", label: "Machinery" },
  { value: "furniture", label: "Furniture & Fixtures" },
  { value: "equipment", label: "Equipment" },
  { value: "vehicles", label: "Motor Vehicles" },
  { value: "other", label: "Other" },
];

export interface ProjectEditFormProps {
  project: any;
  onCancel: () => void;
  onSave: (project: any) => Promise<void>;
}

const fieldTypes = [
  "text",
  "textarea",
  "definedList",
  "location"
];

export const ProjectEditForm: React.FC<ProjectEditFormProps> = ({
  project,
  onCancel,
  onSave,
}) => {
  const [name, setName] = useState(project.name || "");
  const [category, setCategory] = useState(project.category || "");
  const [description, setDescription] = useState(project.description || "");
  const [sections, setSections] = useState(project.formSections || []);
  const [fields, setFields] = useState(project.formFields || []);
  const [saving, setSaving] = useState(false);

  // Handler to add/edit/remove sections/fields can be extended as needed
  const handleFieldChange = (fieldId: string, key: string, value: any) => {
    setFields(fields =>
      fields.map(f => f.id === fieldId ? { ...f, [key]: value } : f)
    );
  };

  async function handleSave() {
    setSaving(true);
    const updated = {
      ...project,
      name,
      category,
      description,
      formSections: sections,
      formFields: fields,
      updatedAt: new Date().toISOString(),
    };
    await onSave(updated);
    setSaving(false);
  }

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div>
          <label className="font-medium block mb-1">Project Name</label>
          <Input value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div>
          <label className="font-medium block mb-1">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat =>
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="font-medium block mb-1">Description</label>
          <Textarea value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        {sections.length > 0 && (
          <div>
            <label className="font-bold block mb-2">Form Sections & Fields</label>
            <div className="space-y-6">
              {sections.map(sec =>
                <div key={sec.id} className="mb-4 border p-2 rounded-lg">
                  <div className="mb-2 font-medium">{sec.name}</div>
                  <div className="space-y-3">
                    {fields.filter(f => f.sectionId === sec.id).map(field => (
                      <div key={field.id} className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                        <Input
                          value={field.label}
                          onChange={e => handleFieldChange(field.id, "label", e.target.value)}
                          placeholder="Field Label"
                          className="col-span-2"
                        />
                        <Select
                          value={field.type}
                          onValueChange={val => handleFieldChange(field.id, "type", val)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type"/>
                          </SelectTrigger>
                          <SelectContent>
                            {fieldTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={e => handleFieldChange(field.id, "required", e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-xs">Required</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      </CardFooter>
    </Card>
  );
};
