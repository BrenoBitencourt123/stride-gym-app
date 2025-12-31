// ======= GLOBAL SYNC/HYDRATION HELPERS =======

const APP_STATE_KEY = "levelup.appState";
const APPSTATE_CHANGED_EVENT = "levelup:appstate-changed";
const SUPPRESS_AUTOSYNC_FLAG = "__LEVELUP_SUPPRESS_AUTOSYNC__";

let hydrationSuppressed = false;

/**
 * Use isso quando o AppState estiver escrevendo as keys legadas,
 * para não entrar em loop de "legado -> hidrata AppState -> legado..."
 */
export function suppressAppStateHydration<T>(fn: () => T): T {
  hydrationSuppressed = true;
  try {
    return fn();
  } finally {
    hydrationSuppressed = false;
  }
}

function emitAppStateChanged() {
  if (typeof window === "undefined") return;
  if ((globalThis as any)[SUPPRESS_AUTOSYNC_FLAG]) return;
  window.dispatchEvent(new CustomEvent(APPSTATE_CHANGED_EVENT));
}

// fila pra agrupar várias saves seguidas em 1 hidratação só
const hydrationQueue = new Map<string, unknown>();
let hydrationScheduled = false;
let hydrationRunning = false;

function scheduleHydrateAppState(key: string, value: unknown) {
  if (hydrationSuppressed) return;

  // Só keys que precisamos refletir no AppState
  const shouldHydrate =
    key === STORAGE_KEYS.NUTRITION_GOALS ||
    key === STORAGE_KEYS.NUTRITION_DIET ||
    key === STORAGE_KEYS.NUTRITION_TODAY ||
    key === STORAGE_KEYS.PROFILE ||
    key === STORAGE_KEYS.QUESTS ||
    key === STORAGE_KEYS.TREINO_PROGRESSO ||
    key === STORAGE_KEYS.EXERCISE_HISTORY ||
    key === STORAGE_KEYS.WEIGHT_HISTORY ||
    key === STORAGE_KEYS.WORKOUTS_COMPLETED ||
    key === STORAGE_KEYS.USER_WORKOUT_PLAN ||
    key === STORAGE_KEYS.PROGRESSION_SUGGESTIONS ||
    key === STORAGE_KEYS.TREINO_HOJE ||
    key === STORAGE_KEYS.NUTRITION_COMPLETED ||
    key === "levelup.nutritionLogs";

  if (!shouldHydrate) return;

  hydrationQueue.set(key, value);

  if (hydrationScheduled) return;
  hydrationScheduled = true;

  queueMicrotask(async () => {
    hydrationScheduled = false;
    if (hydrationRunning) return;
    hydrationRunning = true;

    try {
      const { getLocalState, setLocalState } = await import("./appState");
      const state = getLocalState();

      let changed = false;

      for (const [k, v] of hydrationQueue.entries()) {
        // NUTRITION GOALS -> AppState.nutrition.targets
        if (k === STORAGE_KEYS.NUTRITION_GOALS && v && typeof v === "object") {
          const gg: any = v;
          state.nutrition.targets = {
            kcal: Number(gg.kcalTarget ?? state.nutrition.targets.kcal),
            protein: Number(gg.pTarget ?? state.nutrition.targets.protein),
            carbs: Number(gg.cTarget ?? state.nutrition.targets.carbs),
            fats: Number(gg.gTarget ?? state.nutrition.targets.fats),
          };
          changed = true;
        }

        // NUTRITION DIET -> AppState.nutrition.dietPlan
        if (k === STORAGE_KEYS.NUTRITION_DIET) {
          state.nutrition.dietPlan = (v as any) || undefined;
          changed = true;
        }

        // NUTRITION TODAY -> AppState.nutrition.dailyLogs[dateKey]
        if (k === STORAGE_KEYS.NUTRITION_TODAY && v && typeof v === "object") {
          const tt: any = v;
          if (tt.dateKey) {
            state.nutrition.dailyLogs[tt.dateKey] = tt;
            changed = true;
          }
        }

        // Logs (gráficos)
        if (k === "levelup.nutritionLogs" && Array.isArray(v)) {
          state.nutrition.totalsLogs = v as any;
          changed = true;
        }

        // Restante (mantém seu comportamento atual)
        if (k === STORAGE_KEYS.USER_WORKOUT_PLAN) {
          state.plan = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.TREINO_PROGRESSO) {
          state.treinoProgresso = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.QUESTS) {
          state.quests = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.PROGRESSION_SUGGESTIONS) {
          state.progressionSuggestions = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.WORKOUTS_COMPLETED) {
          state.workoutHistory = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.EXERCISE_HISTORY) {
          state.exerciseHistory = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.WEIGHT_HISTORY && Array.isArray(v)) {
          state.bodyweight.entries = (v as any[]).map((w) => ({
            date: String(w.timestamp || "").split("T")[0] || String(w.date || ""),
            weight: Number(w.weight ?? 0),
            updatedAt: w.timestamp ? new Date(w.timestamp).getTime() : Date.now(),
          }));
          changed = true;
        }
        if (k === STORAGE_KEYS.PROFILE && v && typeof v === "object") {
          const pp: any = v;
          state.progression.accountLevel = Number(pp.level ?? state.progression.accountLevel);
          state.progression.xp = Number(pp.xpAtual ?? state.progression.xp);
          state.progression.xpToNext = Number(pp.xpMeta ?? state.progression.xpToNext);
          state.progression.streakDays = Number(pp.streakDias ?? state.progression.streakDays);
          state.progression.multiplier = Number(pp.multiplier ?? state.progression.multiplier);
          state.progression.shields = Number(pp.shields ?? state.progression.shields);
          changed = true;
        }
        if (k === STORAGE_KEYS.TREINO_HOJE) {
          (state as any).treinoHoje = v as any;
          changed = true;
        }
        if (k === STORAGE_KEYS.NUTRITION_COMPLETED) {
          (state as any).nutritionCompleted = v as any;
          changed = true;
        }
      }

      hydrationQueue.clear();

      if (changed) {
        setLocalState(state);
      }
    } catch (err) {
      console.warn("[storage] hydrateAppState failed:", err);
      hydrationQueue.clear();
    } finally {
      hydrationRunning = false;
    }
  });
}

function afterLocalSave(key: string, value: unknown) {
  // Quando AppState muda, avisa o sync
  if (key === APP_STATE_KEY) {
    emitAppStateChanged();
    return;
  }

  // Quando muda key legada, hidrata AppState (nutrição/treino/etc)
  scheduleHydrateAppState(key, value);
}
