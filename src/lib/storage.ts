// src/lib/storage.ts
// Unified storage layer with automatic AppState sync for cloud backup
// ALL saves here automatically update AppState and trigger sync

import { workouts as defaultWorkouts, type Workout, type SetData } from "@/data/workouts";
import { load, save, STORAGE_KEYS, APP_STATE_KEY, emitChange } from "./localStore";
import {
  commitNutritionGoals,
  commitNutritionDiet,
  commitNutritionToday,
  commitNutritionTotalsLog,
  commitProfile,
  commitQuests,
  commitTreinoProgresso,
  commitTreinoHoje,
  commitWorkoutPlan,
  commitProgressionSuggestions,
  commitWeightEntry,
  commitWorkoutCompleted,
  commitExerciseHistory,
  commitNutritionCompleted,
} from "./commit";

// ============= RE-EXPORT STORAGE_KEYS =============
export { STORAGE_KEYS, load, save } from "./localStore";

// ============= LEGACY COMPATIBILITY: mergeSave =============
export function mergeSave<T extends object>(key: string, partial: Partial<T>, defaultValue: T): T {
  const current = load<T>(key, defaultValue);
  const merged = { ...current, ...partial };
  save(key, merged);
  return merged;
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

export interface TreinoHoje {
  treinoId: string;
  startedAt: string;
  completedAt?: string;
}

// ============= USER WORKOUT PLAN =============

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
  scheduledDays?: number[];
}

export interface UserWorkoutPlan {
  workouts: UserWorkout[];
  updatedAt: string;
}

function convertDefaultWorkout(workout: Workout): UserWorkout {
  return {
    id: workout.id,
    titulo: workout.titulo,
    duracaoEstimada: workout.duracaoEstimada,
    exercicios: workout.exercicios.map((ex) => ({
      id: ex.id,
      nome: ex.nome,
      muscleGroup: ex.tags.find((t) => t !== "Principal" && t !== "Acessório") || "Outro",
      tags: ex.tags,
      repsRange: ex.repsRange,
      descansoSeg: ex.descansoSeg,
      warmupEnabled: ex.warmupEnabled,
      feederSetsDefault: ex.feederSetsDefault,
      workSetsDefault: ex.workSetsDefault,
      observacoes: (ex as any).observacoes,
    })),
  };
}

export function getUserWorkoutPlan(): UserWorkoutPlan {
  const stored = load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null);

  if (stored && Array.isArray(stored.workouts) && stored.workouts.length > 0) {
    return stored;
  }

  if (stored && Array.isArray(stored.workouts) && stored.workouts.length === 0) {
    try {
      localStorage.removeItem(STORAGE_KEYS.USER_WORKOUT_PLAN);
    } catch {
      // ignore
    }
  }

  const defaultPlan: UserWorkoutPlan = {
    workouts: Object.values(defaultWorkouts).map(convertDefaultWorkout),
    updatedAt: new Date().toISOString(),
  };

  return defaultPlan;
}

export function saveUserWorkoutPlan(plan: UserWorkoutPlan): void {
  commitWorkoutPlan(plan);
}

export function resetUserWorkoutPlan(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER_WORKOUT_PLAN);
  } catch {
    // ignore
  }
}

export function hasCustomWorkoutPlan(): boolean {
  return load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null) !== null;
}

export function getUserWorkout(id: string): UserWorkout | undefined {
  const plan = getUserWorkoutPlan();
  return plan.workouts.find((w) => w.id === id);
}

export function getUserExercise(workoutId: string, exerciseId: string): UserExercise | undefined {
  const workout = getUserWorkout(workoutId);
  if (!workout) return undefined;
  return workout.exercicios.find((e) => e.id === exerciseId);
}

export function getUserNextExercise(workoutId: string, currentExerciseId: string): UserExercise | null {
  const workout = getUserWorkout(workoutId);
  if (!workout) return null;

  const idx = workout.exercicios.findIndex((e) => e.id === currentExerciseId);
  if (idx === -1 || idx >= workout.exercicios.length - 1) return null;

  return workout.exercicios[idx + 1];
}

export function isUserLastExercise(workoutId: string, exerciseId: string): boolean {
  const workout = getUserWorkout(workoutId);
  if (!workout) return true;

  const last = workout.exercicios[workout.exercicios.length - 1];
  return last?.id === exerciseId;
}

