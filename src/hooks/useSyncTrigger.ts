import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { touchAppState } from '@/lib/appState';
import { debouncedSync, isOnline } from '@/lib/sync';

export function useSyncTrigger() {
  const { user } = useAuth();

  const triggerSync = useCallback(() => {
    // Always touch the app state to update timestamp
    touchAppState();
    
    // If user is logged in and online, trigger debounced sync
    if (user && isOnline()) {
      debouncedSync(user.uid);
    }
  }, [user]);

  return triggerSync;
}
