
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  query,
  where,
  serverTimestamp
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
  description?: string;
}

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
        formFields: data.formFields,
        description: data.description
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
