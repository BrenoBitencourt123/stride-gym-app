// Centralized AppState type and migration logic

import { 
  STORAGE_KEYS,
  load,
  save,
} from './storage';

// ============= SET DATA TYPE =============

export interface SetData {
  kg: number;
  reps: number;
}

// ============= TYPES =============

export interface SetProgress {
  kg: number;
  reps: number;
  done: boolean;
}

export interface ExerciseProgress {
  warmupDone: boolean;
  feederSets: SetProgress[];
  workSets: SetProgress[];
  updatedAt: string;
}

export interface TreinoProgresso {
  [treinoId: string]: {
    [exercicioId: string]: ExerciseProgress;
  };
}

export interface Profile {
  xpAtual: number;
  xpMeta: number;
  level: number;
  streakDias: number;
  multiplier: number;
  shields: number;
}

export interface Quests {
  treinoDoDiaDone: boolean;
  registrarAlimentacaoDone: boolean;
  registrarPesoDone: boolean;
}

export interface NutritionGoals {
  kcalTarget: number;
  pTarget: number;
  cTarget: number;
  gTarget: number;
}

export interface DietEntry {
  foodId: string;
  quantidade: number;
  unidade: "g" | "un" | "ml" | "scoop";
}

export interface DietMeal {
  id: string;
  nome: string;
  items: DietEntry[];
}

export interface NutritionDiet {
  meals: DietMeal[];
}

export interface TodayEntry {
  id: string;
  foodId: string;
  quantidade: number;
  unidade: "g" | "un" | "ml" | "scoop";
  source: "diet" | "extra" | "auto";
  createdAt: number;
  planned: boolean;
  consumed: boolean;
}

export interface TodayMeal {
  id: string;
  nome: string;
  entries: TodayEntry[];
}

export interface NutritionToday {
  dateKey: string;
  meals: TodayMeal[];
}

export interface ExerciseSetSnapshot {
  kg: number;
  reps: number;
}

export interface ExerciseSnapshot {
  exerciseId: string;
  workoutId: string;
  repsRange: string;
  workSets: ExerciseSetSnapshot[];
  timestamp: string;
}

export interface ExerciseHistoryData {
  [exerciseId: string]: ExerciseSnapshot[];
}

export interface UserExercise {
  id: string;
  nome: string;
  muscleGroup: string;
  tags: string[];
  repsRange: string;
  descansoSeg: number;
  warmupEnabled: boolean;
  feederSetsDefault: SetData[];
  workSetsDefault: SetData[];
  observacoes?: string;
}

export interface UserWorkout {
  id: string;
  titulo: string;
  duracaoEstimada: number;
  exercicios: UserExercise[];
}

export interface UserWorkoutPlan {
  workouts: UserWorkout[];
  updatedAt: string;
}

export interface WeightEntry {
  weight: number;
  timestamp: string;
}

export interface WorkoutCompleted {
  workoutId: string;
  timestamp: string;
  totalVolume: number;
}

export interface ProgressionSuggestions {
  [exerciseId: string]: {
    suggestedNextLoad: number;
    appliedAt: string;
  };
}

// ============= APP STATE TYPE =============

export interface AppStateProfile {
  displayName: string;
  photoURL?: string;
  goal?: string;
}

export interface AppStateProgression {
  accountLevel: number;
  xp: number;
  xpToNext: number;
  streakDays: number;
  shields: number;
  multiplier: number;
}

export interface AppStateNutrition {
  targets: { kcal: number; protein: number; carbs: number; fats: number };
  dietPlan?: NutritionDiet;
  dailyLogs: Record<string, NutritionToday>;
}

export interface AppStateBodyweight {
  entries: { date: string; weight: number; updatedAt: number }[];
}

export interface AppStateAchievements {
  unlocked: string[];
  updatedAt: number;
}

// Weekly workout completions
export interface WeeklyWorkoutCompletion {
  completedAt: string;
  xpGained: number;
  setsCompleted: number;
  totalVolume: number;
}

export interface WeeklyCompletions {
  [weekStart: string]: {
    [workoutId: string]: WeeklyWorkoutCompletion;
  };
}

export interface AppState {
  version: number;
  updatedAt: number;
  profile: AppStateProfile;
  progression: AppStateProgression;
  plan: UserWorkoutPlan;
  workoutHistory: WorkoutCompleted[];
  exerciseHistory: ExerciseHistoryData;
  nutrition: AppStateNutrition;
  bodyweight: AppStateBodyweight;
  achievements: AppStateAchievements;
  treinoProgresso?: TreinoProgresso;
  quests?: Quests;
  progressionSuggestions?: ProgressionSuggestions;
  weeklyCompletions?: WeeklyCompletions;
}

const APP_STATE_KEY = 'levelup.appState';
const APP_STATE_VERSION = 1;