// ============= PROFILE & QUESTS =============

const DEFAULT_PROFILE: Profile = {
  xpAtual: 0,
  xpMeta: 500,
  level: 1,
  streakDias: 0,
  multiplier: 1.0,
  shields: 0,
};

const DEFAULT_QUESTS: Quests = {
  treinoDoDiaDone: false,
  registrarAlimentacaoDone: false,
  registrarPesoDone: false,
};

export function getProfile(): Profile {
  return load<Profile>(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export function saveProfile(profile: Profile): void {
  commitProfile(profile);
}

export function getQuests(): Quests {
  return load<Quests>(STORAGE_KEYS.QUESTS, DEFAULT_QUESTS);
}

export function saveQuests(quests: Quests): void {
  commitQuests(quests);
}

// ============= NUTRITION GOALS & DIET =============

const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  kcalTarget: 2050,
  pTarget: 160,
  cTarget: 200,
  gTarget: 65,
};

export function getNutritionGoals(): NutritionGoals {
  return load<NutritionGoals>(STORAGE_KEYS.NUTRITION_GOALS, DEFAULT_NUTRITION_GOALS);
}

export function saveNutritionGoals(goals: NutritionGoals): void {
  commitNutritionGoals(goals);
}

export function getNutritionDiet(): NutritionDiet | null {
  return load<NutritionDiet | null>(STORAGE_KEYS.NUTRITION_DIET, null);
}

export function saveNutritionDiet(diet: NutritionDiet): void {
  commitNutritionDiet(diet);
}

function getTodayDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

function createEmptyToday(dateKey: string): NutritionToday {
  return {
    dateKey,
    meals: [
      { id: "cafe", nome: "Café da Manhã", entries: [] },
      { id: "almoco", nome: "Almoço", entries: [] },
      { id: "lanche", nome: "Lanche", entries: [] },
      { id: "jantar", nome: "Jantar", entries: [] },
    ],
  };
}

export function getNutritionToday(): NutritionToday {
  const todayKey = getTodayDateKey();
  const stored = load<NutritionToday | null>(STORAGE_KEYS.NUTRITION_TODAY, null);

  if (stored && stored.dateKey === todayKey) {
    return stored;
  }

  // New day - return empty (don't save in getter to avoid side effects)
  return createEmptyToday(todayKey);
}

export function saveNutritionToday(today: NutritionToday): void {
  commitNutritionToday(today);
}

export function addFoodToToday(
  mealId: string,
  foodId: string,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop",
  source: "diet" | "extra" | "auto" = "extra"
): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal) return;

  const entry: TodayEntry = {
    id: `${foodId}-${Date.now()}`,
    foodId,
    quantidade,
    unidade,
    source,
    createdAt: Date.now(),
    planned: source === "diet",
    consumed: true,
  };

  meal.entries.push(entry);
  commitNutritionToday(today);
}

export function removeFoodFromToday(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal) return;

  meal.entries = meal.entries.filter((e) => e.id !== entryId);
  commitNutritionToday(today);
}

export function addFoodToDiet(
  mealId: string,
  foodId: string,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop"
): void {
  let diet = getNutritionDiet();
  if (!diet) {
    diet = {
      meals: [
        { id: "cafe", nome: "Café da Manhã", items: [] },
        { id: "almoco", nome: "Almoço", items: [] },
        { id: "lanche", nome: "Lanche", items: [] },
        { id: "jantar", nome: "Jantar", items: [] },
      ],
    };
  }

  const meal = diet.meals.find((m) => m.id === mealId);
  if (!meal) return;

  meal.items.push({ foodId, quantidade, unidade });
  commitNutritionDiet(diet);
}

export function removeFoodFromDiet(mealId: string, index: number): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const meal = diet.meals.find((m) => m.id === mealId);
  if (!meal) return;

  meal.items.splice(index, 1);
  commitNutritionDiet(diet);
}

