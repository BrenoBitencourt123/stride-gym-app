import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  firebaseSignOut, 
  onAuthChange,
  isFirebaseConfigured,
  type User 
} from '@/services/firebase';
import { forceSync, debouncedSync, isOnline, type SyncStatus } from '@/lib/sync';
import { CHANGE_EVENT } from '@/lib/localStore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  isConfigured: boolean;
  signInGoogle: () => Promise<void>;
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  triggerSync: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const isConfigured = isFirebaseConfigured();
  const userRef = useRef<User | null>(null);

  // Keep userRef in sync
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      if (userRef.current && isOnline()) {
        setSyncStatus('pending');
        debouncedSync(userRef.current.uid, setSyncStatus);
      }
    };

    const handleOffline = () => {
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!isOnline()) {
      setSyncStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Centralized listener for change events - triggers debounced sync
  useEffect(() => {
    const handleChange = () => {
      if (userRef.current && isOnline()) {
        debouncedSync(userRef.current.uid, setSyncStatus);
      }
    };

    window.addEventListener(CHANGE_EVENT, handleChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange);
    };
  }, []);

  // Auth state listener - force sync on login
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser && isOnline()) {
        setSyncStatus('syncing');
        const result = await forceSync(firebaseUser.uid);
        setSyncStatus(result.status);
      }
    });

    return unsubscribe;
  }, []);

  const signInGoogle = useCallback(async () => {
    const firebaseUser = await signInWithGoogle();
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await forceSync(firebaseUser.uid);
      setSyncStatus(result.status);
    }
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const firebaseUser = await signInWithEmail(email, password);
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await forceSync(firebaseUser.uid);
      setSyncStatus(result.status);
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    const firebaseUser = await signUpWithEmail(email, password);
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await forceSync(firebaseUser.uid);
      setSyncStatus(result.status);
    }
  }, []);

  const logout = useCallback(async () => {
    await firebaseSignOut();
    setSyncStatus('idle');
  }, []);

  const triggerSync = useCallback(async () => {
    if (user && isOnline()) {
      setSyncStatus('syncing');
      const result = await forceSync(user.uid);
      setSyncStatus(result.status);
    } else if (!isOnline()) {
      setSyncStatus('offline');
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        syncStatus,
        isConfigured,
        signInGoogle,
        signInEmail,
        signUpEmail,
        logout,
        triggerSync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
