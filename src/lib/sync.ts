// src/lib/sync.ts
// Sync logic for local-first with cloud backup

import { getRemoteState, setRemoteState, isFirebaseConfigured } from "@/services/firebase";
import { getLocalState, setLocalState, createNewUserState, AppState } from "./appState";

export type SyncStatus = "idle" | "syncing" | "synced" | "pending" | "offline" | "error";

let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
const SYNC_DEBOUNCE_MS = 800;

export function isOnline(): boolean {
  return navigator.onLine;
}

// Main sync function
export async function syncState(uid: string): Promise<{ status: SyncStatus; message: string }> {
  if (!isFirebaseConfigured()) {
    return { status: "offline", message: "Firebase não configurado" };
  }

  if (!isOnline()) {
    return { status: "offline", message: "Sem conexão" };
  }

  try {
    const local = getLocalState(); // ✅ already hydrated with legacy nutrition/plan now
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
        if (success) {
          return { status: "synced", message: "Dados enviados para a nuvem" };
        }
        return { status: "error", message: "Erro ao enviar dados" };
      } else {
        const newState = createNewUserState();

        // Preserve local plan if exists
        if (local.plan && local.plan.workouts && local.plan.workouts.length > 0) {
          newState.plan = local.plan;
        }

        // Preserve local nutrition if exists
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
      if (success) {
        return { status: "synced", message: "Dados atualizados na nuvem" };
      }
      return { status: "error", message: "Erro ao atualizar nuvem" };
    } else if (remoteTime > localTime) {
      // Remote is newer - pull to local BUT preserve local plan/nutrition if remote lacks
      const mergedState: AppState = { ...remote };

      let didPreserveLocal = false;

      // Preserve plan
      if (localHasPlan && !remoteHasPlan) {
        mergedState.plan = local.plan;
        didPreserveLocal = true;

        // Preserve treinoProgresso linked to the plan
        if (local.treinoProgresso && Object.keys(local.treinoProgresso).length > 0) {
          mergedState.treinoProgresso = local.treinoProgresso;
        }
      }

      // Ensure nutrition exists
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

      // Preserve nutrition targets/diet/dailyLogs if remote doesn't have
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
      return { status: "synced", message: "Dados atualizados do servidor" };
    }

    return { status: "synced", message: "Sincronizado" };
  } catch (error) {
    console.error("Sync error:", error);
    return { status: "error", message: "Erro de sincronização" };
  }
}

// Debounced sync - called after important actions
export function debouncedSync(uid: string, onStatusChange?: (status: SyncStatus) => void): void {
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
  if (syncDebounceTimer) {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }
  return syncState(uid);
}
