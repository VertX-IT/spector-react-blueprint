
import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  query,
  where
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

// Save a new project to Firestore
export const saveProject = async (projectData: Omit<Project, 'id'>) => {
  try {
    const projectsRef = collection(db, 'projects');
    const docRef = await addDoc(projectsRef, {
      ...projectData,
      createdAt: projectData.createdAt.toISOString(), // Convert Date to string for Firestore
    });
    
    return { id: docRef.id, ...projectData };
  } catch (error) {
    console.error('Error saving project to Firestore:', error);
    throw error;
  }
};

// Get all projects for a user
export const getUserProjects = async (userId: string) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where("createdBy", "==", userId));
    const querySnapshot = await getDocs(q);
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
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
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
};

// Delete a project
export const deleteProject = async (projectId: string) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await deleteDoc(projectRef);
    return true;
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// Find a project by PIN
export const findProjectByPin = async (pin: string) => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, where("projectPin", "==", pin));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      name: data.name,
      category: data.category,
      createdAt: new Date(data.createdAt),
      recordCount: data.recordCount,
      projectPin: data.projectPin,
    };
  } catch (error) {
    console.error('Error finding project by PIN:', error);
    throw error;
  }
};
