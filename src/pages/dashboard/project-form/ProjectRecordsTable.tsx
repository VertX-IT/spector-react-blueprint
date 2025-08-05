import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ProjectRecord, Section } from "./types";
import { formatLocationForDisplay } from "./project-form-utils";

interface ProjectRecordsTableProps {
  projectRecords: ProjectRecord[];
  projectSections: Section[];
  expandedRows: string[];
  handleToggleRowExpand: (recordId: string) => void;
}

const ProjectRecordsTable: React.FC<ProjectRecordsTableProps> = ({
  projectRecords,
  projectSections,
  expandedRows,
  handleToggleRowExpand,
}) => {
  return (
    <div className="overflow-auto">
      <div className="space-y-4">
        {projectRecords.map((record, index) => (
          <Card key={record.id || index} className="border">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
              onClick={() =>
                handleToggleRowExpand(record.id || `record_${index}`)
              }
            >
              <div>
                <p className="font-medium text-sm">
                  Record {index + 1} -{" "}
                  {new Date(record.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
              >
                {expandedRows.includes(record.id || `record_${index}`) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
            {expandedRows.includes(record.id || `record_${index}`) && (
              <CardContent className="pt-0 border-t">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-muted-foreground">
                      User ID:
                    </div>
                    <div>{record.data?.userId || "-"}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="font-medium text-muted-foreground">
                      Record No.:
                    </div>
                    <div>{record.data?.recordNo || "-"}</div>
                  </div>
                  {projectSections
                    .flatMap((s) => s.fields)
                    .map((field: any) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-2 gap-2 text-sm"
                      >
                        <div className="font-medium text-muted-foreground">
                          {field.label || field.name}:
                        </div>
                        <div>
                          {field.type === "location" ||
                          field.type === "coordinates"
                            ? formatLocationForDisplay(
                                record.data[field.id] || ""
                              )
                            : (field.type === "image" ||
                                field.type === "qrBarcode") &&
                              typeof record.data[field.id] === "string" &&
                              record.data[field.id].startsWith("data:image/")
                            ? (
                                <img
                                  src={record.data[field.id]}
                                  alt="Uploaded"
                                  style={{ maxWidth: "100px" }}
                                />
                              )
                            : field.type === "multipleChoice" &&
                              Array.isArray(record.data[field.id])
                            ? record.data[field.id].join(", ")
                            : field.type === "checkbox"
                            ? record.data[field.id]
                              ? "Yes"
                              : "No"
                            : record.data[field.id] || "-"}
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProjectRecordsTable;