export function applyDietToToday(): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const today = getNutritionToday();

  for (const dietMeal of diet.meals) {
    const todayMeal = today.meals.find((m) => m.id === dietMeal.id);
    if (!todayMeal) continue;

    for (const item of dietMeal.items) {
      const entry: TodayEntry = {
        id: `${item.foodId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        foodId: item.foodId,
        quantidade: item.quantidade,
        unidade: item.unidade,
        source: "diet",
        createdAt: Date.now(),
        planned: true,
        consumed: false,
      };
      todayMeal.entries.push(entry);
    }
  }

  commitNutritionToday(today);
}

export function toggleAllMealConsumed(mealId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal || meal.entries.length === 0) return;

  const allConsumed = meal.entries.every((e) => e.consumed);
  
  for (const entry of meal.entries) {
    entry.consumed = !allConsumed;
  }
  
  commitNutritionToday(today);
}

export function toggleFoodConsumed(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal) return;

  const entry = meal.entries.find((e) => e.id === entryId);
  if (!entry) return;

  entry.consumed = !entry.consumed;
  commitNutritionToday(today);
}

export function updateFoodInToday(
  mealId: string,
  entryId: string,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop"
): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal) return;

  const entry = meal.entries.find((e) => e.id === entryId);
  if (!entry) return;

  entry.quantidade = quantidade;
  entry.unidade = unidade;
  commitNutritionToday(today);
}

export function updateFoodInDiet(
  mealId: string,
  index: number,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop"
): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const meal = diet.meals.find((m) => m.id === mealId);
  if (!meal || index < 0 || index >= meal.items.length) return;

  meal.items[index].quantidade = quantidade;
  meal.items[index].unidade = unidade;
  commitNutritionDiet(diet);
}

export function resetNutritionToday(): void {
  const todayKey = getTodayDateKey();
  const empty = createEmptyToday(todayKey);
  commitNutritionToday(empty);
}

export function isNutritionCompletedToday(): boolean {
  const completed = load<Record<string, boolean>>(STORAGE_KEYS.NUTRITION_COMPLETED, {});
  const todayKey = getTodayDateKey();
  return !!completed[todayKey];
}

export function completeNutritionToday(xpGained: number): void {
  const completed = load<Record<string, boolean>>(STORAGE_KEYS.NUTRITION_COMPLETED, {});
  const todayKey = getTodayDateKey();
  completed[todayKey] = true;
  commitNutritionCompleted(completed);

  const profile = getProfile();
  profile.xpAtual += xpGained;

  while (profile.xpAtual >= profile.xpMeta) {
    profile.xpAtual -= profile.xpMeta;
    profile.level += 1;
    profile.xpMeta = Math.round(profile.xpMeta * 1.15);
  }

  commitProfile(profile);

  const quests = getQuests();
  quests.registrarAlimentacaoDone = true;
  commitQuests(quests);
}

// ============= TREINO PROGRESSO =============

export function getTreinoProgresso(): TreinoProgresso {
  return load<TreinoProgresso>(STORAGE_KEYS.TREINO_PROGRESSO, {});
}

export function saveTreinoProgresso(progresso: TreinoProgresso): void {
  commitTreinoProgresso(progresso);
}

export function getExerciseProgress(treinoId: string, exercicioId: string): ExerciseProgress | null {
  const progresso = getTreinoProgresso();
  return progresso[treinoId]?.[exercicioId] || null;
}

export function saveExerciseProgress(treinoId: string, exercicioId: string, progress: ExerciseProgress): void {
  const progresso = getTreinoProgresso();
  if (!progresso[treinoId]) {
    progresso[treinoId] = {};
  }
  progresso[treinoId][exercicioId] = progress;
  commitTreinoProgresso(progresso);
}

export function isExerciseComplete(treinoId: string, exercicioId: string): boolean {
  const progress = getExerciseProgress(treinoId, exercicioId);
  if (!progress) return false;
  return progress.workSets.length > 0 && progress.workSets.every((s) => s.done);
}

export function getExerciseSetProgress(treinoId: string, exercicioId: string): { done: number; total: number } {
  const progress = getExerciseProgress(treinoId, exercicioId);
  if (!progress) return { done: 0, total: 0 };
  const total = progress.workSets.length;
  const done = progress.workSets.filter((s) => s.done).length;
  return { done, total };
}

export function clearTreinoProgress(treinoId: string): void {
  const progresso = getTreinoProgresso();
  if (progresso[treinoId]) {
    delete progresso[treinoId];
    commitTreinoProgresso(progresso);
  }
}

// ============= TREINO HOJE =============

export function getTreinoHoje(): TreinoHoje | null {
  return load<TreinoHoje | null>(STORAGE_KEYS.TREINO_HOJE, null);
}

export function saveTreinoHoje(treino: TreinoHoje): void {
  commitTreinoHoje(treino);
}

export function clearTreinoHoje(): void {
  commitTreinoHoje(null);
}

// ============= EXERCISE HISTORY =============

export function getExerciseHistory(): ExerciseHistoryData {
  return load<ExerciseHistoryData>(STORAGE_KEYS.EXERCISE_HISTORY, {});
}

export function getLastExercisePerformance(exerciseId: string): ExerciseSnapshot | null {
  const history = getExerciseHistory();
  const entries = history[exerciseId];
  if (!entries || entries.length === 0) return null;
  return entries[entries.length - 1];
}

// ============= WORKOUT HISTORY =============

export function getWorkoutsCompleted(): WorkoutCompleted[] {
  return load<WorkoutCompleted[]>(STORAGE_KEYS.WORKOUTS_COMPLETED, []);
}

export function getLastWorkoutDate(workoutId: string): string | null {
  const history = getWorkoutsCompleted();
  const workouts = history.filter((w) => w.workoutId === workoutId);
  if (workouts.length === 0) return null;
  return workouts[workouts.length - 1].timestamp;
}

export function formatRelativeDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 14) return "1 semana atrás";
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semanas atrás`;
  return `${Math.floor(diffDays / 30)} meses atrás`;
}

// ============= PROGRESSION SUGGESTIONS =============

export function getProgressionSuggestions(): ProgressionSuggestions {
  return load<ProgressionSuggestions>(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, {});
}

export function saveProgressionSuggestions(suggestions: ProgressionSuggestions): void {
  commitProgressionSuggestions(suggestions);
}

export function getProgressionSuggestion(
  exerciseId: string,
  repsRange: string
): {
  status: "ready" | "maintain" | "none";
  statusIcon: string;
  statusLabel: string;
  metaHoje: string;
} | null {
  const lastPerf = getLastExercisePerformance(exerciseId);
  if (!lastPerf || !lastPerf.workSets || lastPerf.workSets.length === 0) {
    return null;
  }

  const firstSet = lastPerf.workSets[0];
  const [minReps, maxReps] = repsRange.split("–").map((s) => parseInt(s.trim(), 10));

  if (firstSet.reps >= maxReps) {
    const nextKg = firstSet.kg + 2.5;
    return {
      status: "ready",
      statusIcon: "🔥",
      statusLabel: "Pronto para subir",
      metaHoje: `${nextKg} kg × ${minReps}+`,
    };
  }

  return {
    status: "maintain",
    statusIcon: "💪",
    statusLabel: "Manter carga",
    metaHoje: `${firstSet.kg} kg × ${firstSet.reps + 1}+`,
  };
}

// ============= WEIGHT HISTORY =============

export function getWeightHistory(): WeightEntry[] {
  return load<WeightEntry[]>(STORAGE_KEYS.WEIGHT_HISTORY, []);
}

export function saveWeight(weight: number): void {
  commitWeightEntry(weight);
}

// ============= WORKOUT SUMMARY STATS =============

export function getWorkoutSummaryStats(treinoId: string): {
  totalSets: number;
  totalVolume: number;
  exercisesDone: number;
  totalExercises: number;
} {
  const workout = getUserWorkout(treinoId);
  if (!workout) {
    return { totalSets: 0, totalVolume: 0, exercisesDone: 0, totalExercises: 0 };
  }

  const progresso = getTreinoProgresso();
  const treinoProgress = progresso[treinoId] || {};

  let totalSets = 0;
  let totalVolume = 0;
  let exercisesDone = 0;

  for (const ex of workout.exercicios) {
    const exProgress = treinoProgress[ex.id];
    if (!exProgress) continue;

    const doneSets = exProgress.workSets.filter((s) => s.done);
    totalSets += doneSets.length;

    for (const set of doneSets) {
      totalVolume += set.kg * set.reps;
    }

    if (doneSets.length > 0 && doneSets.length === exProgress.workSets.length) {
      exercisesDone++;
    }
  }

  return {
    totalSets,
    totalVolume,
    exercisesDone,
    totalExercises: workout.exercicios.length,
  };
}

// ============= ACHIEVEMENT TYPES =============

export interface Achievement {
  id: string;
  title: string;
  name?: string;
  description: string;
  icon: string;
  color: string;
  target: number;
  progress: number;
  unlocked: boolean;
  xp: number;
}

export function getAchievements(): Achievement[] {
  const workoutsCompleted = getWorkoutsCompleted().length;
  const exerciseHistory = getExerciseHistory();
  const totalExerciseSessions = Object.values(exerciseHistory).reduce((acc, arr) => acc + arr.length, 0);
  const profile = getProfile();

  return [
    {
      id: "first-workout",
      title: "Primeiro Passo",
      name: "Primeiro Passo",
      description: "Complete seu primeiro treino",
      icon: "🎯",
      color: "text-yellow-500",
      target: 1,
      progress: Math.min(workoutsCompleted, 1),
      unlocked: workoutsCompleted >= 1,
      xp: 50,
    },
    {
      id: "five-workouts",
      title: "Aquecimento",
      name: "Aquecimento",
      description: "Complete 5 treinos",
      icon: "💪",
      color: "text-blue-500",
      target: 5,
      progress: Math.min(workoutsCompleted, 5),
      unlocked: workoutsCompleted >= 5,
      xp: 100,
    },
    {
      id: "ten-workouts",
      title: "Consistência",
      name: "Consistência",
      description: "Complete 10 treinos",
      icon: "🔥",
      color: "text-orange-500",
      target: 10,
      progress: Math.min(workoutsCompleted, 10),
      unlocked: workoutsCompleted >= 10,
      xp: 150,
    },
    {
      id: "twenty-five-workouts",
      title: "Atleta",
      name: "Atleta",
      description: "Complete 25 treinos",
      icon: "🏆",
      color: "text-purple-500",
      target: 25,
      progress: Math.min(workoutsCompleted, 25),
      unlocked: workoutsCompleted >= 25,
      xp: 250,
    },
    {
      id: "fifty-exercises",
      title: "Veterano",
      name: "Veterano",
      description: "Complete 50 exercícios",
      icon: "⭐",
      color: "text-green-500",
      target: 50,
      progress: Math.min(totalExerciseSessions, 50),
      unlocked: totalExerciseSessions >= 50,
      xp: 300,
    },
    {
      id: "streak-7",
      title: "Semana de Fogo",
      name: "Semana de Fogo",
      description: "Mantenha um streak de 7 dias",
      icon: "🔥",
      color: "text-red-500",
      target: 7,
      progress: Math.min(profile.streakDias, 7),
      unlocked: profile.streakDias >= 7,
      xp: 200,
    },
  ];
}

// ============= CHART DATA FUNCTIONS =============

export interface WeeklyVolumeData {
  weekLabel: string;
  volume: number;
}

export function getWeeklyVolume(days: number = 28): WeeklyVolumeData[] {
  const workouts = getWorkoutsCompleted();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const weeksMap: Record<string, number> = {};

  for (const w of workouts) {
    const date = new Date(w.timestamp);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split("T")[0];
      weeksMap[key] = (weeksMap[key] || 0) + w.totalVolume;
    }
  }

  return Object.entries(weeksMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekLabel, volume]) => ({ weekLabel, volume }));
}

