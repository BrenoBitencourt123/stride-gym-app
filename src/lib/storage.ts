// Utilitários de persistência localStorage

export function load<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    return JSON.parse(stored) as T;
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function mergeSave<T extends Record<string, unknown>>(key: string, partial: Partial<T>): void {
  try {
    const existing = load<T>(key, {} as T);
    const merged = { ...existing, ...partial };
    save(key, merged);
  } catch (error) {
    console.error("Failed to merge save to localStorage:", error);
  }
}

// Storage keys
export const STORAGE_KEYS = {
  PROFILE: "levelup.profile",
  TREINO_PROGRESSO: "levelup.treinoProgresso",
  QUESTS: "levelup.quests",
  TREINO_HOJE: "levelup.treinoHoje",
  NUTRITION_GOALS: "levelup.nutrition.goals",
  NUTRITION_DIET: "levelup.nutrition.diet",
  NUTRITION_TODAY: "levelup.nutrition.today",
  NUTRITION_COMPLETED: "levelup.nutrition.completed",
  EXERCISE_HISTORY: "levelup.exerciseHistory",
  PROGRESSION_SUGGESTIONS: "levelup.progressionSuggestions",
  USER_WORKOUT_PLAN: "levelup.userWorkoutPlan",
  WEIGHT_HISTORY: "levelup.weightHistory",
  WORKOUTS_COMPLETED: "levelup.workoutsCompleted",
} as const;

// Tipos de dados persistidos
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

export interface TreinoHoje {
  treinoId: string;
  startedAt: string;
  completedAt?: string;
}

// ======= NUTRITION TYPES =======
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

// Valores padrão
export const DEFAULT_PROFILE: Profile = {
  xpAtual: 1240,
  xpMeta: 1500,
  level: 12,
  streakDias: 6,
  multiplier: 1.2,
  shields: 2,
};

export const DEFAULT_QUESTS: Quests = {
  treinoDoDiaDone: false,
  registrarAlimentacaoDone: false,
  registrarPesoDone: false,
};

export const DEFAULT_NUTRITION_GOALS: NutritionGoals = {
  kcalTarget: 2050,
  pTarget: 160,
  cTarget: 200,
  gTarget: 65,
};

export const DEFAULT_MEALS: TodayMeal[] = [
  { id: "cafe", nome: "Café da manhã", entries: [] },
  { id: "almoco", nome: "Almoço", entries: [] },
  { id: "lanche", nome: "Lanche", entries: [] },
  { id: "jantar", nome: "Jantar", entries: [] },
];

// Funções de acesso específicas
export function getProfile(): Profile {
  return load(STORAGE_KEYS.PROFILE, DEFAULT_PROFILE);
}

export function saveProfile(profile: Profile): void {
  save(STORAGE_KEYS.PROFILE, profile);
}

export function getQuests(): Quests {
  return load(STORAGE_KEYS.QUESTS, DEFAULT_QUESTS);
}

export function saveQuests(quests: Quests): void {
  save(STORAGE_KEYS.QUESTS, quests);
}

export function getTreinoProgresso(): TreinoProgresso {
  return load(STORAGE_KEYS.TREINO_PROGRESSO, {});
}

export function saveTreinoProgresso(progresso: TreinoProgresso): void {
  save(STORAGE_KEYS.TREINO_PROGRESSO, progresso);
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
  saveTreinoProgresso(progresso);
}

export function getTreinoHoje(): TreinoHoje | null {
  return load<TreinoHoje | null>(STORAGE_KEYS.TREINO_HOJE, null);
}

export function saveTreinoHoje(treinoHoje: TreinoHoje): void {
  save(STORAGE_KEYS.TREINO_HOJE, treinoHoje);
}

export function addXP(amount: number): Profile {
  const profile = getProfile();
  profile.xpAtual += amount;
  
  // Level up se necessário
  while (profile.xpAtual >= profile.xpMeta) {
    profile.xpAtual -= profile.xpMeta;
    profile.level += 1;
    profile.xpMeta += 300; // Aumenta 300 XP por level
  }
  
  saveProfile(profile);
  return profile;
}

