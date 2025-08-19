import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Settings, Save } from "lucide-react";
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

export const ProjectEditForm: React.FC<ProjectEditFormProps> = ({
  project,
  onCancel,
  onSave,
}) => {
  const navigate = useNavigate();
  const [name, setName] = useState(project.name || "");
  const [category, setCategory] = useState(project.category || "");
  const [description, setDescription] = useState(project.description || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const updated = {
      ...project,
      name,
      category,
      description,
      updatedAt: new Date().toISOString(),
    };
    await onSave(updated);
    setSaving(false);
  }

  const handleGoToFormBuilder = () => {
    // Navigate to the form builder page for this specific project
    navigate(`/dashboard/projects/${project.id}/form-builder`);
  };

  return (
    <Card>
      <CardContent className="space-y-4 py-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Basic Project Details</h3>
          <p className="text-sm text-gray-600">Edit the basic information for your project. Use the "Edit Full Form" button below to modify sections and form fields.</p>
        </div>
        
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
        
        <div className="pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleGoToFormBuilder}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Full Form (Sections & Fields)
          </Button>
          <p className="text-xs text-gray-500 mt-2 text-center">
            This will open the complete form builder where you can edit all sections and form fields
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Basic Details"}
        </Button>
      </CardFooter>
    </Card>
  );
};