export interface ConsistencyData {
  weekLabel: string;
  count: number;
}

export function getConsistency(days: number = 28): ConsistencyData[] {
  const workouts = getWorkoutsCompleted();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const weeksMap: Record<string, number> = {};

  for (const w of workouts) {
    const date = new Date(w.timestamp);
    if (date >= startDate) {
      const weekStart = new Date(date);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split("T")[0];
      weeksMap[key] = (weeksMap[key] || 0) + 1;
    }
  }

  return Object.entries(weeksMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekLabel, count]) => ({ weekLabel, count }));
}

export function getConsistencyPercentage(days: number = 30): number {
  const workouts = getWorkoutsCompleted();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  const workoutsInPeriod = workouts.filter((w) => new Date(w.timestamp) >= startDate).length;
  const expectedWorkouts = Math.ceil(days / 7) * 4;
  const percentage = Math.round((workoutsInPeriod / expectedWorkouts) * 100);
  return Math.min(percentage, 100);
}

export interface E1RMHistoryData {
  dateLabel: string;
  e1rm: number;
}

export function getE1RMHistory(exerciseId: string): E1RMHistoryData[] {
  const history = getExerciseHistory();
  const entries = history[exerciseId] || [];

  return entries.map((e) => {
    const firstSet = e.workSets[0];
    const e1rm = firstSet ? Math.round(firstSet.kg * (1 + firstSet.reps / 30)) : 0;
    return {
      dateLabel: e.timestamp.split("T")[0],
      e1rm,
    };
  });
}

