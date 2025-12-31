// src/lib/sync.ts
// Sync logic for local-first with cloud backup
// Includes anti-loop protections: inFlight flag, cooldown, uid validation

import { getRemoteState, setRemoteState, isFirebaseConfigured } from "@/services/firebase";
import { getLocalState, setLocalState, createNewUserState, AppState } from "./appState";

export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "offline" | "error";

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 2000; // Increased from 800ms to reduce frequency

// Anti-loop protections
let inFlight = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN_MS = 3000; // Minimum 3 seconds between syncs

export function isOnline(): boolean {
  return navigator.onLine;
}

// Main sync function with protections
export async function syncState(uid: string): Promise<{ status: SyncStatus; message: string }> {
  // Validation: uid must exist
  if (!uid) {
    return { status: "idle", message: "Sem usuário" };
  }

  if (!isFirebaseConfigured()) {
    return { status: "offline", message: "Firebase não configurado" };
  }

  if (!isOnline()) {
    return { status: "offline", message: "Sem conexão" };
  }

  // Anti-loop: check if sync is already in progress
  if (inFlight) {
    return { status: "pending", message: "Sincronização em andamento" };
  }

  // Anti-loop: enforce cooldown
  const now = Date.now();
  if (now - lastSyncTime < SYNC_COOLDOWN_MS) {
    return { status: "pending", message: "Aguarde antes de sincronizar novamente" };
  }

  inFlight = true;
  lastSyncTime = now;

  try {
    const local = getLocalState();
    const remote = (await getRemoteState(uid)) as AppState | null;

    if (!remote) {
      // No remote state - NEW user or first sync
      const localHasDiet = !!local.nutrition?.dietPlan;
      const localHasDaily = !!local.nutrition?.dailyLogs && Object.keys(local.nutrition.dailyLogs).length > 0;

      const hasSignificantData =
        local.workoutHistory.length > 0 ||
        Object.keys(local.exerciseHistory).length > 0 ||
        local.bodyweight.entries.length > 0 ||
        (local.plan && local.plan.workouts && local.plan.workouts.length > 0) ||
        (local.treinoProgresso && Object.keys(local.treinoProgresso).length > 0) ||
        localHasDiet ||
        localHasDaily;

      if (hasSignificantData) {
        const success = await setRemoteState(uid, local);
        inFlight = false;
        if (success) {
          return { status: "synced", message: "Dados enviados para a nuvem" };
        }
        return { status: "error", message: "Erro ao enviar dados" };
      } else {
        const newState = createNewUserState();

        if (local.plan && local.plan.workouts && local.plan.workouts.length > 0) {
          newState.plan = local.plan;
        }
        if (local.nutrition?.dietPlan) {
          newState.nutrition.dietPlan = local.nutrition.dietPlan;
        }
        if (local.nutrition?.targets) {
          newState.nutrition.targets = local.nutrition.targets;
        }
        if (local.nutrition?.dailyLogs && Object.keys(local.nutrition.dailyLogs).length > 0) {
          newState.nutrition.dailyLogs = local.nutrition.dailyLogs;
        }

        setLocalState(newState);

        const success = await setRemoteState(uid, newState);
        inFlight = false;
        if (success) {
          return { status: "synced", message: "Conta inicializada" };
        }
        return { status: "error", message: "Erro ao enviar dados" };
      }
    }

    const localTime = local.updatedAt || 0;
    const remoteTime = remote.updatedAt || 0;

    const localHasPlan = !!(local.plan && local.plan.workouts && local.plan.workouts.length > 0);
    const remoteHasPlan = !!(remote.plan && remote.plan.workouts && remote.plan.workouts.length > 0);

    const localHasDiet = !!local.nutrition?.dietPlan;
    const remoteHasDiet = !!remote.nutrition?.dietPlan;

    const localHasTargets = !!local.nutrition?.targets;
    const remoteHasTargets = !!remote.nutrition?.targets;

    const localHasDaily = !!local.nutrition?.dailyLogs && Object.keys(local.nutrition.dailyLogs).length > 0;
    const remoteHasDaily = !!remote.nutrition?.dailyLogs && Object.keys(remote.nutrition.dailyLogs).length > 0;

    if (localTime > remoteTime) {
      const success = await setRemoteState(uid, local);
      inFlight = false;
      if (success) {
        return { status: "synced", message: "Dados atualizados na nuvem" };
      }
      return { status: "error", message: "Erro ao atualizar nuvem" };
    } else if (remoteTime > localTime) {
      const mergedState: AppState = { ...remote };

      let didPreserveLocal = false;

      if (localHasPlan && !remoteHasPlan) {
        mergedState.plan = local.plan;
        didPreserveLocal = true;

        if (local.treinoProgresso && Object.keys(local.treinoProgresso).length > 0) {
          mergedState.treinoProgresso = local.treinoProgresso;
        }
      }

      if (!mergedState.nutrition) {
        mergedState.nutrition = {
          targets: { kcal: 2050, protein: 160, carbs: 200, fats: 65 },
          dailyLogs: {},
        };
      }
      if (!mergedState.nutrition.targets) {
        mergedState.nutrition.targets = { kcal: 2050, protein: 160, carbs: 200, fats: 65 };
      }
      if (!mergedState.nutrition.dailyLogs) {
        mergedState.nutrition.dailyLogs = {};
      }

      if (localHasTargets && !remoteHasTargets) {
        mergedState.nutrition.targets = local.nutrition.targets;
        didPreserveLocal = true;
      }
      if (localHasDiet && !remoteHasDiet) {
        mergedState.nutrition.dietPlan = local.nutrition.dietPlan;
        didPreserveLocal = true;
      }
      if (localHasDaily && !remoteHasDaily) {
        mergedState.nutrition.dailyLogs = {
          ...(mergedState.nutrition.dailyLogs || {}),
          ...(local.nutrition.dailyLogs || {}),
        };
        didPreserveLocal = true;
      }

      if (didPreserveLocal) {
        mergedState.updatedAt = Date.now();
        await setRemoteState(uid, mergedState);
      }

      setLocalState(mergedState);
      inFlight = false;
      return { status: "synced", message: "Dados atualizados do servidor" };
    }

    inFlight = false;
    return { status: "synced", message: "Sincronizado" };
  } catch (error) {
    console.error("Sync error:", error);
    inFlight = false;
    return { status: "error", message: "Erro de sincronização" };
  }
}

// Debounced sync - called after important actions
export function debouncedSync(uid: string, onStatusChange?: (status: SyncStatus) => void): void {
  if (!uid) return;
  
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
  }

  onStatusChange?.("pending");

  syncDebounceTimer = setTimeout(async () => {
    onStatusChange?.("syncing");
    const result = await syncState(uid);
    onStatusChange?.(result.status);
  }, SYNC_DEBOUNCE_MS);
}

// Force immediate sync
export async function forceSync(uid: string): Promise<{ status: SyncStatus; message: string }> {
  if (!uid) {
    return { status: "idle", message: "Sem usuário" };
  }
  
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  
  // Reset cooldown for forced sync
  lastSyncTime = 0;
  inFlight = false;
  
  return syncState(uid);
}
