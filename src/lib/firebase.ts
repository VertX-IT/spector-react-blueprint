
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';
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

// Set persistence to local
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase auth persistence set to local');
  })
  .catch((error) => {
    console.error('Error setting auth persistence:', error);
  });

// Enable offline persistence for Firestore with improved mobile support
const enableOfflineSupport = async () => {
  try {
    // Try multi-tab persistence first (better for web)
    await enableMultiTabIndexedDbPersistence(db)
      .then(() => console.log('Multi-tab offline persistence enabled'))
      .catch((err) => {
        // If multi-tab fails, try regular persistence
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, fall back to single-tab persistence
          console.log('Falling back to single-tab persistence');
          return enableIndexedDbPersistence(db);
        } else if (err.code === 'unimplemented') {
          console.error('IndexedDB is not supported by this browser');
          throw err;
        }
      });
    
    console.log('Offline persistence enabled');
  } catch (error: any) {
    console.error('Error enabling offline persistence:', error);
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