export interface NutritionChartData {
  dateLabel: string;
  kcal: number;
  kcalMeta: number;
}

export function getNutritionChartData(): NutritionChartData[] {
  const goals = getNutritionGoals();
  return [
    { dateLabel: new Date().toISOString().split("T")[0], kcal: 0, kcalMeta: goals.kcalTarget },
  ];
}

export interface WeightChartData {
  dateLabel: string;
  weight: number;
}

export function getWeightChartData(): WeightChartData[] {
  const history = getWeightHistory();
  return history.map((w) => ({
    dateLabel: w.timestamp.split("T")[0],
    weight: w.weight,
  }));
}

export interface WeightVariation {
  current: number | null;
  variation: number | null;
  delta: number | null;
}

export function getWeightVariation(): WeightVariation {
  const history = getWeightHistory();
  if (history.length === 0) {
    return { current: null, variation: null, delta: null };
  }

  const current = history[history.length - 1].weight;

  if (history.length < 2) {
    return { current, variation: null, delta: null };
  }

  const first = history[0].weight;
  const delta = Math.round((current - first) * 10) / 10;
  const variation = Math.round((delta / first) * 1000) / 10;

  return { current, variation, delta };
}

// ============= DEFAULT MEALS =============

export const DEFAULT_MEALS = [
  { id: "cafe", nome: "Café da Manhã" },
  { id: "almoco", nome: "Almoço" },
  { id: "lanche", nome: "Lanche" },
  { id: "jantar", nome: "Jantar" },
];

