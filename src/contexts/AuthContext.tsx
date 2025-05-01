
import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/components/ui/use-toast';

export type UserRole = 'designer' | 'collector';

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: number;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isLoading: boolean;
  signUp: (email: string, password: string, displayName: string, phoneNumber: string, role: UserRole) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch additional user data from Firestore
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          
          if (userDocSnap.exists()) {
            setUserData(userDocSnap.data() as UserData);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserData(null);
      }
      
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (
    email: string, 
    password: string, 
    displayName: string, 
    phoneNumber: string,
    role: UserRole
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile display name
      await updateProfile(user, { displayName });
      
      // Save additional user data to Firestore
      const userData: UserData = {
        uid: user.uid,
        displayName,
        email: user.email,
        phoneNumber,
        role,
        createdAt: Date.now(),
      };
      
      await setDoc(doc(db, 'users', user.uid), userData);
      setUserData(userData);
      
      toast({
        title: "Account created successfully!",
        description: "Welcome to SurveySync Nexus",
      });
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const logOut = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed out",
        description: "You've been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for further instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    isLoading,
    signUp,
    signIn,
    logOut,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