export function completeTreinoDoDia(xpGained: number): void {
  // Marcar quest como feita
  const quests = getQuests();
  quests.treinoDoDiaDone = true;
  saveQuests(quests);
  
  // Adicionar XP
  addXP(xpGained);
  
  // Marcar treino de hoje como completo
  const treinoHoje = getTreinoHoje();
  if (treinoHoje) {
    treinoHoje.completedAt = new Date().toISOString();
    saveTreinoHoje(treinoHoje);
  }
}

export function countCompletedSets(treinoId: string): number {
  const progresso = getTreinoProgresso();
  const treinoProgress = progresso[treinoId];
  if (!treinoProgress) return 0;
  
  let count = 0;
  for (const exercicioId in treinoProgress) {
    const exerciseProgress = treinoProgress[exercicioId];
    count += exerciseProgress.feederSets.filter(s => s.done).length;
    count += exerciseProgress.workSets.filter(s => s.done).length;
  }
  return count;
}

export function isExerciseComplete(treinoId: string, exercicioId: string): boolean {
  const progress = getExerciseProgress(treinoId, exercicioId);
  if (!progress || progress.workSets.length === 0) return false;
  return progress.workSets.every(s => s.done);
}

export function getExerciseSetProgress(treinoId: string, exercicioId: string): { done: number; total: number } {
  const progress = getExerciseProgress(treinoId, exercicioId);
  if (!progress) return { done: 0, total: 0 };
  const total = progress.workSets.length;
  const done = progress.workSets.filter(s => s.done).length;
  return { done, total };
}

export function clearTreinoProgress(treinoId: string): void {
  const progresso = getTreinoProgresso();
  if (progresso[treinoId]) {
    delete progresso[treinoId];
    saveTreinoProgresso(progresso);
  }
}

export function getWorkoutSummaryStats(treinoId: string): { completedSets: number; totalSets: number; totalVolume: number } {
  const progresso = getTreinoProgresso();
  const treinoProgress = progresso[treinoId];
  
  if (!treinoProgress) return { completedSets: 0, totalSets: 0, totalVolume: 0 };
  
  let completedSets = 0;
  let totalSets = 0;
  let totalVolume = 0;
  
  for (const exercicioId in treinoProgress) {
    const exerciseProgress = treinoProgress[exercicioId];
    totalSets += exerciseProgress.workSets.length;
    
    for (const set of exerciseProgress.workSets) {
      if (set.done) {
        completedSets++;
        totalVolume += set.kg * set.reps;
      }
    }
  }
  
  return { completedSets, totalSets, totalVolume: Math.round(totalVolume) };
}

// ======= NUTRITION FUNCTIONS =======

export function getNutritionGoals(): NutritionGoals {
  return load(STORAGE_KEYS.NUTRITION_GOALS, DEFAULT_NUTRITION_GOALS);
}

export function saveNutritionGoals(goals: NutritionGoals): void {
  save(STORAGE_KEYS.NUTRITION_GOALS, goals);
}

export function getNutritionDiet(): NutritionDiet | null {
  return load<NutritionDiet | null>(STORAGE_KEYS.NUTRITION_DIET, null);
}

export function saveNutritionDiet(diet: NutritionDiet): void {
  save(STORAGE_KEYS.NUTRITION_DIET, diet);
}

function getDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getNutritionToday(): NutritionToday {
  const stored = load<NutritionToday | null>(STORAGE_KEYS.NUTRITION_TODAY, null);
  const todayKey = getDateKey();
  
  // Se não existe ou é outro dia, aplicar dieta automaticamente
  if (!stored || stored.dateKey !== todayKey) {
    const diet = getNutritionDiet();
    const fresh: NutritionToday = {
      dateKey: todayKey,
      meals: DEFAULT_MEALS.map(m => {
        const dietMeal = diet?.meals.find(dm => dm.id === m.id);
        const entries: TodayEntry[] = dietMeal?.items.map(item => ({
          id: crypto.randomUUID(),
          foodId: item.foodId,
          quantidade: item.quantidade,
          unidade: item.unidade,
          source: "diet" as const,
          createdAt: Date.now(),
          planned: true,
          consumed: false,
        })) || [];
        return { ...m, entries };
      }),
    };
    save(STORAGE_KEYS.NUTRITION_TODAY, fresh);
    return fresh;
  }
  
  // Migração de dados antigos: corrigir entries sem planned/consumed
  let needsSave = false;
  for (const meal of stored.meals) {
    for (const entry of meal.entries) {
      if (entry.planned === undefined) {
        entry.planned = entry.source === "diet";
        needsSave = true;
      }
      if (entry.consumed === undefined) {
        entry.consumed = entry.source !== "diet";
        needsSave = true;
      }
    }
  }
  
  if (needsSave) {
    save(STORAGE_KEYS.NUTRITION_TODAY, stored);
  }
  
  return stored;
}

// Resetar checklist do dia e reaplicar dieta
export function resetNutritionToday(): void {
  const diet = getNutritionDiet();
  const todayKey = getDateKey();
  
  const fresh: NutritionToday = {
    dateKey: todayKey,
    meals: DEFAULT_MEALS.map(m => {
      const dietMeal = diet?.meals.find(dm => dm.id === m.id);
      const entries: TodayEntry[] = dietMeal?.items.map(item => ({
        id: crypto.randomUUID(),
        foodId: item.foodId,
        quantidade: item.quantidade,
        unidade: item.unidade,
        source: "diet" as const,
        createdAt: Date.now(),
        planned: true,
        consumed: false,
      })) || [];
      return { ...m, entries };
    }),
  };
  
  save(STORAGE_KEYS.NUTRITION_TODAY, fresh);
}

export function saveNutritionToday(today: NutritionToday): void {
  save(STORAGE_KEYS.NUTRITION_TODAY, today);
}

export function addFoodToToday(mealId: string, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop", source: "diet" | "extra" | "auto" = "extra"): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  // Extras e auto entram como consumidos automaticamente
  const isPlanned = source === "diet";
  const isConsumed = source !== "diet"; // extras e auto já são consumidos
  
  const newEntry: TodayEntry = {
    id: crypto.randomUUID(),
    foodId,
    quantidade,
    unidade,
    source,
    createdAt: Date.now(),
    planned: isPlanned,
    consumed: isConsumed,
  };
  
  if (!meal) {
    // Se a refeição não existe, criar
    today.meals.push({
      id: mealId,
      nome: mealId,
      entries: [newEntry],
    });
  } else {
    meal.entries.push(newEntry);
  }
  
  saveNutritionToday(today);
  
  // Marcar quest como feita se consumiu algo
  if (isConsumed) {
    const quests = getQuests();
    if (!quests.registrarAlimentacaoDone) {
      quests.registrarAlimentacaoDone = true;
      saveQuests(quests);
    }
  }
}

export function addFoodToDiet(mealId: string, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop"): void {
  let diet = getNutritionDiet();
  
  if (!diet) {
    diet = {
      meals: DEFAULT_MEALS.map(m => ({ id: m.id, nome: m.nome, items: [] })),
    };
  }
  
  const meal = diet.meals.find(m => m.id === mealId);
  if (meal) {
    meal.items.push({ foodId, quantidade, unidade });
  }
  
  saveNutritionDiet(diet);
}

export function removeFoodFromDiet(mealId: string, index: number): void {
  const diet = getNutritionDiet();
  if (!diet) return;
  
  const meal = diet.meals.find(m => m.id === mealId);
  if (meal && meal.items[index]) {
    meal.items.splice(index, 1);
    saveNutritionDiet(diet);
  }
}

export function updateFoodInDiet(mealId: string, index: number, newQuantity: number): void {
  const diet = getNutritionDiet();
  if (!diet) return;
  
  const meal = diet.meals.find(m => m.id === mealId);
  if (meal && meal.items[index]) {
    meal.items[index].quantidade = newQuantity;
    saveNutritionDiet(diet);
  }
}

