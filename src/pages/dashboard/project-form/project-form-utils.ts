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
 * Checks camera permission for barcode scanning
 */
export const checkCameraPermission = async (): Promise<boolean> => {
  try {
    const permissionStatus = await BarcodeScanner.checkPermission({ force: false });
    if (permissionStatus.granted) {
      return true;
    }
    const result = await BarcodeScanner.checkPermission({ force: true });
    if (result.granted) {
      return true;
    }
    toast({
      variant: "destructive",
      title: "Permission Denied",
      description: "Camera permission is required to scan QR codes or barcodes.",
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
    document.body.classList.remove("scanner-active");
    await BarcodeScanner.showBackground();

    if (result.hasContent) {
      console.log("Scanned content:", result.content);
      handleInputChange(fieldId, result.content);
      toast({
        title: "Scan Successful",
        description: `Scanned value: ${result.content}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Data Scanned",
        description: "No QR code or barcode data was detected.",
      });
    }
  } catch (error: any) {
    console.error("Error scanning QR/Barcode:", error);
    toast({
      variant: "destructive",
      title: "Scan Error",
      description: "Failed to scan QR code or barcode.",
    });
  }
};

/**
 * Handles CSV export functionality
 */
export const handleExportData = async (
  projectRecords: ProjectRecord[],
  projectSections: Section[],
  projectName?: string
): Promise<void> => {
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
