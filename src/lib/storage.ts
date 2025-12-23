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
  checked?: boolean;
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
          checked: false,
        })) || [];
        return { ...m, entries };
      }),
    };
    save(STORAGE_KEYS.NUTRITION_TODAY, fresh);
    return fresh;
  }
  
  return stored;
}

export function saveNutritionToday(today: NutritionToday): void {
  save(STORAGE_KEYS.NUTRITION_TODAY, today);
}

export function addFoodToToday(mealId: string, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop", source: "diet" | "extra" | "auto" = "extra"): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  if (!meal) {
    // Se a refeição não existe, criar
    today.meals.push({
      id: mealId,
      nome: mealId,
      entries: [{
        id: crypto.randomUUID(),
        foodId,
        quantidade,
        unidade,
        source,
        createdAt: Date.now(),
      }],
    });
  } else {
    meal.entries.push({
      id: crypto.randomUUID(),
      foodId,
      quantidade,
      unidade,
      source,
      createdAt: Date.now(),
    });
  }
  
  saveNutritionToday(today);
  
  // Marcar quest como feita
  const quests = getQuests();
  if (!quests.registrarAlimentacaoDone) {
    quests.registrarAlimentacaoDone = true;
    saveQuests(quests);
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
        });
      }
    }
  }
  
  saveNutritionToday(today);
  
  // Marcar quest como feita
  if (today.meals.some(m => m.entries.length > 0)) {
    const quests = getQuests();
    quests.registrarAlimentacaoDone = true;
    saveQuests(quests);
  }
}

export function hasDietSaved(): boolean {
  const diet = getNutritionDiet();
  return diet !== null && diet.meals.some(m => m.items.length > 0);
}

export function isTodayEmpty(): boolean {
  const today = getNutritionToday();
  return today.meals.every(m => m.entries.length === 0);
}

export function toggleFoodChecked(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  
  if (meal) {
    const entry = meal.entries.find(e => e.id === entryId);
    if (entry) {
      entry.checked = !entry.checked;
      saveNutritionToday(today);
    }
  }
}

export function isMealComplete(mealId: string): boolean {
  const today = getNutritionToday();
  const meal = today.meals.find(m => m.id === mealId);
  if (!meal || meal.entries.length === 0) return false;
  return meal.entries.every(e => e.checked === true);
}