export function updateFoodInToday(mealId: string, entryId: string, newQuantity: number): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  if (meal) {
    const entry = meal.entries.find(e => e.id === entryId);
    if (entry) {
      entry.quantidade = newQuantity;
      saveNutritionToday(today);
    }
  }
}

export function removeFoodFromToday(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  if (meal) {
    meal.entries = meal.entries.filter(e => e.id !== entryId);
    saveNutritionToday(today);
  }
}

export function applyDietToToday(): void {
  const diet = getNutritionDiet();
  if (!diet) return;
  
  const today = getNutritionToday();
  
  for (const dietMeal of diet.meals) {
    const todayMeal = today.meals.find(m => m.id === dietMeal.id);
    if (todayMeal) {
      for (const item of dietMeal.items) {
        todayMeal.entries.push({
          id: crypto.randomUUID(),
          foodId: item.foodId,
          quantidade: item.quantidade,
          unidade: item.unidade,
          source: "diet",
          createdAt: Date.now(),
          planned: true,
          consumed: false,
        });
      }
    }
  }
  
  saveNutritionToday(today);
}

export function hasDietSaved(): boolean {
  const diet = getNutritionDiet();
  return diet !== null && diet.meals.some(m => m.items.length > 0);
}

export function isTodayEmpty(): boolean {
  const today = getNutritionToday();
  return today.meals.every(m => m.entries.length === 0);
}

export function toggleFoodConsumed(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  if (meal) {
    const entry = meal.entries.find(e => e.id === entryId);
    if (entry) {
      entry.consumed = !entry.consumed;
      saveNutritionToday(today);
      
      // Marcar quest se consumiu algo
      if (entry.consumed) {
        const quests = getQuests();
        if (!quests.registrarAlimentacaoDone) {
          quests.registrarAlimentacaoDone = true;
          saveQuests(quests);
        }
      }
    }
  }
}

// Refeição completa quando todos os itens PLANEJADOS foram consumidos
export function isMealComplete(mealId: string): boolean {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  if (!meal) return false;
  
  const plannedItems = meal.entries.filter(e => e.planned);
  if (plannedItems.length === 0) return false;
  
  return plannedItems.every(e => e.consumed === true);
}

// Calcula totais planejados (dieta) para uma refeição
export function getPlannedTotals(): { kcal: number; p: number; c: number; g: number } {
  // Import circular - precisamos acessar foods de outra forma
  // Esta função será implementada no componente
  return { kcal: 0, p: 0, c: 0, g: 0 };
}

// ======= NUTRITION COMPLETION =======

// getDateKey já está definida acima - reutilizamos

export interface NutritionCompleted {
  dateKey: string;
  completedAt: string;
}

// Verifica se a nutrição já foi concluída hoje
export function isNutritionCompletedToday(): boolean {
  const completed = load<NutritionCompleted | null>(STORAGE_KEYS.NUTRITION_COMPLETED, null);
  if (!completed) return false;
  return completed.dateKey === getDateKey();
}

// Conta refeições completas (todos planejados consumidos)
export function getCompletedMealsCount(): number {
  const today = getNutritionToday();
  let count = 0;
  
  for (const meal of today.meals) {
    const plannedItems = meal.entries.filter(e => e.planned);
    if (plannedItems.length > 0 && plannedItems.every(e => e.consumed)) {
      count++;
    }
  }
  
  return count;
}

// Completa a nutrição do dia: marca quest + soma XP (1x por dia)
export function completeNutritionToday(xpGained: number): void {
  // Evitar XP duplicado
  if (isNutritionCompletedToday()) return;
  
  // Marcar quest como feita
  const quests = getQuests();
  quests.registrarAlimentacaoDone = true;
  saveQuests(quests);
  
  // Adicionar XP
  addXP(xpGained);
  
  // Marcar nutrição de hoje como completa
  const completed: NutritionCompleted = {
    dateKey: getDateKey(),
    completedAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.NUTRITION_COMPLETED, completed);
}

// ======= EXERCISE HISTORY & PROGRESSION =======

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

