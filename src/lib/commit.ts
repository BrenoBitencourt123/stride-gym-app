// src/lib/commit.ts
// Centralized commit layer - updates AppState and emits global change event
// This ensures all mutations are properly synced to cloud

import { 
  load, 
  save, 
  STORAGE_KEYS, 
  APP_STATE_KEY, 
  emitChange 
} from "./localStore";
import type { 
  NutritionGoals, 
  NutritionDiet, 
  NutritionToday, 
  Quests, 
  TreinoProgresso, 
  TreinoHoje,
  Profile,
  WeightEntry,
  WorkoutCompleted,
  ExerciseHistoryData,
  ProgressionSuggestions,
  UserWorkoutPlan,
} from "./storage";

// ============= TYPES =============

export interface NutritionTotalsLog {
  dateKey: string;
  kcal: number;
  p: number;
  c: number;
  g: number;
}

// ============= HELPER: PATCH APP STATE =============

function patchAppState(mutator: (state: any) => void): void {
  try {
    const raw = localStorage.getItem(APP_STATE_KEY);
    if (!raw) return;
    
    const state = JSON.parse(raw);
    mutator(state);
    state.updatedAt = Date.now();
    
    localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("[commit] patchAppState failed:", error);
  }
}

// ============= NUTRITION COMMITS =============

export function commitNutritionGoals(goals: NutritionGoals): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.NUTRITION_GOALS, goals);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.nutrition) state.nutrition = { targets: {}, dailyLogs: {} };
    state.nutrition.targets = {
      kcal: Number(goals.kcalTarget ?? 2050),
      protein: Number(goals.pTarget ?? 160),
      carbs: Number(goals.cTarget ?? 200),
      fats: Number(goals.gTarget ?? 65),
    };
  });
  
  // 3. Emit change event for sync
  emitChange();
}

export function commitNutritionDiet(diet: NutritionDiet): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.NUTRITION_DIET, diet);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.nutrition) state.nutrition = { targets: {}, dailyLogs: {} };
    state.nutrition.dietPlan = diet;
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitNutritionToday(today: NutritionToday): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.NUTRITION_TODAY, today);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.nutrition) state.nutrition = { targets: {}, dailyLogs: {} };
    if (!state.nutrition.dailyLogs) state.nutrition.dailyLogs = {};
    if (today?.dateKey) {
      state.nutrition.dailyLogs[today.dateKey] = today;
    }
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitNutritionTotalsLog(log: NutritionTotalsLog): void {
  // 1. Save to legacy logs array
  const logs = load<NutritionTotalsLog[]>(STORAGE_KEYS.NUTRITION_LOGS, []);
  const existing = logs.findIndex((l) => l.dateKey === log.dateKey);
  if (existing >= 0) {
    logs[existing] = log;
  } else {
    logs.push(log);
  }
  save(STORAGE_KEYS.NUTRITION_LOGS, logs);
  
  // 2. Patch AppState (add totalsLogs)
  patchAppState((state) => {
    if (!state.nutrition) state.nutrition = { targets: {}, dailyLogs: {} };
    if (!state.nutrition.totalsLogs) state.nutrition.totalsLogs = [];
    
    const idx = state.nutrition.totalsLogs.findIndex((l: NutritionTotalsLog) => l.dateKey === log.dateKey);
    if (idx >= 0) {
      state.nutrition.totalsLogs[idx] = log;
    } else {
      state.nutrition.totalsLogs.push(log);
    }
    
    // Keep only last 90 days
    if (state.nutrition.totalsLogs.length > 90) {
      state.nutrition.totalsLogs = state.nutrition.totalsLogs.slice(-90);
    }
  });
  
  // 3. Emit change event
  emitChange();
}

// ============= PROFILE & QUESTS COMMITS =============

export function commitProfile(profile: Profile): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.PROFILE, profile);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.progression) state.progression = {};
    state.progression.accountLevel = Number(profile.level ?? 1);
    state.progression.xp = Number(profile.xpAtual ?? 0);
    state.progression.xpToNext = Number(profile.xpMeta ?? 500);
    state.progression.streakDays = Number(profile.streakDias ?? 0);
    state.progression.multiplier = Number(profile.multiplier ?? 1);
    state.progression.shields = Number(profile.shields ?? 0);
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitQuests(quests: Quests): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.QUESTS, quests);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.quests = quests;
  });
  
  // 3. Emit change event
  emitChange();
}

// ============= TREINO COMMITS =============

export function commitTreinoProgresso(progresso: TreinoProgresso): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.TREINO_PROGRESSO, progresso);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.treinoProgresso = progresso;
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitTreinoHoje(treino: TreinoHoje | null): void {
  // 1. Save to legacy key
  if (treino) {
    save(STORAGE_KEYS.TREINO_HOJE, treino);
  } else {
    try {
      localStorage.removeItem(STORAGE_KEYS.TREINO_HOJE);
    } catch {
      // ignore
    }
  }
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.treinoHoje = treino;
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitWorkoutPlan(plan: UserWorkoutPlan): void {
  // 1. Save to legacy key
  plan.updatedAt = new Date().toISOString();
  save(STORAGE_KEYS.USER_WORKOUT_PLAN, plan);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.plan = plan;
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitProgressionSuggestions(suggestions: ProgressionSuggestions): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, suggestions);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.progressionSuggestions = suggestions;
  });
  
  // 3. Emit change event
  emitChange();
}

// ============= WEIGHT COMMITS =============

export function commitWeightEntry(weight: number): void {
  // 1. Load and update legacy history
  const history = load<WeightEntry[]>(STORAGE_KEYS.WEIGHT_HISTORY, []);
  const newEntry: WeightEntry = {
    weight,
    timestamp: new Date().toISOString(),
  };
  history.push(newEntry);
  save(STORAGE_KEYS.WEIGHT_HISTORY, history);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.bodyweight) state.bodyweight = { entries: [] };
    state.bodyweight.entries.push({
      date: newEntry.timestamp.split("T")[0],
      weight: newEntry.weight,
      updatedAt: Date.now(),
    });
  });
  
  // 3. Emit change event
  emitChange();
}

// ============= WORKOUT HISTORY COMMITS =============

export function commitWorkoutCompleted(completed: WorkoutCompleted): void {
  // 1. Load and update legacy history
  const history = load<WorkoutCompleted[]>(STORAGE_KEYS.WORKOUTS_COMPLETED, []);
  history.push(completed);
  save(STORAGE_KEYS.WORKOUTS_COMPLETED, history);
  
  // 2. Patch AppState
  patchAppState((state) => {
    if (!state.workoutHistory) state.workoutHistory = [];
    state.workoutHistory.push(completed);
  });
  
  // 3. Emit change event
  emitChange();
}

export function commitExerciseHistory(history: ExerciseHistoryData): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.EXERCISE_HISTORY, history);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.exerciseHistory = history;
  });
  
  // 3. Emit change event
  emitChange();
}

// ============= NUTRITION COMPLETED COMMITS =============

export function commitNutritionCompleted(completed: Record<string, boolean>): void {
  // 1. Save to legacy key
  save(STORAGE_KEYS.NUTRITION_COMPLETED, completed);
  
  // 2. Patch AppState
  patchAppState((state) => {
    state.nutritionCompleted = completed;
  });
  
  // 3. Emit change event
  emitChange();
}
