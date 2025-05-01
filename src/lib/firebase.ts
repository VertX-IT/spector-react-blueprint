
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBeMRHD1rzOZIEyOMMfpKeFgkVcvEBKhEM",
  authDomain: "survey-sync-nexus.firebaseapp.com",
  projectId: "survey-sync-nexus",
  storageBucket: "survey-sync-nexus.appspot.com",
  messagingSenderId: "568741440285",
  appId: "1:568741440285:web:2c857fea3050238133f597"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence for Firestore
// Note: This must be called before any other Firestore functions
const enableOfflineSupport = async () => {
  try {
    await enableIndexedDbPersistence(db);
    console.log('Offline persistence enabled');
  } catch (error: any) {
    if (error.code === 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (error.code === 'unimplemented') {
      console.error('The current browser does not support offline persistence.');
    }
  }
};

// Call this function to enable offline support
enableOfflineSupport();

// Use emulators if in development mode
if (import.meta.env.DEV) {
  // Uncomment these lines if you're running Firebase emulators
  // connectAuthEmulator(auth, 'http://localhost:9099');
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
