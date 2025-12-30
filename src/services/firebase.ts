// Firebase configuration and initialization
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, type User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config is public and safe to include in client code
// These are publishable keys - they identify the project but don't grant access
const firebaseConfig = {
  apiKey: "AIzaSyC8HMpEIBEEu5qEqwHQxPKfJpjNe2E2QZw",
  authDomain: "levelup-gym-c6953.firebaseapp.com",
  projectId: "levelup-gym-c6953",
  storageBucket: "levelup-gym-c6953.firebasestorage.app",
  messagingSenderId: "441318134863",
  appId: "1:441318134863:web:a9d9e1e1f8d8e1f8d8e1f8"
};

// Always configured since we have hardcoded values
const isConfigured = true;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export const isFirebaseConfigured = () => true;

// Auth functions
export async function signInWithGoogle(): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email sign-in error:', error);
    throw error;
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<User | null> {
  if (!auth) return null;
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error) {
    console.error('Email sign-up error:', error);
    throw error;
  }
}

export async function firebaseSignOut(): Promise<void> {
  if (!auth) return;
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign-out error:', error);
    throw error;
  }
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
}

// Firestore functions for remote state
export async function getRemoteState(uid: string): Promise<unknown | null> {
  if (!db) return null;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().state;
    }
    return null;
  } catch (error) {
    console.error('Error getting remote state:', error);
    return null;
  }
}

export async function setRemoteState(uid: string, state: unknown): Promise<boolean> {
  if (!db) return false;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      state,
      updatedAt: serverTimestamp(),
      schemaVersion: 1,
    });
    return true;
  } catch (error) {
    console.error('Error setting remote state:', error);
    return false;
  }
}

export { type User };
