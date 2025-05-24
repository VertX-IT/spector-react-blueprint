
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  getDoc,
  doc, 
  deleteDoc, 
  query,
  where,
  serverTimestamp,
  updateDoc,
  increment,
  orderBy,
  limit
} from 'firebase/firestore';
import { useAuth } from '@/contexts/AuthContext';

// Interface for Project data
export interface Project {
  id?: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin: string;
  createdBy?: string;
  formFields?: any[];
  formSections?: any[]; // <-- add this line to fix error
  description?: string;
  status?: 'active' | 'inactive';
  endedAt?: string;
}

// Interface for Record data
export interface ProjectRecord {
  id?: string;
  projectId: string;
  data: Record<string, any>;
  createdAt: string;
  createdBy: string;
}

// Generate a sequential PIN code
export const generateSequentialPin = async () => {
  try {
    // Get the project with the highest PIN code
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('projectPin', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    // If no projects exist, start with 000000
    if (querySnapshot.empty) {
      return '000000';
    }
    
    // Get the highest PIN and increment it
    const highestPin = querySnapshot.docs[0].data().projectPin;
    
    // If the highest PIN is not numeric for some reason, start from 000000
    if (!highestPin || isNaN(parseInt(highestPin))) {
      return '000000';
    }
    
    // Convert to integer, increment, and format back to 6-digit string
    const nextPinNumber = parseInt(highestPin) + 1;
    const nextPin = nextPinNumber.toString().padStart(6, '0');
    
    // Verify this PIN doesn't already exist (double-check)
    const pinCheckQuery = query(projectsRef, where("projectPin", "==", nextPin));
    const pinCheckSnapshot = await getDocs(pinCheckQuery);
    
    if (!pinCheckSnapshot.empty) {
      // If by some chance the PIN already exists, recursively try the next one
      return generateSequentialPin();
    }
    
    return nextPin;
  } catch (error) {
    console.error('Error generating sequential PIN:', error);
    
    // Fallback to a random PIN if there's an error
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    return randomPin;
  }
};

// Verify Firebase connection
export const verifyFirebaseConnection = async () => {
  try {
    // Attempt to fetch a non-existent document to verify connectivity
    const testQuery = query(collection(db, 'projects'), where('_test_', '==', true));
    await getDocs(testQuery);
    console.log('Firebase connection verified successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error verifying Firebase connection:', error);
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. Check your Firebase security rules.' };
    } else if (error.code?.includes('unavailable') || error.message?.includes('network error')) {
      return { success: false, error: 'Network error. Check your internet connection.' };
    }
    return { success: false, error: error.message || 'Unknown error connecting to Firebase' };
  }
};

// Save a new project to Firestore
export const saveProject = async (projectData: Omit<Project, 'id'>) => {
  try {
    console.log('Attempting to save project to Firestore:', projectData);
    
    // Verify connection first
    const connectionCheck = await verifyFirebaseConnection();
    if (!connectionCheck.success) {
      throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
    }
    
    const projectsRef = collection(db, 'projects');
    
    // Use serverTimestamp for consistent server timestamps
    const firestoreData = {
      ...projectData,
      createdAt: projectData.createdAt.toISOString(), // Convert Date to string for Firestore
      serverTimestamp: serverTimestamp(), // Add a server timestamp
      status: 'active', // Default status for new projects
    };
    
    console.log('Prepared data for Firestore:', firestoreData);
    const docRef = await addDoc(projectsRef, firestoreData);
    console.log('Project saved successfully with ID:', docRef.id);
    
    return { id: docRef.id, ...projectData };
  } catch (error: any) {
    console.error('Error saving project to Firestore:', error);
    const errorMessage = error.message || 'Unknown error';
    console.log('Error details:', errorMessage);
    
    // Throw a more descriptive error
    throw new Error(`Failed to save project: ${errorMessage}`);
  }
};

// Duplicate a project
export const duplicateProject = async (projectId: string, newName?: string) => {
  try {
    console.log('Attempting to duplicate project with ID:', projectId);
    
    // Get the original project data
    const originalProject = await getProjectById(projectId);
    
    if (!originalProject) {
      throw new Error('Project not found');
    }
    
    // Generate a new sequential PIN
    const newPin = await generateSequentialPin();
    
    // Create a new project based on the original project
    const duplicatedProjectData: Omit<Project, 'id'> = {
      name: newName || `${originalProject.name} (Copy)`,
      category: originalProject.category,
      createdAt: new Date(),
      recordCount: 0, // Start with 0 records
      projectPin: newPin,
      createdBy: originalProject.createdBy,
      formFields: originalProject.formFields || [],
      description: originalProject.description || '',
      status: 'active', // Always start as active
    };
    
    // Save the duplicated project
    const newProject = await saveProject(duplicatedProjectData);
    console.log('Project duplicated successfully with ID:', newProject.id);
    
    return newProject;
  } catch (error: any) {
    console.error('Error duplicating project:', error);
    throw new Error(`Failed to duplicate project: ${error.message || 'Unknown error'}`);
  }
};