// ============= ADDITIONAL NUTRITION FUNCTIONS =============

export function hasDietSaved(): boolean {
  const diet = getNutritionDiet();
  if (!diet || !diet.meals) return false;
  return diet.meals.some((m) => m.items.length > 0);
}

export function getCompletedMealsCount(): number {
  const today = getNutritionToday();
  let count = 0;
  for (const meal of today.meals) {
    const hasConsumed = meal.entries.some((e) => e.consumed);
    if (hasConsumed) count++;
  }
  return count;
}

// ============= QUESTS SYNC =============

export function syncQuestsStatus(): void {
  const quests = getQuests();

  try {
    const workoutId = localStorage.getItem("levelup.currentWorkoutId");
    if (workoutId) {
      const appStateRaw = localStorage.getItem(APP_STATE_KEY);
      if (appStateRaw) {
        const appState = JSON.parse(appStateRaw);
        const weekStart = getWeekStartLocal(new Date());
        if (appState.weeklyCompletions?.[weekStart]?.[workoutId]) {
          quests.treinoDoDiaDone = true;
        }
      }
    }
  } catch {
    // Ignore errors
  }

  const weightHistory = getWeightHistory();
  const todayKey = getTodayDateKey();
  const todayWeight = weightHistory.find(
    (w) => w.timestamp.split("T")[0] === todayKey
  );
  if (todayWeight) {
    quests.registrarPesoDone = true;
  }

  if (isNutritionCompletedToday()) {
    quests.registrarAlimentacaoDone = true;
  }

  commitQuests(quests);
}