export interface ProgressionSuggestion {
  status: "ready" | "maintain" | "return";
  statusLabel: string;
  statusIcon: string;
  message: string;
  metaHoje: string;
  suggestedNextLoad?: number;
}

export interface ProgressionSuggestions {
  [exerciseId: string]: {
    suggestedNextLoad: number;
    appliedAt: string;
  };
}

// Obtém histórico de todos os exercícios
export function getExerciseHistory(): ExerciseHistoryData {
  return load(STORAGE_KEYS.EXERCISE_HISTORY, {});
}

// Salva snapshot de um exercício após concluir treino
export function saveExerciseSnapshot(
  exerciseId: string,
  workoutId: string,
  repsRange: string,
  workSets: ExerciseSetSnapshot[]
): void {
  const history = getExerciseHistory();
  
  const snapshot: ExerciseSnapshot = {
    exerciseId,
    workoutId,
    repsRange,
    workSets,
    timestamp: new Date().toISOString(),
  };
  
  if (!history[exerciseId]) {
    history[exerciseId] = [];
  }
  
  // Adiciona no início (mais recente primeiro)
  history[exerciseId].unshift(snapshot);
  
  // Mantém apenas os últimos 10 snapshots por exercício
  if (history[exerciseId].length > 10) {
    history[exerciseId] = history[exerciseId].slice(0, 10);
  }
  
  save(STORAGE_KEYS.EXERCISE_HISTORY, history);
}

// Retorna o último desempenho de um exercício (melhor set válido)
export function getLastExercisePerformance(exerciseId: string): { kg: number; reps: number; timestamp: string } | null {
  const history = getExerciseHistory();
  const snapshots = history[exerciseId];
  
  if (!snapshots || snapshots.length === 0) return null;
  
  const lastSnapshot = snapshots[0];
  
  // Encontra o melhor set (maior kg × reps)
  let bestSet = { kg: 0, reps: 0 };
  for (const set of lastSnapshot.workSets) {
    if (set.kg * set.reps > bestSet.kg * bestSet.reps) {
      bestSet = set;
    }
  }
  
  return {
    kg: bestSet.kg,
    reps: bestSet.reps,
    timestamp: lastSnapshot.timestamp,
  };
}

// Calcula sugestão de progressão para um exercício (meta dinâmica baseada no último treino)
export function getProgressionSuggestion(exerciseId: string, repsRange: string): ProgressionSuggestion {
  const history = getExerciseHistory();
  const snapshots = history[exerciseId];
  
  // Parse repsRange (ex: "6–10" ou "8-12")
  const rangeMatch = repsRange.match(/(\d+)[–-](\d+)/);
  const lowerLimit = rangeMatch ? parseInt(rangeMatch[1]) : 6;
  const upperLimit = rangeMatch ? parseInt(rangeMatch[2]) : 10;
  
  // Sem histórico
  if (!snapshots || snapshots.length === 0) {
    return {
      status: "return",
      statusLabel: "Retorno",
      statusIcon: "🕒",
      message: "Primeiro treino deste exercício",
      metaHoje: `Faça ${lowerLimit}–${upperLimit} reps nas séries válidas`,
    };
  }
  
  const lastSnapshot = snapshots[0];
  const workSets = lastSnapshot.workSets;
  
  // Verifica se todas as séries atingiram o topo da faixa
  const allAtTop = workSets.length > 0 && workSets.every(set => set.reps >= upperLimit);
  
  // Encontra a carga usada (maior kg) e a maior reps
  const maxKg = Math.max(...workSets.map(s => s.kg), 0);
  const maxReps = Math.max(...workSets.map(s => s.reps), lowerLimit);
  
  if (allAtTop) {
    const suggestedLoad = Math.round(maxKg * 1.025 * 2) / 2; // Arredonda para 0.5kg
    return {
      status: "ready",
      statusLabel: "Pronto p/ subir",
      statusIcon: "✅",
      message: `Sugestão: +2,5% → ${suggestedLoad} kg na próxima`,
      metaHoje: `Manter ${upperLimit} reps com ${maxKg} kg (confirmar)`,
      suggestedNextLoad: suggestedLoad,
    };
  }
  
  // Meta dinâmica: tentar subir reps baseado no último treino
  const targetReps = Math.min(maxReps + 1, upperLimit);
  const repsNeeded = targetReps === upperLimit ? upperLimit : `${targetReps}–${upperLimit}`;
  
  return {
    status: "maintain",
    statusLabel: "Manter",
    statusIcon: "⏳",
    message: "Mantenha a carga e tente aumentar reps",
    metaHoje: `Tentar ${repsNeeded} reps com ${maxKg} kg`,
  };
}

