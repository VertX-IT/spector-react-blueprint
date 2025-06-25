// System field names that are automatically managed
export const SYSTEM_FIELD_NAMES = [
  "Record No.",
  "User ID", 
  "Date and Time"
];

// Check if a field is a system field
export const isSystemField = (fieldName: string): boolean => {
  return SYSTEM_FIELD_NAMES.includes(fieldName);
};

// Get the next record number for a project
export const getNextRecordNumber = (currentRecordCount: number): string => {
  return (currentRecordCount + 1).toString().padStart(4, '0');
};

// Generate automatic values for system fields
export const generateSystemFieldValues = (
  userId: string,
  recordCount: number
): Record<string, any> => {
  const now = new Date();
  
  return {
    "Record No.": getNextRecordNumber(recordCount),
    "User ID": userId,
    "Date and Time": now.toISOString()
  };
};

// Filter out system fields from a list of fields
export const filterSystemFields = (fields: any[]): any[] => {
  return fields.filter(field => !isSystemField(field.name));
};

// Get only system fields from a list of fields
export const getSystemFields = (fields: any[]): any[] => {
  return fields.filter(field => isSystemField(field.name));
};

// Check if a field should be read-only (system fields are read-only)
export const isFieldReadOnly = (fieldName: string): boolean => {
  return isSystemField(fieldName);
};

// Get field display value for system fields
export const getSystemFieldDisplayValue = (
  fieldName: string,
  userId: string,
  recordCount: number
): string => {
  const values = generateSystemFieldValues(userId, recordCount);
  return values[fieldName] || '';
};

// Format date for display
export const formatDateForDisplay = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString();
  } catch (error) {
    return dateString;
  }
}; 