// Default values for NEW users (start at Level 1)
const DEFAULT_PROFILE_NEW_USER: Profile = {
  xpAtual: 0,
  xpMeta: 500,
  level: 1,
  streakDias: 0,
  multiplier: 1.0,
  shields: 0,
};

// Legacy default (for migration)
const DEFAULT_PROFILE: Profile = {
  xpAtual: 1240,
  xpMeta: 1500,
  level: 12,
  streakDias: 6,
  multiplier: 1.2,
  shields: 2,
};

const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  kcalTarget: 2050,
  pTarget: 160,
  cTarget: 200,
  gTarget: 65,
};

// ============= MIGRATION =============

function migrateFromLegacy(): AppState {
  const profile = load<Profile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
  const nutritionGoals = load<NutritionGoals>(STORAGE_KEYS.NUTRITION_GOALS, DEFAULT_NUTRITION_GOALS);
  const nutritionDiet = load<NutritionDiet | null>(STORAGE_KEYS.NUTRITION_DIET, null);
  const nutritionToday = load<NutritionToday | null>(STORAGE_KEYS.NUTRITION_TODAY, null);
  const exerciseHistory = load<ExerciseHistoryData>(STORAGE_KEYS.EXERCISE_HISTORY, {});
  const weightHistory = load<WeightEntry[]>(STORAGE_KEYS.WEIGHT_HISTORY, []);
  const workoutsCompleted = load<WorkoutCompleted[]>(STORAGE_KEYS.WORKOUTS_COMPLETED, []);
  const treinoProgresso = load<TreinoProgresso>(STORAGE_KEYS.TREINO_PROGRESSO, {});
  const quests = load<Quests>(STORAGE_KEYS.QUESTS, { treinoDoDiaDone: false, registrarAlimentacaoDone: false, registrarPesoDone: false });
  const progressionSuggestions = load<ProgressionSuggestions>(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, {});
  const userPlan = load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null);

  const dailyLogs: Record<string, NutritionToday> = {};
  if (nutritionToday) {
    dailyLogs[nutritionToday.dateKey] = nutritionToday;
  }

  const defaultPlan: UserWorkoutPlan = userPlan || {
    workouts: [],
    updatedAt: new Date().toISOString(),
  };

  return {
    version: APP_STATE_VERSION,
    updatedAt: Date.now(),
    profile: {
      displayName: 'Atleta',
      photoURL: undefined,
      goal: undefined,
    },
    progression: {
      accountLevel: profile.level,
      xp: profile.xpAtual,
      xpToNext: profile.xpMeta,
      streakDays: profile.streakDias,
      shields: profile.shields,
      multiplier: profile.multiplier,
    },
    plan: defaultPlan,
    workoutHistory: workoutsCompleted,
    exerciseHistory,
    nutrition: {
      targets: {
        kcal: nutritionGoals.kcalTarget,
        protein: nutritionGoals.pTarget,
        carbs: nutritionGoals.cTarget,
        fats: nutritionGoals.gTarget,
      },
      dietPlan: nutritionDiet || undefined,
      dailyLogs,
    },
    bodyweight: {
      entries: weightHistory.map(w => ({
        date: w.timestamp.split('T')[0],
        weight: w.weight,
        updatedAt: new Date(w.timestamp).getTime(),
      })),
    },
    achievements: {
      unlocked: [],
      updatedAt: Date.now(),
    },
    treinoProgresso,
    quests,
    progressionSuggestions,
  };
}

// ============= LOCAL STATE FUNCTIONS =============

export function getLocalState(): AppState {
  const stored = load<AppState | null>(APP_STATE_KEY, null);
  
  if (stored && stored.version) {
    return stored;
  }
  
  const migrated = migrateFromLegacy();
  setLocalState(migrated);
  return migrated;
}

export function setLocalState(state: AppState): void {
  state.updatedAt = Date.now();
  save(APP_STATE_KEY, state);
  syncToLegacyKeys(state);
}

export function updateLocalState(patchFn: (state: AppState) => AppState): AppState {
  const current = getLocalState();
  const updated = patchFn(current);
  updated.updatedAt = Date.now();
  setLocalState(updated);
  return updated;
}

