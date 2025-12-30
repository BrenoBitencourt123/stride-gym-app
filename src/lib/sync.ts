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
      // No remote state - this is a NEW user or first sync
      // Check if local state has ANY user data worth preserving
      const hasSignificantData = local.workoutHistory.length > 0 || 
        Object.keys(local.exerciseHistory).length > 0 ||
        local.bodyweight.entries.length > 0 ||
        (local.plan && local.plan.workouts && local.plan.workouts.length > 0) || // IMPORTANT: preserve workout plan!
        (local.treinoProgresso && Object.keys(local.treinoProgresso).length > 0);
      
      if (hasSignificantData) {
        // Push existing local data to cloud
        const success = await setRemoteState(uid, local);
        if (success) {
          return { status: 'synced', message: 'Dados enviados para a nuvem' };
        }
        return { status: 'error', message: 'Erro ao enviar dados' };
      } else {
        // Truly new user with no data - initialize fresh state but KEEP any existing plan
        const newState = createNewUserState();
        // Preserve any existing workout plan from local
        if (local.plan && local.plan.workouts && local.plan.workouts.length > 0) {
          newState.plan = local.plan;
        }
        setLocalState(newState);
        const success = await setRemoteState(uid, newState);
        if (success) {
          return { status: 'synced', message: 'Conta inicializada' };
        }
        return { status: 'error', message: 'Erro ao enviar dados' };
      }
    }
    
    // Compare updatedAt
    const localTime = local.updatedAt || 0;
    const remoteTime = remote.updatedAt || 0;
    
    // Check if local has a workout plan that remote doesn't have
    const localHasPlan = local.plan && local.plan.workouts && local.plan.workouts.length > 0;
    const remoteHasPlan = remote.plan && remote.plan.workouts && remote.plan.workouts.length > 0;
    
    if (localTime > remoteTime) {
      // Local is newer - push to remote
      const success = await setRemoteState(uid, local);
      if (success) {
        return { status: 'synced', message: 'Dados atualizados na nuvem' };
      }
      return { status: 'error', message: 'Erro ao atualizar nuvem' };
    } else if (remoteTime > localTime) {
      // Remote is newer - pull to local BUT preserve local workout plan if remote has none
      const mergedState = { ...remote };
      
      // CRITICAL: If local has a plan but remote doesn't, preserve the local plan
      if (localHasPlan && !remoteHasPlan) {
        mergedState.plan = local.plan;
        mergedState.updatedAt = Date.now();
        // Also preserve workout progress tied to the plan
        if (local.treinoProgresso && Object.keys(local.treinoProgresso).length > 0) {
          mergedState.treinoProgresso = local.treinoProgresso;
        }
        // Push merged state back to remote
        await setRemoteState(uid, mergedState);
      }
      
      setLocalState(mergedState);
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
