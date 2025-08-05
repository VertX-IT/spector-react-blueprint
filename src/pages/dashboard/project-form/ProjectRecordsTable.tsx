import React from "react";

interface ProjectRecordsTableProps {
  projectRecords: any[];
  projectSections: any[];
  expandedRows: string[];
  handleToggleRowExpand: (recordId: string) => void;
  formatLocationForDisplay: (loc: any) => string;
  formatDateForDisplay: (date: any) => string;
}

const ProjectRecordsTable: React.FC<ProjectRecordsTableProps> = ({
  projectRecords,
  projectSections,
  expandedRows,
  handleToggleRowExpand,
  formatLocationForDisplay,
  formatDateForDisplay,
}) => {
  return (
    <div className="overflow-auto">
      <div className="space-y-4">
        {projectRecords.map((record, index) => (
          <div key={record.id || index} className="border rounded mb-2">
            <div
              className="p-4 flex justify-between items-center cursor-pointer hover:bg-muted/50"
              onClick={() => handleToggleRowExpand(record.id || `record_${index}`)}
            >
              <div>
                <p className="font-medium text-sm">
                  Record {index + 1} - {new Date(record.createdAt).toLocaleDateString()}
                </p>
              </div>
              <button className="h-8 w-8">
                {expandedRows.includes(record.id || `record_${index}`) ? "▲" : "▼"}
              </button>
            </div>
            {expandedRows.includes(record.id || `record_${index}`) && (
              <div className="pt-0 border-t p-4">
                <div className="space-y-2">
                  {projectSections.flatMap((s: any) => s.fields).map((field: any) => (
                    <div key={field.id} className="grid grid-cols-2 gap-2 text-sm">
                      <div className="font-medium text-muted-foreground">
                        {field.label || field.name}:
                      </div>
                      <div>
                        {field.type === "location" || field.type === "coordinates"
                          ? formatLocationForDisplay(record.data[field.id] || "")
                          : (field.type === "image" || field.type === "qrBarcode") && typeof record.data[field.id] === "string" && record.data[field.id].startsWith("data:image/")
                            ? <img src={record.data[field.id]} alt="Uploaded" style={{ maxWidth: "100px" }} />
                            : field.name === "Date and Time" && record.data[field.id]
                              ? formatDateForDisplay(record.data[field.id])
                              : field.type === "multipleChoice" && Array.isArray(record.data[field.id])
                                ? record.data[field.id].join(", ")
                                : field.type === "checkbox"
                                  ? record.data[field.id] ? "Yes" : "No"
                                  : record.data[field.id] || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectRecordsTable;
