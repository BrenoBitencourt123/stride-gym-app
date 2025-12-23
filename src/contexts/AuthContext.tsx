import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { 
  signInWithGoogle, 
  signInWithEmail, 
  signUpWithEmail, 
  firebaseSignOut, 
  onAuthChange,
  isFirebaseConfigured,
  type User 
} from '@/services/firebase';
import { syncState, forceSync, isOnline, type SyncStatus } from '@/lib/sync';

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

  useEffect(() => {
    const handleOnline = () => {
      if (user) {
        setSyncStatus('pending');
        syncState(user.uid).then(result => setSyncStatus(result.status));
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
  }, [user]);

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (firebaseUser && isOnline()) {
        setSyncStatus('syncing');
        syncState(firebaseUser.uid).then(result => setSyncStatus(result.status));
      }
    });

    return unsubscribe;
  }, []);

  const signInGoogle = useCallback(async () => {
    const firebaseUser = await signInWithGoogle();
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await syncState(firebaseUser.uid);
      setSyncStatus(result.status);
    }
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    const firebaseUser = await signInWithEmail(email, password);
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await syncState(firebaseUser.uid);
      setSyncStatus(result.status);
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string) => {
    const firebaseUser = await signUpWithEmail(email, password);
    if (firebaseUser) {
      setSyncStatus('syncing');
      const result = await syncState(firebaseUser.uid);
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
