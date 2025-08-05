import { FieldTemplate, ProjectRecord, Section } from "./types";

/**
 * Converts a File object to base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Gets fields for a specific section
 */
export const getFieldsBySection = (sections: Section[], sectionId: string): FieldTemplate[] => {
  const section = sections.find(s => s.id === sectionId);
  return section ? section.fields : [];
};

/**
 * Formats location data for display
 */
export const formatLocationForDisplay = (loc: any): string => {
  if (!loc) return "-";
  if (typeof loc === "object" && (loc.lat || loc.lng)) {
    return `Lat: ${loc.lat}, Lng: ${loc.lng}`;
  }
  if (typeof loc === "string") {
    try {
      const obj = JSON.parse(loc);
      if (obj && obj.lat && obj.lng) {
        return `Lat: ${obj.lat}, Lng: ${obj.lng}`;
      }
    } catch {
      return loc;
    }
    return loc;
  }
  return "-";
};

/**
 * Handles CSV export functionality
 */
export const handleExportData = (
  projectRecords: ProjectRecord[],
  projectSections: Section[],
  projectName?: string
): void => {
  if (!projectRecords || projectRecords.length === 0) return;
  
  const allFields = projectSections.flatMap(s => s.fields);
  const headers = [
    ...allFields.map((f) => f.label || f.name || f.id),
    "User ID",
    "Record No.",
  ];
  const fieldIds = allFields.map((f) => f.id);
  const rows = [
    headers,
    ...projectRecords.map((record) => {
      const fieldValues = fieldIds.map((fid) => {
        let val = record.data?.[fid];
        if (typeof val === "string" && val.startsWith("data:image/")) {
          val = "Image (Base64)";
        } else if (val instanceof File) {
          val = val.name;
        } else if (Array.isArray(val)) {
          val = val.join("; ");
        } else if (typeof val === "object") {
          val = JSON.stringify(val);
        }
        return `"${(val ?? "-").toString().replace(/"/g, '""')}"`;
      });
      return [
        ...fieldValues,
        `"${(record.data?.userId ?? "-").toString().replace(/"/g, '""')}"`,
        `"${(record.data?.recordNo ?? "-").toString().replace(/"/g, '""')}"`,
      ];
    }),
  ];
  const csvContent = rows.map((r) => r.join(",")).join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${projectName || "project"}-data.csv`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
};
