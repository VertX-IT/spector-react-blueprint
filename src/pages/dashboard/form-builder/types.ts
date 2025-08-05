// Section and Field types
export type FieldTemplate = {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string; // For text, numbers, textAndNumbers
  options?: string[]; // For definedList, multipleChoice
  defaultChecked?: boolean; // For checkbox
  barcodeType?: "qr" | "barcode"; // For qrBarcode
};

export type FormSection = {
  id: string;
  name: string;
  fields: FieldTemplate[];
};

export type ProjectData = {
  category: string;
  name: string;
  assetName: string;
  description: string;
}; 