// Get all projects for a user
export const getUserProjects = async (userId: string) => {
  try {
    console.log('Fetching projects for user ID:', userId);
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    
    console.log('Projects fetched successfully. Count:', querySnapshot.size);
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Processing project data:', data);
      projects.push({
        id: doc.id,
        name: data.name,
        category: data.category,
        createdAt: new Date(data.createdAt),
        recordCount: data.recordCount,
        projectPin: data.projectPin,
        createdBy: data.createdBy,
        description: data.description,
        status: data.status || 'active',
        endedAt: data.endedAt,
        formFields: Array.isArray(data.formFields) ? data.formFields : [],
        formSections: Array.isArray(data.formSections) ? data.formSections : []
      });
    });
    
    return projects;
  } catch (error: any) {
    console.error('Error getting user projects:', error);
    throw new Error(`Failed to get user projects: ${error.message || 'Unknown error'}`);
  }
};

// Delete a project
export const deleteProject = async (projectId: string) => {
  try {
    console.log('Attempting to delete project with ID:', projectId);
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
    console.log('Project deleted successfully');
    return true;
  } catch (error: any) {
    console.error('Error deleting project:', error);
    throw new Error(`Failed to delete project: ${error.message || 'Unknown error'}`);
  }
};

// Find a project by PIN
export const findProjectByPin = async (pin: string) => {
  try {
    console.log('Searching for project with PIN:', pin);
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where("projectPin", "==", pin));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log('No project found with this PIN');
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    console.log('Project found:', data);
    
    return {
      id: doc.id,
      name: data.name,
      category: data.category,
      createdAt: new Date(data.createdAt),
      recordCount: data.recordCount,
      projectPin: data.projectPin,
    };
  } catch (error: any) {
    console.error('Error finding project by PIN:', error);
    throw new Error(`Failed to find project: ${error.message || 'Unknown error'}`);
  }
};

// Get a project by ID
export const getProjectById = async (projectId: string) => {
  try {
    console.log('Fetching project with ID:', projectId);
    const projectRef = doc(db, 'projects', projectId);
    const projectSnapshot = await getDoc(projectRef);

    if (projectSnapshot.exists()) {
      const data = projectSnapshot.data();
      console.log('Project found:', data);

      return {
        id: projectSnapshot.id,
        name: data.name,
        category: data.category,
        createdAt: new Date(data.createdAt),
        recordCount: data.recordCount,
        projectPin: data.projectPin,
        description: data.description || '',
        createdBy: data.createdBy,
        status: data.status || 'active',
        endedAt: data.endedAt,
        formFields: Array.isArray(data.formFields) ? data.formFields : [],
        formSections: Array.isArray(data.formSections) ? data.formSections : [],
      };
    }

    console.log('No project found with this ID');
    return null;
  } catch (error: any) {
    console.error('Error finding project by ID:', error);
    throw new Error(`Failed to find project: ${error.message || 'Unknown error'}`);
  }
};

// Submit form data for a project
export const submitFormData = async (projectId: string, data: Record<string, any>, userId: string) => {
  try {
    console.log('Submitting form data for project:', projectId);
    
    // Create the record
    const recordData: Omit<ProjectRecord, 'id'> = {
      projectId,
      data,
      createdAt: new Date().toISOString(),
      createdBy: userId || 'anonymous',
    };
    
    const recordsRef = collection(db, 'records');
    const docRef = await addDoc(recordsRef, recordData);
    console.log('Form data submitted with ID:', docRef.id);
    
    // Update the record count for the project
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, {
      recordCount: increment(1)
    });
    console.log('Project record count updated');
    
    return { id: docRef.id, ...recordData };
  } catch (error: any) {
    console.error('Error submitting form data:', error);
    throw new Error(`Failed to submit form: ${error.message || 'Unknown error'}`);
  }
};

// Get all records for a project
export const getProjectRecords = async (projectId: string) => {
  try {
    console.log('Fetching records for project ID:', projectId);
    const recordsRef = collection(db, 'records');
    const q = query(recordsRef, where("projectId", "==", projectId));
    const querySnapshot = await getDocs(q);
    
    console.log('Records fetched successfully. Count:', querySnapshot.size);
    
    const records: ProjectRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id,
        projectId: data.projectId,
        data: data.data,
        createdAt: data.createdAt,
        createdBy: data.createdBy,
      });
    });
    
    return records;
  } catch (error: any) {
    console.error('Error getting project records:', error);
    throw new Error(`Failed to get project records: ${error.message || 'Unknown error'}`);
  }
};