// Obtém sugestões salvas (quando usuário clica "Aplicar sugestão")
export function getProgressionSuggestions(): ProgressionSuggestions {
  return load(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, {});
}

// Salva sugestão de próxima carga para um exercício
export function saveProgressionSuggestion(exerciseId: string, suggestedNextLoad: number): void {
  const suggestions = getProgressionSuggestions();
  suggestions[exerciseId] = {
    suggestedNextLoad,
    appliedAt: new Date().toISOString(),
  };
  save(STORAGE_KEYS.PROGRESSION_SUGGESTIONS, suggestions);
}

// Formata timestamp para data relativa (ex: "há 3 dias")
export function formatRelativeDate(timestamp: string): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "hoje";
  if (diffDays === 1) return "ontem";
  if (diffDays < 7) return `há ${diffDays} dias`;
  if (diffDays < 30) return `há ${Math.floor(diffDays / 7)} sem.`;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Obtém o último treino de um workout específico
export function getLastWorkoutDate(workoutId: string): string | null {
  const history = getExerciseHistory();
  
  // Procura qualquer exercício deste workout
  for (const exerciseId in history) {
    const snapshots = history[exerciseId];
    for (const snapshot of snapshots) {
      if (snapshot.workoutId === workoutId) {
        return snapshot.timestamp;
      }
    }
  }
  
  return null;
}

// ======= USER WORKOUT PLAN =======

import { workouts as defaultWorkouts, type Workout, type Exercise, type SetData } from "@/data/workouts";

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

// Converte workout padrão para formato de usuário
function convertDefaultWorkout(workout: Workout): UserWorkout {
  return {
    id: workout.id,
    titulo: workout.titulo,
    duracaoEstimada: workout.duracaoEstimada,
    exercicios: workout.exercicios.map((ex) => ({
      id: ex.id,
      nome: ex.nome,
      muscleGroup: ex.tags.find(t => t !== "Principal" && t !== "Acessório") || "Outro",
      tags: ex.tags,
      repsRange: ex.repsRange,
      descansoSeg: ex.descansoSeg,
      warmupEnabled: ex.warmupEnabled,
      feederSetsDefault: ex.feederSetsDefault,
      workSetsDefault: ex.workSetsDefault,
    })),
  };
}

// Obtém plano de treino do usuário (ou padrão se não existir)
export function getUserWorkoutPlan(): UserWorkoutPlan {
  const stored = load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null);
  
  if (stored) {
    return stored;
  }
  
  // Retorna plano padrão convertido
  const defaultPlan: UserWorkoutPlan = {
    workouts: Object.values(defaultWorkouts).map(convertDefaultWorkout),
    updatedAt: new Date().toISOString(),
  };
  
  return defaultPlan;
}

// Salva plano de treino customizado do usuário
export function saveUserWorkoutPlan(plan: UserWorkoutPlan): void {
  plan.updatedAt = new Date().toISOString();
  save(STORAGE_KEYS.USER_WORKOUT_PLAN, plan);
}

// Reseta plano para o padrão
export function resetUserWorkoutPlan(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_WORKOUT_PLAN);
}

// Verifica se existe plano customizado
export function hasCustomWorkoutPlan(): boolean {
  return load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null) !== null;
}

// Obtém um workout específico do plano do usuário
export function getUserWorkout(id: string): UserWorkout | undefined {
  const plan = getUserWorkoutPlan();
  return plan.workouts.find(w => w.id === id);
}

