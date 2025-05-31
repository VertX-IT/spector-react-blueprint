/* eslint-disable @typescript-eslint/no-explicit-any */

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

// Interface for Section data
export interface Section {
  id: string;
  name: string;
  order: number;
  fields: FieldTemplate[];
}

// Interface for Field data
export interface FieldTemplate {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  sectionId?: string;
  options?: string[];
  placeholder?: string;
}

// Interface for Project data
export interface Project {
  id?: string;
  name: string;
  category: string;
  createdAt: Date;
  recordCount: number;
  projectPin: string;
  createdBy?: string;
  formSections?: Section[];
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

// Utility function to sanitize data by replacing undefined with null
const sanitizeData = (data: any): any => {
  if (data === undefined) return null;
  if (data === null || typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      sanitized[key] = sanitizeData(data[key]);
    }
  }
  return sanitized;
};

// Generate a sequential PIN code
export const generateSequentialPin = async () => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('projectPin', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return '000000';
    }
    
    const highestPin = querySnapshot.docs[0].data().projectPin;
    
    if (!highestPin || isNaN(parseInt(highestPin))) {
      return '000000';
    }
    
    const nextPinNumber = parseInt(highestPin) + 1;
    const nextPin = nextPinNumber.toString().padStart(6, '0');
    
    const pinCheckQuery = query(projectsRef, where("projectPin", "==", nextPin));
    const pinCheckSnapshot = await getDocs(pinCheckQuery);
    
    if (!pinCheckSnapshot.empty) {
      return generateSequentialPin();
    }
    
    return nextPin;
  } catch (error) {
    console.error('Error generating sequential PIN:', error);
    const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
    return randomPin;
  }
};

// Verify Firebase connection
export const verifyFirebaseConnection = async () => {
  try {
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
    
    const connectionCheck = await verifyFirebaseConnection();
    if (!connectionCheck.success) {
      throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
    }
    
    const projectsRef = collection(db, 'projects');
    
    const firestoreData = {
      ...projectData,
      createdAt: projectData.createdAt.toISOString(),
      serverTimestamp: serverTimestamp(),
      status: 'active',
    };
    
    console.log('Prepared data for Firestore:', firestoreData);
    const docRef = await addDoc(projectsRef, firestoreData);
    console.log('Project saved successfully with ID:', docRef.id);
    
    return { id: docRef.id, ...projectData };
  } catch (error: any) {
    console.error('Error saving project to Firestore:', error);
    const errorMessage = error.message || 'Unknown error';
    console.log('Error details:', errorMessage);
    
    throw new Error(`Failed to save project: ${errorMessage}`);
  }
};

// Duplicate a project
export const duplicateProject = async (projectId: string, newName?: string) => {
  try {
    console.log('Attempting to duplicate project with ID:', projectId);
    
    const originalProject = await getProjectById(projectId);
    
    if (!originalProject) {
      throw new Error('Project not found');
    }
    
    const newPin = await generateSequentialPin();
    
    const duplicatedProjectData: Omit<Project, 'id'> = {
      name: newName || `${originalProject.name} (Copy)`,
      category: originalProject.category,
      createdAt: new Date(),
      recordCount: 0,
      projectPin: newPin,
      createdBy: originalProject.createdBy,
      formSections: originalProject.formSections || [],
      description: originalProject.description || '',
      status: 'active',
    };
    
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
        formSections: Array.isArray(data.formSections) ? data.formSections : [],
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
    
    const recordData: Omit<ProjectRecord, 'id'> = {
      projectId,
      data,
      createdAt: new Date().toISOString(),
      createdBy: userId || 'anonymous',
    };
    
    const recordsRef = collection(db, 'records');
    const docRef = await addDoc(recordsRef, recordData);
    console.log('Form data submitted with ID:', docRef.id);
    
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

// Update an existing project
export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  try {
    console.log('Attempting to update project with ID:', projectId, 'with updates:', updates);
    
    const connectionCheck = await verifyFirebaseConnection();
    if (!connectionCheck.success) {
      throw new Error(`Firebase connection issue: ${connectionCheck.error}`);
    }

    const projectRef = doc(db, 'projects', projectId);
    const sanitizedUpdates = sanitizeData({
      ...updates,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(projectRef, sanitizedUpdates);
    console.log('Project updated successfully');

    const storedProjects = JSON.parse(localStorage.getItem('myProjects') || '[]');
    const projectIndex = storedProjects.findIndex((p: any) => p.id === projectId);
    if (projectIndex !== -1) {
      storedProjects[projectIndex] = { ...storedProjects[projectIndex], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('myProjects', JSON.stringify(storedProjects));
    }

    return true;
  } catch (error: any) {
    console.error('Error updating project:', error);
    throw new Error(`Failed to update project: ${error.message || 'Unknown error'}`);
  }
};