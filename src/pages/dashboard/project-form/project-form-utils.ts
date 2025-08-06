import { FieldTemplate, ProjectRecord, Section } from "./types";
import { Capacitor } from "@capacitor/core";
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import { toast } from "@/components/ui/use-toast";

/**
 * Resizes an image to specified dimensions while preserving aspect ratio
 */
export const resizeImage = (file: File, maxWidth: number, maxHeight: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions while preserving aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert image to blob"));
          }
        },
        file.type,
        0.8 // JPEG quality (0 to 1)
      );
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error("Failed to load image"));
      URL.revokeObjectURL(img.src);
    };
  });
};

/**
 * Converts a File object to base64 string with image resizing
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const maxSizeInBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSizeInBytes) {
      reject(
        new Error(
          `Image size exceeds 5MB limit. File size: ${(file.size / (1024 * 1024)).toFixed(2)}MB`
        )
      );
      return;
    }

    // Use an IIFE to handle async logic inside the executor
    (async () => {
      try {
        // Resize the image to a maximum of 800x800 pixels
        const resizedBlob = await resizeImage(file, 800, 800);
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          console.log("fileToBase64 success. Base64 string length:", result.length);
          resolve(result);
        };
        reader.onerror = (error) => {
          console.error("fileToBase64 error:", error);
          reject(error);
        };
        reader.readAsDataURL(resizedBlob);
      } catch (error) {
        reject(error);
      }
    })();
  });
};

/**
 * Gets fields for a specific section
 */
export const getFieldsBySection = (sections: Section[], sectionId: string): FieldTemplate[] => {
  const section = sections.find((s) => s.id === sectionId);
  return section ? section.fields : [];
};

/**
 * Formats location data for display
 */
export const formatLocationForDisplay = (loc: any): string => {
  if (!loc) return "No location data";
  
  if (typeof loc === "string") {
    try {
      const parsed = JSON.parse(loc);
      if (parsed.latitude && parsed.longitude) {
        return `${parsed.latitude.toFixed(6)}, ${parsed.longitude.toFixed(6)}`;
      }
    } catch {
      return loc;
    }
  }
  
  if (loc.latitude && loc.longitude) {
    return `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`;
  }
  
  return "Invalid location format";
};

/**
 * Exports project data to CSV format
 */
export const handleExportData = async (
  projectRecords: ProjectRecord[],
  projectSections: Section[],
  projectName?: string
): Promise<void> => {
  if (projectRecords.length === 0) {
    toast({
      title: "No data to export",
      description: "There are no records to export.",
    });
    return;
  }

  // Create CSV header
  const headers = ["Record ID", "Created At", "Created By"];
  const fieldHeaders = projectSections
    .flatMap((section) => section.fields)
    .map((field) => field.label || field.name);
  
  const csvHeaders = [...headers, ...fieldHeaders];
  const csvContent = [csvHeaders.join(",")];

  // Add data rows
  projectRecords.forEach((record) => {
    const row = [
      record.id || "N/A",
      new Date(record.createdAt).toLocaleString(),
      record.createdBy,
    ];

    // Add field values
    projectSections.forEach((section) => {
      section.fields.forEach((field) => {
        const value = record.data[field.id];
        let displayValue = "";

        if (value !== undefined && value !== null) {
          if (field.type === "location" || field.type === "coordinates") {
            displayValue = formatLocationForDisplay(value);
          } else if (field.type === "multipleChoice" && Array.isArray(value)) {
            displayValue = value.join("; ");
          } else if (field.type === "checkbox") {
            displayValue = value ? "Yes" : "No";
          } else if (typeof value === "string" && value.startsWith("data:image/")) {
            displayValue = "[Image]";
          } else {
            displayValue = String(value);
          }
        }

        // Escape commas and quotes in CSV
        displayValue = displayValue.replace(/"/g, '""');
        if (displayValue.includes(",") || displayValue.includes('"') || displayValue.includes("\n")) {
          displayValue = `"${displayValue}"`;
        }

        row.push(displayValue);
      });
    });

    csvContent.push(row.join(","));
  });

  // Create and download CSV file
  const csvString = csvContent.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${projectName || "project"}_data.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Checks camera permission for barcode scanning
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Barcode scanning is only available on mobile devices.",
    });
    return false;
  }

  try {
    const status = await BarcodeScanner.checkPermission({ force: true });
    if (status.granted) {
      return true;
    }
    toast({
      variant: "destructive",
      title: "Permission Denied",
      description: "Camera permission is required for barcode scanning.",
    });
    return false;
  } catch (error: any) {
    console.error("Error checking camera permission:", error);
    toast({
      variant: "destructive",
      title: "Error",
      description: "Failed to check camera permission.",
    });
    return false;
  }
};

/**
 * Handles QR/Barcode scanning
 */
export const handleScanQRBarcode = async (
  fieldId: string, 
  handleInputChange: (fieldId: string, value: string | File | boolean | string[] | null) => void
): Promise<void> => {
  if (!Capacitor.isNativePlatform()) {
    toast({
      variant: "destructive",
      title: "Error",
      description: "Barcode scanning is only available on mobile devices.",
    });
    return;
  }

  const hasPermission = await checkCameraPermission();
  if (!hasPermission) return;

  try {
    await BarcodeScanner.hideBackground();
    document.body.classList.add("scanner-active");

    const result = await BarcodeScanner.startScan();
    
    if (result.hasContent) {
      handleInputChange(fieldId, result.content);
      toast({
        title: "Scan successful",
        description: `Scanned: ${result.content}`,
      });
    } else {
      toast({
        title: "Scan failed",
        description: "No barcode detected. Please try again.",
      });
    }
  } catch (error: any) {
    console.error("Barcode scanning error:", error);
    toast({
      variant: "destructive",
      title: "Scanning Error",
      description: error.message || "Failed to scan barcode.",
    });
  } finally {
    await BarcodeScanner.stopScan();
    document.body.classList.remove("scanner-active");
  }
};