// Obtém um exercício específico do plano do usuário
export function getUserExercise(workoutId: string, exerciseId: string): UserExercise | undefined {
  const workout = getUserWorkout(workoutId);
  if (!workout) return undefined;
  return workout.exercicios.find(e => e.id === exerciseId);
}

// Obtém próximo exercício do plano do usuário
export function getUserNextExercise(workoutId: string, currentExerciseId: string): UserExercise | null {
  const workout = getUserWorkout(workoutId);
  if (!workout) return null;
  
  const currentIndex = workout.exercicios.findIndex(e => e.id === currentExerciseId);
  if (currentIndex === -1 || currentIndex >= workout.exercicios.length - 1) {
    return null;
  }
  
  return workout.exercicios[currentIndex + 1];
}

// Verifica se é o último exercício do workout
export function isUserLastExercise(workoutId: string, exerciseId: string): boolean {
  const workout = getUserWorkout(workoutId);
  if (!workout) return true;
  
  const lastExercise = workout.exercicios[workout.exercicios.length - 1];
  return lastExercise?.id === exerciseId;
}

// ======= WEIGHT HISTORY =======

export interface WeightEntry {
  weight: number;
  timestamp: string;
}

export function getWeightHistory(): WeightEntry[] {
  return load(STORAGE_KEYS.WEIGHT_HISTORY, []);
}

export function saveWeight(weight: number): void {
  const history = getWeightHistory();
  history.unshift({
    weight,
    timestamp: new Date().toISOString(),
  });
  save(STORAGE_KEYS.WEIGHT_HISTORY, history.slice(0, 100)); // Keep last 100 entries
  
  // Mark quest as done
  const quests = getQuests();
  quests.registrarPesoDone = true;
  saveQuests(quests);
}

export function hasWeightThisWeek(): boolean {
  const history = getWeightHistory();
  if (history.length === 0) return false;
  
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);
  
  const lastEntry = new Date(history[0].timestamp);
  return lastEntry >= startOfWeek;
}

// ======= WORKOUTS COMPLETED =======

export interface WorkoutCompleted {
  workoutId: string;
  timestamp: string;
  totalVolume: number;
}

export function getWorkoutsCompleted(): WorkoutCompleted[] {
  return load(STORAGE_KEYS.WORKOUTS_COMPLETED, []);
}

export function saveWorkoutCompleted(workoutId: string, totalVolume: number): void {
  const completed = getWorkoutsCompleted();
  completed.unshift({
    workoutId,
    timestamp: new Date().toISOString(),
    totalVolume,
  });
  save(STORAGE_KEYS.WORKOUTS_COMPLETED, completed);
}

export function getTotalWorkoutsCompleted(): number {
  return getWorkoutsCompleted().length;
}

export function getTotalVolume(): number {
  return getWorkoutsCompleted().reduce((sum, w) => sum + w.totalVolume, 0);
}

// Count PRs (simplified: count unique exercises that have history)
export function getPRsCount(): number {
  const history = getExerciseHistory();
  return Object.keys(history).length;
}

// ======= ACHIEVEMENTS SYSTEM =======

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  xp: number;
  unlocked: boolean;
  progress?: number;
  target?: number;
}

