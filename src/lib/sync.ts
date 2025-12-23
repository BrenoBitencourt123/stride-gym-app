// Sync logic for local-first with cloud backup

import { getRemoteState, setRemoteState, isFirebaseConfigured } from '@/services/firebase';
import { getLocalState, setLocalState, createNewUserState, AppState } from './appState';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'pending' | 'offline' | 'error';

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 800;

// Check if online
export function isOnline(): boolean {
  return navigator.onLine;
}

// Main sync function
export async function syncState(uid: string): Promise<{ status: SyncStatus; message: string }> {
  if (!isFirebaseConfigured()) {
    return { status: 'offline', message: 'Firebase não configurado' };
  }
  
  if (!isOnline()) {
    return { status: 'offline', message: 'Sem conexão' };
  }
  
  try {
    const local = getLocalState();
    const remote = await getRemoteState(uid) as AppState | null;
    
    if (!remote) {
      // No remote state - this is a NEW user
      // Check if local state is "fresh" (migrated from legacy or default)
      // If local has significant data, push it; otherwise initialize fresh
      const hasSignificantData = local.workoutHistory.length > 0 || 
        Object.keys(local.exerciseHistory).length > 0 ||
        local.bodyweight.entries.length > 0;
      
      if (hasSignificantData) {
        // Push existing local data
        const success = await setRemoteState(uid, local);
        if (success) {
          return { status: 'synced', message: 'Dados enviados para a nuvem' };
        }
      } else {
        // Initialize new user with Level 1
        const newState = createNewUserState();
        setLocalState(newState);
        const success = await setRemoteState(uid, newState);
        if (success) {
          return { status: 'synced', message: 'Conta inicializada' };
        }
      }
      return { status: 'error', message: 'Erro ao enviar dados' };
    }
    
    // Compare updatedAt
    const localTime = local.updatedAt || 0;
    const remoteTime = remote.updatedAt || 0;
    
    if (localTime > remoteTime) {
      // Local is newer - push to remote
      const success = await setRemoteState(uid, local);
      if (success) {
        return { status: 'synced', message: 'Dados atualizados na nuvem' };
      }
      return { status: 'error', message: 'Erro ao atualizar nuvem' };
    } else if (remoteTime > localTime) {
      // Remote is newer - pull to local
      setLocalState(remote);
      return { status: 'synced', message: 'Dados atualizados do servidor' };
    }
    
    // Same timestamp - already synced
    return { status: 'synced', message: 'Sincronizado' };
  } catch (error) {
    console.error('Sync error:', error);
    return { status: 'error', message: 'Erro de sincronização' };
  }
}

// Debounced sync - called after important actions
export function debouncedSync(uid: string, onStatusChange?: (status: SyncStatus) => void): void {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }
  
  onStatusChange?.('pending');
  
  syncDebounceTimer = setTimeout(async () => {
    onStatusChange?.('syncing');
    const result = await syncState(uid);
    onStatusChange?.(result.status);
  }, SYNC_DEBOUNCE_MS);
}

// Force immediate sync
export async function forceSync(uid: string): Promise<{ status: SyncStatus; message: string }> {
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  return syncState(uid);
}
