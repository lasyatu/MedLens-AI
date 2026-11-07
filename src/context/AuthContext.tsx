/**
 * Authentication Context supporting Firebase Auth (Google Sign-In, Email/Password)
 * and seamless session state management
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db, testFirestoreConnection } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  preferredJurisdiction: string;
  isDemoUser?: boolean;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<void>;
  signOutUser: () => Promise<void>;
  updateUserJurisdiction: (jurisdiction: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate Firestore connection on boot
    testFirestoreConnection().catch(console.error);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        try {
          const userDocRef = doc(db, 'users', fbUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: data.displayName || fbUser.displayName,
              preferredJurisdiction: data.preferredJurisdiction || 'United States (FDA)'
            });
          } else {
            const now = new Date().toISOString();
            const newProfileData = {
              email: fbUser.email || 'user@medlens.ai',
              displayName: fbUser.displayName || 'Healthcare Seeker',
              preferredJurisdiction: 'United States (FDA)',
              createdAt: now,
              updatedAt: now
            };
            await setDoc(userDocRef, newProfileData);
            setProfile({
              uid: fbUser.uid,
              email: fbUser.email,
              displayName: newProfileData.displayName,
              preferredJurisdiction: newProfileData.preferredJurisdiction
            });
          }
        } catch (err) {
          console.warn('Profile fetch note:', err);
          // Set fallback profile from auth user
          setProfile({
            uid: fbUser.uid,
            email: fbUser.email,
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
            preferredJurisdiction: 'United States (FDA)'
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const clearError = () => setError(null);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      setError(err?.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      console.error('Email Sign-In Error:', err);
      let msg = 'Failed to sign in. Please verify your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please check your credentials or create an account.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    try {
      const res = await createUserWithEmailAndPassword(auth, email, pass);
      if (displayName && res.user) {
        await updateProfile(res.user, { displayName });
      }
    } catch (err: any) {
      console.error('Sign-Up Error:', err);
      let msg = 'Failed to register account.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Please log in instead.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password must be at least 6 characters.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signOutUser = async () => {
    setError(null);
    try {
      await signOut(auth);
      setProfile(null);
      setUser(null);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
      setError(err?.message || 'Failed to sign out');
    }
  };

  const updateUserJurisdiction = async (jurisdiction: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        preferredJurisdiction: jurisdiction,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setProfile(prev => prev ? { ...prev, preferredJurisdiction: jurisdiction } : null);
    } catch (err) {
      console.error('Failed to update jurisdiction:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOutUser,
        updateUserJurisdiction,
        error,
        clearError
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
