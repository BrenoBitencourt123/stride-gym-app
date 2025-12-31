import { useCallback } from 'react';
import { emitChange } from '@/lib/localStore';

// Simplified sync trigger - just emits the change event
// The actual sync is handled centrally in AuthContext
export function useSyncTrigger() {
  const triggerSync = useCallback(() => {
    emitChange();
  }, []);

  return triggerSync;
}
