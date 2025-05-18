import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FieldTemplate {
  id: string;
  name?: string;
  label?: string;
  type: string;
}

interface ProjectRecordProps {
  record: {
    id: string;
    projectId: string;
    data: Record<string, any>;
    createdAt: string;
    createdBy: string;
  };
  fields: FieldTemplate[];
  index: number;
  formatLocationForDisplay: (value: string) => string;
}

export const ProjectRecordCard: React.FC<ProjectRecordProps> = ({
  record,
  fields,
  index,
  formatLocationForDisplay,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="border mb-3">
      <div
        className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="font-medium text-sm">
            Record {index + 1} -{" "}
            {new Date(record.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {expanded && (
        <CardContent className="pt-0 border-t">
          <div className="space-y-2">
            {fields?.map((field) => (
              <div key={field.id} className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-medium text-muted-foreground">
                  {field.label || field.name}:
                </div>
                <div>
                  {field.type === "location"
                    ? formatLocationForDisplay(record.data[field.id] || "")
                    : record.data[field.id] || "-"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};