function syncToLegacyKeys(state: AppState): void {
  const profile: Profile = {
    xpAtual: state.progression.xp,
    xpMeta: state.progression.xpToNext,
    level: state.progression.accountLevel,
    streakDias: state.progression.streakDays,
    multiplier: state.progression.multiplier,
    shields: state.progression.shields,
  };
  save(STORAGE_KEYS.PROFILE, profile);
  
  const nutritionGoals: NutritionGoals = {
    kcalTarget: state.nutrition.targets.kcal,
    pTarget: state.nutrition.targets.protein,
    cTarget: state.nutrition.targets.carbs,
    gTarget: state.nutrition.targets.fats,
  };
  save(STORAGE_KEYS.NUTRITION_GOALS, nutritionGoals);
  
  if (state.nutrition.dietPlan) {
    save(STORAGE_KEYS.NUTRITION_DIET, state.nutrition.dietPlan);
  }
  
  const todayKey = new Date().toISOString().split('T')[0];
  if (state.nutrition.dailyLogs[todayKey]) {
    save(STORAGE_KEYS.NUTRITION_TODAY, state.nutrition.dailyLogs[todayKey]);
  }
  
  save(STORAGE_KEYS.EXERCISE_HISTORY, state.exerciseHistory);
  
  const weightHistory: WeightEntry[] = state.bodyweight.entries.map(e => ({
    weight: e.weight,
    timestamp: new Date(e.updatedAt).toISOString(),
  }));
  save(STORAGE_KEYS.WEIGHT_HISTORY, weightHistory);
  
  save(STORAGE_KEYS.WORKOUTS_COMPLETED, state.workoutHistory);
  save(STORAGE_KEYS.USER_WORKOUT_PLAN, state.plan);
  
  if (state.treinoProgresso) {
    save(STORAGE_KEYS.TREINO_PROGRESSO, state.treinoProgresso);
  }
  if (state.quests) {
    save(STORAGE_KEYS.QUESTS, state.quests);
  }
  if (state.progressionSuggestions) {
    save(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, state.progressionSuggestions);
  }
}

export function touchAppState(): void {
  const state = getLocalState();
  state.updatedAt = Date.now();
  save(APP_STATE_KEY, state);
}

export function exportAppState(): string {
  const state = getLocalState();
  return JSON.stringify(state, null, 2);
}

export function importAppState(jsonString: string): { success: boolean; error?: string } {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!parsed.version || typeof parsed.version !== 'number') {
      return { success: false, error: 'Formato inválido: versão não encontrada' };
    }
    
    if (!parsed.progression || !parsed.nutrition) {
      return { success: false, error: 'Formato inválido: dados incompletos' };
    }
    
    parsed.updatedAt = Date.now();
    setLocalState(parsed as AppState);
    return { success: true };
  } catch {
    return { success: false, error: 'Erro ao processar JSON' };
  }
}

// ============= NEW USER INITIALIZATION =============

import { getWeekStart } from './weekUtils';

export function createNewUserState(): AppState {
  const defaultPlan: UserWorkoutPlan = {
    workouts: [],
    updatedAt: new Date().toISOString(),
  };

  return {
    version: APP_STATE_VERSION,
    updatedAt: Date.now(),
    profile: {
      displayName: 'Atleta',
      photoURL: undefined,
      goal: undefined,
    },
    progression: {
      accountLevel: 1,
      xp: 0,
      xpToNext: 500,
      streakDays: 0,
      shields: 0,
      multiplier: 1.0,
    },
    plan: defaultPlan,
    workoutHistory: [],
    exerciseHistory: {},
    nutrition: {
      targets: {
        kcal: 2050,
        protein: 160,
        carbs: 200,
        fats: 65,
      },
      dailyLogs: {},
    },
    bodyweight: {
      entries: [],
    },
    achievements: {
      unlocked: [],
      updatedAt: Date.now(),
    },
    treinoProgresso: {},
    quests: {
      treinoDoDiaDone: false,
      registrarAlimentacaoDone: false,
      registrarPesoDone: false,
    },
    progressionSuggestions: {},
    weeklyCompletions: {},
  };
}

// ============= WEEKLY COMPLETION FUNCTIONS =============

export function markWorkoutCompletedThisWeek(
  workoutId: string,
  xpGained: number,
  setsCompleted: number,
  totalVolume: number
): void {
  const state = getLocalState();
  const weekStart = getWeekStart(new Date());

  if (!state.weeklyCompletions) {
    state.weeklyCompletions = {};
  }

  if (!state.weeklyCompletions[weekStart]) {
    state.weeklyCompletions[weekStart] = {};
  }

  state.weeklyCompletions[weekStart][workoutId] = {
    completedAt: new Date().toISOString(),
    xpGained,
    setsCompleted,
    totalVolume,
  };

  setLocalState(state);
}

export function isWorkoutCompletedThisWeek(workoutId: string, weekStart?: string): boolean {
  const state = getLocalState();
  const week = weekStart || getWeekStart(new Date());

  return !!(state.weeklyCompletions?.[week]?.[workoutId]);
}

export function getWeeklyCompletions(weekStart?: string): Record<string, { completedAt: string; xpGained: number; setsCompleted: number; totalVolume: number }> {
  const state = getLocalState();
  const week = weekStart || getWeekStart(new Date());

  return state.weeklyCompletions?.[week] || {};
}