export function getAchievements(): Achievement[] {
  const profile = getProfile();
  const totalWorkouts = getTotalWorkoutsCompleted();
  const prsCount = getPRsCount();
  
  return [
    {
      id: "streak-3",
      name: "Consistente",
      description: "Mantenha streak de 3 dias",
      icon: "flame",
      color: "from-orange-500/20 to-orange-700/20",
      xp: 50,
      unlocked: profile.streakDias >= 3,
      progress: Math.min(profile.streakDias, 3),
      target: 3,
    },
    {
      id: "streak-7",
      name: "Semana de Fogo",
      description: "Mantenha streak de 7 dias",
      icon: "flame",
      color: "from-orange-500/20 to-red-700/20",
      xp: 150,
      unlocked: profile.streakDias >= 7,
      progress: Math.min(profile.streakDias, 7),
      target: 7,
    },
    {
      id: "streak-30",
      name: "Máquina Imparável",
      description: "Mantenha streak de 30 dias",
      icon: "crown",
      color: "from-yellow-500/20 to-amber-700/20",
      xp: 500,
      unlocked: profile.streakDias >= 30,
      progress: Math.min(profile.streakDias, 30),
      target: 30,
    },
    {
      id: "workouts-1",
      name: "Primeiro Treino",
      description: "Complete seu primeiro treino",
      icon: "dumbbell",
      color: "from-blue-500/20 to-blue-700/20",
      xp: 50,
      unlocked: totalWorkouts >= 1,
      progress: Math.min(totalWorkouts, 1),
      target: 1,
    },
    {
      id: "workouts-10",
      name: "Dedicado",
      description: "Complete 10 treinos",
      icon: "dumbbell",
      color: "from-blue-500/20 to-indigo-700/20",
      xp: 200,
      unlocked: totalWorkouts >= 10,
      progress: Math.min(totalWorkouts, 10),
      target: 10,
    },
    {
      id: "workouts-50",
      name: "Atleta",
      description: "Complete 50 treinos",
      icon: "trophy",
      color: "from-purple-500/20 to-purple-700/20",
      xp: 500,
      unlocked: totalWorkouts >= 50,
      progress: Math.min(totalWorkouts, 50),
      target: 50,
    },
    {
      id: "workouts-100",
      name: "Lenda",
      description: "Complete 100 treinos",
      icon: "crown",
      color: "from-yellow-500/20 to-orange-700/20",
      xp: 1000,
      unlocked: totalWorkouts >= 100,
      progress: Math.min(totalWorkouts, 100),
      target: 100,
    },
    {
      id: "prs-1",
      name: "Primeiro PR",
      description: "Registre seu primeiro exercício",
      icon: "trending",
      color: "from-green-500/20 to-green-700/20",
      xp: 50,
      unlocked: prsCount >= 1,
      progress: Math.min(prsCount, 1),
      target: 1,
    },
    {
      id: "prs-5",
      name: "Progredindo",
      description: "Registre 5 exercícios diferentes",
      icon: "trending",
      color: "from-green-500/20 to-emerald-700/20",
      xp: 150,
      unlocked: prsCount >= 5,
      progress: Math.min(prsCount, 5),
      target: 5,
    },
    {
      id: "prs-10",
      name: "Mestre da Progressão",
      description: "Registre 10 exercícios diferentes",
      icon: "star",
      color: "from-amber-500/20 to-yellow-700/20",
      xp: 300,
      unlocked: prsCount >= 10,
      progress: Math.min(prsCount, 10),
      target: 10,
    },
    {
      id: "level-5",
      name: "Nível 5",
      description: "Alcance o nível 5",
      icon: "zap",
      color: "from-cyan-500/20 to-cyan-700/20",
      xp: 100,
      unlocked: profile.level >= 5,
      progress: Math.min(profile.level, 5),
      target: 5,
    },
    {
      id: "level-10",
      name: "Nível 10",
      description: "Alcance o nível 10",
      icon: "zap",
      color: "from-indigo-500/20 to-indigo-700/20",
      xp: 250,
      unlocked: profile.level >= 10,
      progress: Math.min(profile.level, 10),
      target: 10,
    },
  ];
}

// Check if nutrition quest should be marked done (at least 1 consumed item today)
export function checkNutritionQuestStatus(): boolean {
  const today = getNutritionToday();
  for (const meal of today.meals) {
    for (const entry of meal.entries) {
      if (entry.consumed) {
        return true;
      }
    }
  }
  return false;
}

// Sync quests status based on real data
export function syncQuestsStatus(): void {
  const quests = getQuests();
  
  // Check nutrition
  quests.registrarAlimentacaoDone = checkNutritionQuestStatus();
  
  // Check weight (weekly)
  quests.registrarPesoDone = hasWeightThisWeek();
  
  // Treino do dia is already updated when workout is completed
  
  saveQuests(quests);
}
