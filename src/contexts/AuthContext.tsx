import React, { createContext, useState, useContext, useEffect } from "react";
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/components/ui/use-toast";

export type UserRole = "designer" | "collector";

export interface UserData {
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  role: UserRole;
  createdAt: number;
  profilePictureURL?: string | null;
  profilePictureUpdatedAt?: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  isLoading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    phoneNumber: string,
    role: UserRole
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (role: UserRole) => Promise<void>;
  logOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<void>;
  updateUserData: (updates: Partial<UserData>) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  reloadUser: () => Promise<void>;
  isEmailVerified: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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
          const userDocRef = doc(db, "users", user.uid);
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
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

      await setDoc(doc(db, "users", user.uid), userData);
      setUserData(userData);

      // Send verification email
      await sendEmailVerification(user);

      toast({
        title: "Account created successfully!",
        description: "Please check your email and click the verification link, then return to this page to access your dashboard.",
      });
    } catch (error: any) {
      let errorMessage = "An error occurred while creating your account. Please try again.";
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "An account with this email address already exists. Please try signing in instead, or use a different email address.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password is too weak. Please choose a stronger password with at least 8 characters, including uppercase, lowercase, numbers, and special characters.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Email/password accounts are not enabled. Please contact support.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        // Fallback to Firebase error message if it's not one of the known codes
        errorMessage = error.message;
      }

      toast({
        title: "Error creating account",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        // Sign out the user since email is not verified
        await signOut(auth);
        toast({
          title: "Email not verified",
          description: "Please check your email and click the verification link before signing in.",
          variant: "destructive",
        });
        throw new Error("Email not verified");
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in.",
      });
    } catch (error: any) {
      if (error.message === "Email not verified") {
        throw error;
      }

      let errorMessage = "An error occurred while signing in. Please try again.";
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address. Please check your email or create a new account.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please check your password and try again.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = "This account has been disabled. Please contact support.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed sign-in attempts. Please try again later or reset your password.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        // Fallback to Firebase error message if it's not one of the known codes
        errorMessage = error.message;
      }

      toast({
        title: "Error signing in",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async (role: UserRole) => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user already exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // This is a new user, create user data in Firestore
        const userData: UserData = {
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          role,
          createdAt: Date.now(),
        };

        await setDoc(userDocRef, userData);
        setUserData(userData);

        toast({
          title: "Google sign-up successful!",
          description: "Welcome to Spector",
        });
      } else {
        // User already exists, just sign them in
        setUserData(userDocSnap.data() as UserData);
        
        toast({
          title: "Welcome back!",
          description: "Successfully signed in with Google.",
        });
      }
    } catch (error: any) {
      let errorMessage = "An error occurred while signing in with Google. Please try again.";
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "Sign-in was cancelled. Please try again.";
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = "An account already exists with this email address using a different sign-in method. Please try signing in with email/password instead.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = "Google sign-in is not enabled. Please contact support.";
      } else if (error.message) {
        // Fallback to Firebase error message if it's not one of the known codes
        errorMessage = error.message;
      }

      toast({
        title: "Error signing in with Google",
        description: errorMessage,
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
      let errorMessage = "An error occurred while sending the password reset email. Please try again.";
      
      // Handle specific Firebase Auth errors
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address. Please check your email or create a new account.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many password reset attempts. Please try again later.";
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else if (error.message) {
        // Fallback to Firebase error message if it's not one of the known codes
        errorMessage = error.message;
      }

      toast({
        title: "Error resetting password",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    }
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ) => {
    try {
      if (!currentUser || !currentUser.email) {
        throw new Error("No authenticated user found");
      }

      // Reauthenticate user before changing password
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );

      await reauthenticateWithCredential(currentUser, credential);

      // Change password
      await updatePassword(currentUser, newPassword);

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
    } catch (error: any) {
      let errorMessage = "Failed to change password";

      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please sign in again before changing your password";
      }

      toast({
        title: "Error changing password",
        description: errorMessage,
        variant: "destructive",
      });

      throw error;
    }
  };

  const updateUserData = async (updates: Partial<UserData>) => {
    if (!userData) {
      throw new Error("User data is not initialized");
    }

    try {
      const updatedUserData: UserData = {
        ...userData,
        ...updates,
      };

      await setDoc(doc(db, "users", userData.uid), updatedUserData);
      setUserData(updatedUserData);

      toast({
        title: "User data updated",
        description: "Your user data has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error updating user data",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const sendVerificationEmail = async () => {
    try {
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      await sendEmailVerification(currentUser);
      toast({
        title: "Verification email sent",
        description: "Check your inbox for further instructions.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending verification email",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const reloadUser = async () => {
    try {
      if (!currentUser) {
        throw new Error("No authenticated user found");
      }

      // Reload the current user to get updated email verification status
      await currentUser.reload();
      
      toast({
        title: "User data reloaded",
        description: "Your user data has been reloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error reloading user data",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const isEmailVerified = currentUser?.emailVerified || false;

  const value: AuthContextType = {
    currentUser,
    userData,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    logOut,
    resetPassword,
    changePassword,
    updateUserData,
    sendVerificationEmail,
    reloadUser,
    isEmailVerified,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
