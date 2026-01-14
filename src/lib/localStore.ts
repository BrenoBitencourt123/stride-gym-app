// src/lib/localStore.ts
// Basic localStorage utilities - shared by storage.ts and appState.ts
// This file exists to prevent circular dependencies

// ============= STORAGE KEYS =============

export const STORAGE_KEYS = {
  PROFILE: "levelup.profile",
  QUESTS: "levelup.quests",
  TREINO_PROGRESSO: "levelup.treinoProgresso",
  NUTRITION_GOALS: "levelup.nutrition.goals",
  NUTRITION_DIET: "levelup.nutrition.diet",
  NUTRITION_TODAY: "levelup.nutrition.today",
  NUTRITION_COMPLETED: "levelup.nutritionCompleted",
  NUTRITION_LOGS: "levelup.nutritionLogs",
  EXERCISE_HISTORY: "levelup.exerciseHistory",
  WEIGHT_HISTORY: "levelup.weightHistory",
  WORKOUTS_COMPLETED: "levelup.workoutsCompleted",
  USER_WORKOUT_PLAN: "levelup.userWorkoutPlan",
  PROGRESSION_SUGGESTIONS: "levelup.progressionSuggestions",
  TREINO_HOJE: "levelup.treinoHoje",
  APP_STATE: "levelup.appState",
} as const;

export const APP_STATE_KEY = STORAGE_KEYS.APP_STATE;
export const APP_STATE_VERSION = 1;

// ============= BASE LOAD/SAVE FUNCTIONS =============

export function load<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return defaultValue;
    return JSON.parse(item) as T;
  } catch {
    return defaultValue;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

export function mergeSave<T extends object>(key: string, partial: Partial<T>, defaultValue: T): T {
  const current = load<T>(key, defaultValue);
  const merged = { ...current, ...partial };
  save(key, merged);
  return merged;
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

// ============= GLOBAL CHANGE EVENT =============

export const CHANGE_EVENT = "levelup:changed";

export function emitChange(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Legacy event for compatibility
export const APPSTATE_CHANGED_EVENT = "levelup:appstate-changed";

export function emitAppStateChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APPSTATE_CHANGED_EVENT));
}

// ============= DEV MODE BYPASS (DEPRECATED) =============
// These functions are kept for backwards compatibility but are no longer used
// Firebase is now the single source of truth

const DEV_MODE_KEY = "levelup.devModeBypass";

export function setDevModeBypass(enabled: boolean): void {
  if (enabled) {
    localStorage.setItem(DEV_MODE_KEY, "true");
  } else {
    localStorage.removeItem(DEV_MODE_KEY);
  }
}

export function isDevModeBypass(): boolean {
  return localStorage.getItem(DEV_MODE_KEY) === "true";
}