function getWeekStartLocal(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ============= COMPLETE TREINO DO DIA =============

export function completeTreinoDoDia(xpGained: number): void {
  const profile = getProfile();
  profile.xpAtual += xpGained;

  while (profile.xpAtual >= profile.xpMeta) {
    profile.xpAtual -= profile.xpMeta;
    profile.level += 1;
    profile.xpMeta = Math.round(profile.xpMeta * 1.15);
  }

  profile.streakDias += 1;

  commitProfile(profile);

  const quests = getQuests();
  quests.treinoDoDiaDone = true;
  commitQuests(quests);

  clearTreinoHoje();
}

// ============= PROGRESSION SUGGESTION (SINGULAR) =============

export interface ProgressionSuggestion {
  suggestedNextLoad: number;
  appliedAt: string;
}

export function saveProgressionSuggestion(exerciseId: string, suggestedLoad: number): void {
  const suggestions = getProgressionSuggestions();
  suggestions[exerciseId] = {
    suggestedNextLoad: suggestedLoad,
    appliedAt: new Date().toISOString(),
  };
  commitProgressionSuggestions(suggestions);
}

// ============= PROFILE STATS =============

export function getTotalWorkoutsCompleted(): number {
  return getWorkoutsCompleted().length;
}

export function getTotalVolume(): number {
  const workouts = getWorkoutsCompleted();
  return workouts.reduce((acc, w) => acc + w.totalVolume, 0);
}

// ============= PROGRESSO PAGE FUNCTIONS =============

export function getWorkoutsInPeriod(days: number): number {
  const workouts = getWorkoutsCompleted();
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);

  return workouts.filter((w) => new Date(w.timestamp) >= startDate).length;
}

export function getPRsCount(): number {
  const history = getExerciseHistory();
  let prs = 0;

  for (const exerciseId of Object.keys(history)) {
    const entries = history[exerciseId];
    if (entries.length < 2) continue;

    let maxE1RM = 0;
    for (const entry of entries) {
      const firstSet = entry.workSets[0];
      if (!firstSet) continue;
      const e1rm = firstSet.kg * (1 + firstSet.reps / 30);
      if (e1rm > maxE1RM) {
        maxE1RM = e1rm;
        prs++;
      }
    }
  }

  return prs;
}

export function getExercisesWithHistory(): { id: string; name: string }[] {
  const history = getExerciseHistory();
  const plan = getUserWorkoutPlan();
  const result: { id: string; name: string }[] = [];

  for (const exerciseId of Object.keys(history)) {
    let name = exerciseId;
    for (const workout of plan.workouts) {
      const ex = workout.exercicios.find((e) => e.id === exerciseId);
      if (ex) {
        name = ex.nome;
        break;
      }
    }
    result.push({ id: exerciseId, name });
  }

  return result;
}

export function saveNutritionLog(log: { dateKey: string; kcal: number; p: number; c: number; g: number }): void {
  commitNutritionTotalsLog(log);
}

// ============= EXERCISE SNAPSHOT =============

const originalSaveExerciseSnapshot = (snapshot: ExerciseSnapshot): void => {
  const history = getExerciseHistory();
  if (!history[snapshot.exerciseId]) {
    history[snapshot.exerciseId] = [];
  }
  history[snapshot.exerciseId].push(snapshot);
  if (history[snapshot.exerciseId].length > 100) {
    history[snapshot.exerciseId] = history[snapshot.exerciseId].slice(-100);
  }
  commitExerciseHistory(history);
};

export function saveExerciseSnapshot(
  snapshotOrExerciseId: ExerciseSnapshot | string,
  workoutId?: string,
  repsRange?: string,
  workSets?: ExerciseSetSnapshot[]
): void {
  if (typeof snapshotOrExerciseId === "string") {
    const snapshot: ExerciseSnapshot = {
      exerciseId: snapshotOrExerciseId,
      workoutId: workoutId!,
      repsRange: repsRange!,
      workSets: workSets!,
      timestamp: new Date().toISOString(),
    };
    originalSaveExerciseSnapshot(snapshot);
  } else {
    originalSaveExerciseSnapshot(snapshotOrExerciseId);
  }
}

// ============= WORKOUT COMPLETED =============

export function saveWorkoutCompleted(
  completedOrWorkoutId: WorkoutCompleted | string,
  totalVolume?: number
): void {
  if (typeof completedOrWorkoutId === "string") {
    commitWorkoutCompleted({
      workoutId: completedOrWorkoutId,
      timestamp: new Date().toISOString(),
      totalVolume: totalVolume ?? 0,
    });
  } else {
    commitWorkoutCompleted(completedOrWorkoutId);
  }
}

// ============= RE-EXPORT SetData for compatibility =============

export type { SetData };
