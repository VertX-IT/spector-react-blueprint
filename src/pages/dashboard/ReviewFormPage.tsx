import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressSteps } from "@/components/ui/progress-steps";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

// Steps for project creation
const steps = ["Basic Details", "Form Fields", "Review", "Security"];

// Data types available for form fields
const dataTypes = [
  { id: "text", name: "Text" },
  { id: "numbers", name: "Numbers" },
  { id: "textAndNumbers", name: "Text and Numbers" },
  { id: "textarea", name: "Long Text" },
  { id: "definedList", name: "Dropdown List" },
  { id: "location", name: "Location" },
  { id: "coordinates", name: "Geographical Coordinates" },
  { id: "image", name: "Image (Take new, Add existing)" },
  { id: "checkbox", name: "Checkbox (Yes/No)" },
  { id: "multipleChoice", name: "Multiple Choice" },
  { id: "qrBarcode", name: "QR/Barcode Reader" },
  { id: "dateTime", name: "Date and Time" },
];

// Section and Field types
type FieldTemplate = {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultChecked?: boolean;
  barcodeType?: "qr" | "barcode";
};

type FormSection = {
  id: string;
  name: string;
  fields: FieldTemplate[];
};

const ReviewFormPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep] = useState(3);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [projectData, setProjectData] = useState({
    category: "",
    name: "",
    assetName: "",
    description: "",
  });

  const isMobile = useIsMobile();

  useEffect(() => {
    const storedSections = localStorage.getItem("formSections");
    const storedProjectData = localStorage.getItem("projectData");
    if (storedSections) {
      setSections(JSON.parse(storedSections));
    }
    if (storedProjectData) {
      setProjectData(JSON.parse(storedProjectData));
    } else {
      const params = new URLSearchParams(location.search);
      const category = params.get("category") || "";
      const name = params.get("name") || "";
      const assetName = params.get("assetName") || "";
      const description = params.get("description") || "";

      setProjectData({
        category,
        name,
        assetName,
        description,
      });
    }
  }, [location.search]);

  const handleBack = () => {
    navigate(`/dashboard/form-builder${location.search}`);
  };

  const handleDeploy = () => {
    toast.success("Project ready for security settings!");
    navigate(`/dashboard/security-settings${location.search}`);
  };

  const getDataTypeName = (typeId: string): string => {
    return dataTypes.find((t) => t.id === typeId)?.name || typeId;
  };

  return (
    <>
      <div className="mb-4 px-1">
        <h1 className="text-xl font-bold tracking-tight">Review Form</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Review your form layout before deploying
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
            <h2 className="text-lg font-medium">Project Summary</h2>
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
                  {projectData.category}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold">Asset Name</p>
                <p className="text-sm text-muted-foreground">
                  {projectData.assetName}
                </p>
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

      <Card className={`mb-4 ${isMobile ? "mx-1 shadow-sm" : ""}`}>
        <CardContent className={`${isMobile ? "p-3" : "pt-4"}`}>
          <h2 className="text-lg font-medium mb-3">Form Preview (by Section)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is how your form will appear to users, separated by section.
          </p>
          <div
            className={`space-y-6 mb-5 ${isMobile ? "max-h-[48vh] overflow-y-auto pb-4" : ""
              }`}
          >
            {sections.map((section, secIdx) => (
              <div key={section.id} className="border rounded-lg px-4 pb-2 pt-3 bg-gray-50">
                <h3 className="text-base font-semibold mb-3 text-[#8B5CF6]">{section.name}</h3>
                {section.fields.map((field, index) => (
                  <div key={index} className="space-y-1 mb-4">
                    <label className="block text-sm font-medium">
                      {field.name}{" "}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="h-10 border rounded-md px-3 bg-muted/30 flex items-center text-sm text-muted-foreground">
                      {field.type === "text" && <span>Text input {field.placeholder && `(${field.placeholder})`}</span>}
                      {field.type === "numbers" && <span>Numeric input {field.placeholder && `(${field.placeholder})`}</span>}
                      {field.type === "textAndNumbers" && <span>Alphanumeric input {field.placeholder && `(${field.placeholder})`}</span>}
                      {field.type === "textarea" && <span>Text area input</span>}
                      {field.type === "location" && <span>Location selection</span>}
                      {field.type === "definedList" && <span>Dropdown selection {field.options && `(${field.options.join(", ")})`}</span>}
                      {field.type === "coordinates" && <span>Coordinates input</span>}
                      {field.type === "image" && <span>Image capture/upload</span>}
                      {field.type === "checkbox" && <span>Checkbox {field.defaultChecked !== undefined && `(Default: ${field.defaultChecked ? "Checked" : "Unchecked"})`}</span>}
                      {field.type === "multipleChoice" && <span>Multiple choice {field.options && `(${field.options.join(", ")})`}</span>}
                      {field.type === "qrBarcode" && <span>QR/Barcode input {field.barcodeType && `(${field.barcodeType === "qr" ? "QR Code" : "Barcode"})`}</span>}
                      {field.type === "dateTime" && <span>Date/Time picker</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Type: {getDataTypeName(field.type)}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className={isMobile ? "mx-1 shadow-sm" : ""}>
        <CardContent className={`${isMobile ? "p-3" : "pt-4"}`}>
          <h2 className="text-lg font-medium mb-3">Ready to Deploy?</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you're satisfied with your form layout, deploy the project to
            set up security and user permissions.
          </p>
          <div className={`flex gap-2 ${isMobile ? "flex-col" : ""}`}>
            <Button
              variant="outline"
              onClick={handleBack}
              className={isMobile ? "h-12 text-base w-full" : ""}
            >
              Back to Editing
            </Button>
            <Button
              onClick={handleDeploy}
              className={isMobile ? "h-12 text-base w-full" : ""}
            >
              Continue to Security
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default ReviewFormPage;