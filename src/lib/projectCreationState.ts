// Types for project creation state
export interface ProjectCreationData {
  name: string;
  assetName: string;
  description: string;
  category: string;
}

export interface FormSection {
  id: string;
  name: string;
  fields: FieldTemplate[];
}

export interface FieldTemplate {
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  defaultChecked?: boolean;
  barcodeType?: "qr" | "barcode";
}

// Storage keys
const PROJECT_DATA_KEY = 'projectData';
const FORM_SECTIONS_KEY = 'formSections';
const FORM_FIELDS_KEY = 'formFields'; // Legacy support

// Save project data to localStorage
export const saveProjectData = (data: ProjectCreationData): void => {
  try {
    localStorage.setItem(PROJECT_DATA_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving project data:', error);
  }
};

// Load project data from localStorage
export const loadProjectData = (): ProjectCreationData | null => {
  try {
    const stored = localStorage.getItem(PROJECT_DATA_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading project data:', error);
    return null;
  }
};

// Save form sections to localStorage
export const saveFormSections = (sections: FormSection[]): void => {
  try {
    localStorage.setItem(FORM_SECTIONS_KEY, JSON.stringify(sections));
  } catch (error) {
    console.error('Error saving form sections:', error);
  }
};

// Load form sections from localStorage
export const loadFormSections = (): FormSection[] | null => {
  try {
    const stored = localStorage.getItem(FORM_SECTIONS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading form sections:', error);
    return null;
  }
};

// Check if project creation is in progress
export const isProjectCreationInProgress = (): boolean => {
  const projectData = loadProjectData();
  const formSections = loadFormSections();
  return !!(projectData || formSections);
};

// Get current step based on available data
export const getCurrentCreationStep = (): number => {
  const projectData = loadProjectData();
  const formSections = loadFormSections();
  
  if (!projectData) return 1;
  if (!formSections || formSections.length === 0) return 2;
  return 3; // Review step
};

// Clear all project creation data
export const clearProjectCreationData = (): void => {
  try {
    localStorage.removeItem(PROJECT_DATA_KEY);
    localStorage.removeItem(FORM_SECTIONS_KEY);
    localStorage.removeItem(FORM_FIELDS_KEY); // Legacy cleanup
  } catch (error) {
    console.error('Error clearing project creation data:', error);
  }
};

// Auto-save project data with debouncing
let saveTimeout: NodeJS.Timeout | null = null;
export const autoSaveProjectData = (data: ProjectCreationData): void => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveProjectData(data);
  }, 500); // Save after 500ms of inactivity
};

// Auto-save form sections with debouncing
let sectionsSaveTimeout: NodeJS.Timeout | null = null;
export const autoSaveFormSections = (sections: FormSection[]): void => {
  if (sectionsSaveTimeout) {
    clearTimeout(sectionsSaveTimeout);
  }
  
  sectionsSaveTimeout = setTimeout(() => {
    saveFormSections(sections);
  }, 500); // Save after 500ms of inactivity
}; 