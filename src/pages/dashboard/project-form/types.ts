export interface Section {
  id: string;
  name: string;
  order: number;
  fields: FieldTemplate[];
}

export interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  sectionId?: string;
  options?: string[];
  placeholder?: string;
  defaultChecked?: boolean;
  barcodeType?: "qr" | "barcode";
}

export interface ProjectRecord {
  id?: string;
  projectId: string;
  data: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

export interface Project {
  id: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin: string;
  formSections?: Section[];
  description?: string;
  status?: "active" | "inactive";
  endedAt?: string;
  createdBy?: string;
}

export interface FormData {
  [key: string]: string | File | boolean | string[] | null;
} 