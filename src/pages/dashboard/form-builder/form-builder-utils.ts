// Data types available for form fields
export const dataTypes = [
  { id: "text", name: "Text" },
  { id: "numbers", name: "Numbers" },
  { id: "textAndNumbers", name: "Text and Numbers" },
  { id: "coordinates", name: "Geographical Coordinates" },
  { id: "image", name: "Image (Take new, Add existing)" },
  { id: "definedList", name: "Defined List (Select One)" },
  { id: "checkbox", name: "Checkbox (Yes/No)" },
  { id: "multipleChoice", name: "Multiple Choice (select many)" },
  { id: "qrBarcode", name: "QR/Barcode Reader" },
  { id: "dateTime", name: "Date and Time" },
];

// Barcode types for qrBarcode fields
export const barcodeTypes = [
  { id: "qr", name: "QR Code" },
  { id: "barcode", name: "Barcode" },
];

// Asset categories
export const categories = [
  { id: "land", name: "Land" },
  { id: "buildings", name: "Buildings" },
  { id: "biological", name: "Biological Assets" },
  { id: "machinery", name: "Machinery" },
  { id: "furniture", name: "Furniture & Fixtures" },
  { id: "equipment", name: "Equipment" },
  { id: "vehicles", name: "Motor Vehicles" },
  { id: "other", name: "Other" },
];

// Template fields per category
export const templatesByCategory = {
  land: [
    { name: "Land Name", type: "text", required: true, placeholder: "Enter land name" },
    { name: "Address", type: "textAndNumbers", required: true, placeholder: "Enter address" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  buildings: [
    { name: "Building Name", type: "text", required: true, placeholder: "Enter building name" },
    { name: "Address", type: "textAndNumbers", required: true, placeholder: "Enter address" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Year of Construction", type: "numbers", required: false, placeholder: "Enter year" },
    { name: "Building Area", type: "definedList", required: true, options: ["Small", "Medium", "Large"] },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Condition", type: "definedList", required: true, options: ["Good", "Fair", "Poor"] },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  biological: [
    { name: "Location", type: "text", required: true, placeholder: "Enter location" },
    { name: "Field Name", type: "text", required: true, placeholder: "Enter field name" },
    { name: "Geographic Coordinates", type: "coordinates", required: true },
    { name: "Species", type: "text", required: true, placeholder: "Enter species" },
    { name: "Inspection Image", type: "image", required: true },
    { name: "Diameter", type: "numbers", required: false, placeholder: "Enter diameter in cm" },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  machinery: [
    { name: "Machine Name", type: "text", required: true, placeholder: "Enter machine name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  furniture: [
    { name: "Furniture Name", type: "text", required: true, placeholder: "Enter furniture name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  equipment: [
    { name: "Equipment Name", type: "text", required: true, placeholder: "Enter equipment name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Asset Code", type: "qrBarcode", required: true, barcodeType: "qr" },
    { name: "Model Number", type: "textAndNumbers", required: true, placeholder: "Enter model number" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  vehicles: [
    { name: "Vehicle Name", type: "text", required: true, placeholder: "Enter vehicle name" },
    { name: "Brand", type: "text", required: true, placeholder: "Enter brand" },
    { name: "Model", type: "text", required: true, placeholder: "Enter model" },
    { name: "YOM", type: "numbers", required: true, placeholder: "Enter year of manufacture" },
    { name: "Quantity", type: "numbers", required: true, placeholder: "Enter quantity" },
    { name: "Inspection Images", type: "image", required: true },
    { name: "Comments", type: "text", required: false, placeholder: "Add comments" },
  ],
  other: [
    { name: "Record No.", type: "textAndNumbers", required: true, placeholder: "Enter record number" },
    { name: "User ID", type: "textAndNumbers", required: true, placeholder: "Enter user ID" },
    { name: "Date and Time", type: "dateTime", required: true },
  ],
};

// Fields always included at top of every form section 1.
export const systemFields = [
  { name: "Record No.", type: "textAndNumbers", required: true, placeholder: "Enter record number" },
  { name: "User ID", type: "textAndNumbers", required: true, placeholder: "Enter user ID" },
  { name: "Date and Time", type: "dateTime", required: true },
];

// Project creation steps
export const steps = ["Basic Details", "Form Fields", "Review", "Security"];

// Helper function to get data type name
export const getDataTypeName = (typeId: string) =>
  dataTypes.find((t) => t.id === typeId)?.name || typeId;
