// src/lib/storage.ts
// Utilitários de persistência localStorage + hidratação automática do AppState (multi-dispositivo)

const APP_STATE_KEY = "levelup.appState";
const APPSTATE_CHANGED_EVENT = "levelup:appstate-changed";
const SUPPRESS_AUTOSYNC_FLAG = "__LEVELUP_SUPPRESS_AUTOSYNC__";

const isBrowser = typeof window !== "undefined";

// ===== Hydration control (evita loops quando AppState sincroniza keys legadas)
let hydrationSuppressed = false;

/**
 * Use isso quando você for escrever várias keys legadas a partir do AppState
 * (ex.: syncToLegacyKeys), para não entrar em loop de re-hidratação.
 */
export function suppressAppStateHydration<T>(fn: () => T): T {
  hydrationSuppressed = true;
  try {
    return fn();
  } finally {
    hydrationSuppressed = false;
  }
}

// ===== Auto-hidratação: quando salvar uma key legada, aplicar no AppState
type HydrationQueueEntry = { key: string; value: unknown };
const hydrationQueue = new Map<string, unknown>();
let hydrationScheduled = false;
let hydrationRunning = false;

function emitAppStateChanged() {
  if (!isBrowser) return;
  if ((globalThis as any)[SUPPRESS_AUTOSYNC_FLAG]) return;
  window.dispatchEvent(new CustomEvent(APPSTATE_CHANGED_EVENT));
}

function afterLocalSave(key: string, value: unknown) {
  // Quando AppState muda: avisa o sync
  if (key === APP_STATE_KEY) {
    emitAppStateChanged();
    return;
  }

  // Se estamos suprimindo (ex.: syncToLegacyKeys), não hidrata
  if (hydrationSuppressed) return;

  // Só hidratar keys relevantes
  if (!HYDRATE_KEYS.has(key)) return;

  hydrationQueue.set(key, value);

  if (hydrationScheduled) return;
  hydrationScheduled = true;

  queueMicrotask(async () => {
    hydrationScheduled = false;
    if (hydrationRunning) return;
    hydrationRunning = true;

    try {
      const entries: HydrationQueueEntry[] = Array.from(hydrationQueue.entries()).map(([k, v]) => ({
        key: k,
        value: v,
      }));
      hydrationQueue.clear();
      if (entries.length === 0) return;

      const { getLocalState, setLocalState } = await import("./appState");
      const state = getLocalState();

      let changed = false;
      for (const e of entries) {
        changed = applyLegacyKeyPatch(state as any, e.key, e.value) || changed;
      }

      if (changed) {
        // Isso salva APP_STATE_KEY e dispara o evento de sync
        setLocalState(state as any);
      }
    } catch (err) {
      console.warn("[storage] Falha ao hidratar AppState:", err);
    } finally {
      hydrationRunning = false;
    }
  });
}

function safeObj(v: any): v is Record<string, any> {
  return v && typeof v === "object";
}

function ensureNutrition(state: any) {
  if (!state.nutrition) {
    state.nutrition = {
      targets: { kcal: 2050, protein: 160, carbs: 200, fats: 65 },
      dailyLogs: {},
    };
  }
  if (!state.nutrition.targets) {
    state.nutrition.targets = { kcal: 2050, protein: 160, carbs: 200, fats: 65 };
  }
  if (!state.nutrition.dailyLogs) {
    state.nutrition.dailyLogs = {};
  }
}

/**
 * Aplica patch no AppState baseado na key legada que foi salva.
 * Retorna true se mudou algo.
 */
function applyLegacyKeyPatch(state: any, key: string, value: unknown): boolean {
  if (!state || typeof state !== "object") return false;

  // Garantir objetos base
  if (!state.bodyweight) state.bodyweight = { entries: [] };
  if (!state.progression) {
    state.progression = {
      accountLevel: 1,
      xp: 0,
      xpToNext: 500,
      streakDays: 0,
      shields: 0,
      multiplier: 1,
    };
  }
  ensureNutrition(state);

  // ===== Mapeamentos principais =====
  switch (key) {
    case STORAGE_KEYS.PROFILE: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.progression);
      state.progression.accountLevel = Number(value.level ?? state.progression.accountLevel);
      state.progression.xp = Number(value.xpAtual ?? state.progression.xp);
      state.progression.xpToNext = Number(value.xpMeta ?? state.progression.xpToNext);
      state.progression.streakDays = Number(value.streakDias ?? state.progression.streakDays);
      state.progression.multiplier = Number(value.multiplier ?? state.progression.multiplier);
      state.progression.shields = Number(value.shields ?? state.progression.shields);
      return JSON.stringify(state.progression) !== prev;
    }

    case STORAGE_KEYS.QUESTS: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.quests ?? null);
      state.quests = value;
      return JSON.stringify(state.quests ?? null) !== prev;
    }

    case STORAGE_KEYS.USER_WORKOUT_PLAN: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.plan ?? null);
      state.plan = value;
      return JSON.stringify(state.plan ?? null) !== prev;
    }

    case STORAGE_KEYS.EXERCISE_HISTORY: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.exerciseHistory ?? null);
      state.exerciseHistory = value;
      return JSON.stringify(state.exerciseHistory ?? null) !== prev;
    }

    case STORAGE_KEYS.WORKOUTS_COMPLETED: {
      if (!Array.isArray(value)) return false;
      const prev = JSON.stringify(state.workoutHistory ?? null);
      state.workoutHistory = value;
      return JSON.stringify(state.workoutHistory ?? null) !== prev;
    }

    case STORAGE_KEYS.TREINO_PROGRESSO: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.treinoProgresso ?? null);
      state.treinoProgresso = value;
      return JSON.stringify(state.treinoProgresso ?? null) !== prev;
    }

    case STORAGE_KEYS.PROGRESSION_SUGGESTIONS: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.progressionSuggestions ?? null);
      state.progressionSuggestions = value;
      return JSON.stringify(state.progressionSuggestions ?? null) !== prev;
    }

    case STORAGE_KEYS.TREINO_HOJE: {
      const prev = JSON.stringify(state.treinoHoje ?? null);
      state.treinoHoje = value as any;
      return JSON.stringify(state.treinoHoje ?? null) !== prev;
    }

    case STORAGE_KEYS.WEIGHT_HISTORY: {
      if (!Array.isArray(value)) return false;
      const prev = JSON.stringify(state.bodyweight?.entries ?? []);
      state.bodyweight.entries = (value as any[]).map((w) => ({
        date: String(w.timestamp || "").split("T")[0] || String(w.date || ""),
        weight: Number(w.weight ?? 0),
        updatedAt: w.timestamp ? new Date(w.timestamp).getTime() : Date.now(),
      }));
      return JSON.stringify(state.bodyweight?.entries ?? []) !== prev;
    }

    case STORAGE_KEYS.NUTRITION_GOALS: {
      if (!safeObj(value)) return false;
      const prev = JSON.stringify(state.nutrition.targets);
      state.nutrition.targets = {
        kcal: Number(value.kcalTarget ?? state.nutrition.targets.kcal),
        protein: Number(value.pTarget ?? state.nutrition.targets.protein),
        carbs: Number(value.cTarget ?? state.nutrition.targets.carbs),
        fats: Number(value.gTarget ?? state.nutrition.targets.fats),
      };
      return JSON.stringify(state.nutrition.targets) !== prev;
    }

    case STORAGE_KEYS.NUTRITION_DIET: {
      const prev = JSON.stringify(state.nutrition.dietPlan ?? null);
      state.nutrition.dietPlan = (value as any) || undefined;
      return JSON.stringify(state.nutrition.dietPlan ?? null) !== prev;
    }

    case STORAGE_KEYS.NUTRITION_TODAY: {
      if (!safeObj(value)) return false;
      const dateKey = String((value as any).dateKey || "");
      if (!dateKey) return false;
      const prev = JSON.stringify(state.nutrition.dailyLogs?.[dateKey] ?? null);
      state.nutrition.dailyLogs[dateKey] = value;
      return JSON.stringify(state.nutrition.dailyLogs?.[dateKey] ?? null) !== prev;
    }

    case STORAGE_KEYS.NUTRITION_COMPLETED: {
      const prev = JSON.stringify(state.nutritionCompleted ?? null);
      state.nutritionCompleted = value as any;
      return JSON.stringify(state.nutritionCompleted ?? null) !== prev;
    }

    case "levelup.nutritionLogs": {
      // Logs agregados usados nos gráficos
      if (!Array.isArray(value)) return false;
      const prev = JSON.stringify(state.nutrition.totalsLogs ?? []);
      state.nutrition.totalsLogs = value;
      return JSON.stringify(state.nutrition.totalsLogs ?? []) !== prev;
    }

    default:
      return false;
  }
}

// ===== Keys relevantes para hidratar AppState automaticamente =====
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

const HYDRATE_KEYS = new Set<string>([
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.TREINO_PROGRESSO,
  STORAGE_KEYS.QUESTS,
  STORAGE_KEYS.TREINO_HOJE,
  STORAGE_KEYS.NUTRITION_GOALS,
  STORAGE_KEYS.NUTRITION_DIET,
  STORAGE_KEYS.NUTRITION_TODAY,
  STORAGE_KEYS.NUTRITION_COMPLETED,
  STORAGE_KEYS.EXERCISE_HISTORY,
  STORAGE_KEYS.PROGRESSION_SUGGESTIONS,
  STORAGE_KEYS.USER_WORKOUT_PLAN,
  STORAGE_KEYS.WEIGHT_HISTORY,
  STORAGE_KEYS.WORKOUTS_COMPLETED,
  "levelup.nutritionLogs",
]);

// ===========================
// Persistência local (base)
// ===========================

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
    afterLocalSave(key, value);
  } catch (error) {
    console.error("Failed to save to localStorage:", error);
  }
}

export function mergeSave<T extends Record<string, unknown>>(key: string, partial: Partial<T>): void {
  try {
    const existing = load<T>(key, {} as T);
    const merged = { ...existing, ...partial };
    save(key, merged as any);
  } catch (error) {
    console.error("Failed to merge save to localStorage:", error);
  }
}

// ===========================
// Tipos de dados persistidos
// ===========================

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
    count += exerciseProgress.feederSets.filter((s) => s.done).length;
    count += exerciseProgress.workSets.filter((s) => s.done).length;
  }
  return count;
}

export function isExerciseComplete(treinoId: string, exercicioId: string): boolean {
  const progress = getExerciseProgress(treinoId, exercicioId);
  if (!progress || progress.workSets.length === 0) return false;
  return progress.workSets.every((s) => s.done);
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
    saveTreinoProgresso(progresso);
  }
}

export function getWorkoutSummaryStats(treinoId: string): {
  completedSets: number;
  totalSets: number;
  totalVolume: number;
} {
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
      meals: DEFAULT_MEALS.map((m) => {
        const dietMeal = diet?.meals.find((dm) => dm.id === m.id);
        const entries: TodayEntry[] =
          dietMeal?.items.map((item) => ({
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
      if ((entry as any).planned === undefined) {
        (entry as any).planned = entry.source === "diet";
        needsSave = true;
      }
      if ((entry as any).consumed === undefined) {
        (entry as any).consumed = entry.source !== "diet";
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
    meals: DEFAULT_MEALS.map((m) => {
      const dietMeal = diet?.meals.find((dm) => dm.id === m.id);
      const entries: TodayEntry[] =
        dietMeal?.items.map((item) => ({
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

export function addFoodToToday(
  mealId: string,
  foodId: string,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop",
  source: "diet" | "extra" | "auto" = "extra",
): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);

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

export function addFoodToDiet(
  mealId: string,
  foodId: string,
  quantidade: number,
  unidade: "g" | "un" | "ml" | "scoop",
): void {
  let diet = getNutritionDiet();

  if (!diet) {
    diet = {
      meals: DEFAULT_MEALS.map((m) => ({ id: m.id, nome: m.nome, items: [] })),
    };
  }

  const meal = diet.meals.find((m) => m.id === mealId);
  if (meal) {
    meal.items.push({ foodId, quantidade, unidade });
  }

  saveNutritionDiet(diet);
}

export function removeFoodFromDiet(mealId: string, index: number): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const meal = diet.meals.find((m) => m.id === mealId);
  if (meal && meal.items[index]) {
    meal.items.splice(index, 1);
    saveNutritionDiet(diet);
  }
}

export function updateFoodInDiet(mealId: string, index: number, newQuantity: number): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const meal = diet.meals.find((m) => m.id === mealId);
  if (meal && meal.items[index]) {
    meal.items[index].quantidade = newQuantity;
    saveNutritionDiet(diet);
  }
}

export function updateFoodInToday(mealId: string, entryId: string, newQuantity: number): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);

  if (meal) {
    const entry = meal.entries.find((e) => e.id === entryId);
    if (entry) {
      entry.quantidade = newQuantity;
      saveNutritionToday(today);
    }
  }
}

export function removeFoodFromToday(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);

  if (meal) {
    meal.entries = meal.entries.filter((e) => e.id !== entryId);
    saveNutritionToday(today);
  }
}

export function applyDietToToday(): void {
  const diet = getNutritionDiet();
  if (!diet) return;

  const today = getNutritionToday();

  for (const dietMeal of diet.meals) {
    const todayMeal = today.meals.find((m) => m.id === dietMeal.id);
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
  return diet !== null && diet.meals.some((m) => m.items.length > 0);
}

export function isTodayEmpty(): boolean {
  const today = getNutritionToday();
  return today.meals.every((m) => m.entries.length === 0);
}

export function toggleFoodConsumed(mealId: string, entryId: string): void {
  const today = getNutritionToday();
  const meal = today.meals.find((m) => m.id === mealId);

  if (meal) {
    const entry = meal.entries.find((e) => e.id === entryId);
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
  const meal = today.meals.find((m) => m.id === mealId);
  if (!meal) return false;

  const plannedItems = meal.entries.filter((e) => e.planned);
  if (plannedItems.length === 0) return false;

  return plannedItems.every((e) => e.consumed === true);
}

// ======= NUTRITION COMPLETION =======

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
    const plannedItems = meal.entries.filter((e) => e.planned);
    if (plannedItems.length > 0 && plannedItems.every((e) => e.consumed)) {
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
  workSets: ExerciseSetSnapshot[],
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

// ======= USER WORKOUT PLAN =======
import { workouts as defaultWorkouts, type Workout, type SetData } from "@/data/workouts";

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
  plan.updatedAt = new Date().toISOString();
  save(STORAGE_KEYS.USER_WORKOUT_PLAN, plan);
}

export function resetUserWorkoutPlan(): void {
  localStorage.removeItem(STORAGE_KEYS.USER_WORKOUT_PLAN);
}

export function hasCustomWorkoutPlan(): boolean {
  return load<UserWorkoutPlan | null>(STORAGE_KEYS.USER_WORKOUT_PLAN, null) !== null;
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
  save(STORAGE_KEYS.WEIGHT_HISTORY, history.slice(0, 100));

  const quests = getQuests();
  quests.registrarPesoDone = true;
  saveQuests(quests);
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

// ======= NUTRITION DAILY LOGS (para gráficos) =======

export interface NutritionDailyLog {
  dateKey: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function getNutritionLogs(): NutritionDailyLog[] {
  return load("levelup.nutritionLogs", []);
}

export function saveNutritionLog(log: NutritionDailyLog): void {
  const logs = getNutritionLogs();
  const existingIndex = logs.findIndex((l) => l.dateKey === log.dateKey);
  if (existingIndex >= 0) {
    logs[existingIndex] = log;
  } else {
    logs.unshift(log);
  }
  save("levelup.nutritionLogs", logs.slice(0, 90));
}

// ======= PROGRESS ANALYTICS =======

export function calculateE1RM(kg: number, reps: number): number {
  if (reps <= 0 || kg <= 0) return 0;
  return Math.round(kg * (1 + reps / 30));
}

// ======= MISSING FUNCTIONS =======

// Busca um treino do plano do usuário pelo ID
export function getUserWorkout(workoutId: string): UserWorkout | null {
  const plan = getUserWorkoutPlan();
  return plan.workouts.find((w) => w.id === workoutId) || null;
}

// Busca um exercício específico dentro de um treino
export function getUserExercise(workoutId: string, exerciseId: string): UserExercise | null {
  const workout = getUserWorkout(workoutId);
  if (!workout) return null;
  return workout.exercicios.find((e) => e.id === exerciseId) || null;
}

// Retorna o próximo exercício de um treino
export function getUserNextExercise(workoutId: string, currentExerciseId: string): UserExercise | null {
  const workout = getUserWorkout(workoutId);
  if (!workout) return null;
  const currentIndex = workout.exercicios.findIndex((e) => e.id === currentExerciseId);
  if (currentIndex === -1 || currentIndex >= workout.exercicios.length - 1) return null;
  return workout.exercicios[currentIndex + 1];
}

// Verifica se é o último exercício do treino
export function isUserLastExercise(workoutId: string, exerciseId: string): boolean {
  const workout = getUserWorkout(workoutId);
  if (!workout || workout.exercicios.length === 0) return false;
  return workout.exercicios[workout.exercicios.length - 1].id === exerciseId;
}

// Obtém última performance de um exercício
export function getLastExercisePerformance(exerciseId: string): ExerciseSnapshot | null {
  const history = getExerciseHistory();
  const exerciseHistory = history[exerciseId];
  if (!exerciseHistory || exerciseHistory.length === 0) return null;
  return exerciseHistory[0];
}

// Obtém sugestão de progressão para um exercício
export function getProgressionSuggestion(exerciseId: string, repsRange: string): ProgressionSuggestion {
  const lastPerformance = getLastExercisePerformance(exerciseId);
  const savedSuggestions = getProgressionSuggestions();
  const savedSuggestion = savedSuggestions[exerciseId];

  // Padrão: manter
  const defaultSuggestion: ProgressionSuggestion = {
    status: "maintain",
    statusLabel: "Manter carga",
    statusIcon: "🔄",
    message: "Primeira sessão! Comece com uma carga confortável.",
    metaHoje: repsRange,
  };

  if (!lastPerformance) return defaultSuggestion;

  // Analisa a última performance
  const lastSets = lastPerformance.workSets;
  if (lastSets.length === 0) return defaultSuggestion;

  const avgReps = lastSets.reduce((sum, s) => sum + s.reps, 0) / lastSets.length;
  const lastKg = lastSets[0]?.kg || 0;
  const [minReps, maxReps] = repsRange.split("–").map((r) => parseInt(r.trim()));

  // Se tem sugestão salva, usar ela
  if (savedSuggestion) {
    return {
      status: "ready",
      statusLabel: "Progressão aplicada",
      statusIcon: "✅",
      message: `Carga sugerida: ${savedSuggestion.suggestedNextLoad}kg`,
      metaHoje: repsRange,
      suggestedNextLoad: savedSuggestion.suggestedNextLoad,
    };
  }

  // Lógica de progressão
  if (avgReps >= maxReps) {
    const suggestedLoad = Math.round(lastKg * 1.025 * 2) / 2; // +2.5%, arredonda para 0.5kg
    return {
      status: "ready",
      statusLabel: "Pronto para progredir",
      statusIcon: "🔥",
      message: `Atingiu ${maxReps} reps! Sugiro aumentar para ${suggestedLoad}kg`,
      metaHoje: repsRange,
      suggestedNextLoad: suggestedLoad,
    };
  }

  if (avgReps < minReps) {
    return {
      status: "return",
      statusLabel: "Consolidar",
      statusIcon: "🎯",
      message: `Média de ${avgReps.toFixed(1)} reps. Mantenha ${lastKg}kg até atingir ${minReps}+ reps.`,
      metaHoje: repsRange,
    };
  }

  return {
    status: "maintain",
    statusLabel: "Manter carga",
    statusIcon: "🔄",
    message: `Continue com ${lastKg}kg até atingir ${maxReps} reps em todas as séries.`,
    metaHoje: repsRange,
  };
}

// Formata data relativa
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `${diffDays} dias atrás`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} semana${diffDays >= 14 ? "s" : ""} atrás`;
  return `${Math.floor(diffDays / 30)} mês${diffDays >= 60 ? "es" : ""} atrás`;
}

// Obtém data do último treino de um workout específico
export function getLastWorkoutDate(workoutId: string): string | null {
  const completed = getWorkoutsCompleted();
  const lastWorkout = completed.find((w) => w.workoutId === workoutId);
  return lastWorkout?.timestamp || null;
}

// ======= ACHIEVEMENTS =======

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp: number;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  progressMax?: number;
  target?: number;
  color?: string;
}

export function getAchievements(): Achievement[] {
  const workoutsCompleted = getWorkoutsCompleted().length;
  const weightHistory = getWeightHistory();
  const profile = getProfile();

  const achievements: Achievement[] = [
    {
      id: "first-workout",
      name: "Primeiro Treino",
      description: "Complete seu primeiro treino",
      icon: "dumbbell",
      xp: 50,
      unlocked: workoutsCompleted >= 1,
      unlockedAt: workoutsCompleted >= 1 ? getWorkoutsCompleted()[workoutsCompleted - 1]?.timestamp : undefined,
      color: "from-blue-500 to-blue-600",
    },
    {
      id: "week-warrior",
      name: "Guerreiro da Semana",
      description: "Complete 5 treinos",
      icon: "flame",
      xp: 100,
      unlocked: workoutsCompleted >= 5,
      progress: Math.min(workoutsCompleted, 5),
      progressMax: 5,
      target: 5,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "consistency-king",
      name: "Rei da Consistência",
      description: "Mantenha 7 dias de streak",
      icon: "crown",
      xp: 150,
      unlocked: profile.streakDias >= 7,
      progress: Math.min(profile.streakDias, 7),
      progressMax: 7,
      target: 7,
      color: "from-yellow-500 to-amber-500",
    },
    {
      id: "weight-tracker",
      name: "Monitoramento",
      description: "Registre seu peso 10 vezes",
      icon: "scale",
      xp: 75,
      unlocked: weightHistory.length >= 10,
      progress: Math.min(weightHistory.length, 10),
      progressMax: 10,
      target: 10,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "level-10",
      name: "Nível 10",
      description: "Alcance o nível 10",
      icon: "star",
      xp: 200,
      unlocked: profile.level >= 10,
      progress: Math.min(profile.level, 10),
      progressMax: 10,
      target: 10,
      color: "from-purple-500 to-violet-500",
    },
    {
      id: "month-master",
      name: "Mestre do Mês",
      description: "Complete 20 treinos",
      icon: "trophy",
      xp: 250,
      unlocked: workoutsCompleted >= 20,
      progress: Math.min(workoutsCompleted, 20),
      progressMax: 20,
      target: 20,
      color: "from-primary to-primary/70",
    },
  ];

  return achievements;
}

// ======= SYNC QUESTS STATUS =======

export function syncQuestsStatus(): Quests {
  const quests = getQuests();
  const today = getDateKey();

  // Verificar se treino foi feito hoje
  const treinoHoje = getTreinoHoje();
  if (treinoHoje?.completedAt) {
    const completedDate = treinoHoje.completedAt.split("T")[0];
    if (completedDate === today) {
      quests.treinoDoDiaDone = true;
    }
  }

  // Verificar se peso foi registrado hoje
  const weightHistory = getWeightHistory();
  if (weightHistory.length > 0) {
    const lastWeight = weightHistory[0];
    const weightDate = lastWeight.timestamp.split("T")[0];
    if (weightDate === today) {
      quests.registrarPesoDone = true;
    }
  }

  // Verificar se alimentação foi registrada hoje
  const nutritionToday = getNutritionToday();
  if (nutritionToday.dateKey === today) {
    const hasConsumedFood = nutritionToday.meals.some((m) => m.entries.some((e) => e.consumed));
    if (hasConsumedFood) {
      quests.registrarAlimentacaoDone = true;
    }
  }

  saveQuests(quests);
  return quests;
}

// ======= PROFILE STATS =======

export function getTotalWorkoutsCompleted(): number {
  return getWorkoutsCompleted().length;
}

export function getTotalVolume(): number {
  const completed = getWorkoutsCompleted();
  return completed.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
}

// ======= PROGRESS PAGE FUNCTIONS =======

export interface E1RMDataPoint {
  date: string;
  e1rm: number;
  exerciseName: string;
}

export function getE1RMHistory(exerciseId: string): (E1RMDataPoint & { dateLabel: string })[] {
  const history = getExerciseHistory();
  const exerciseHistory = history[exerciseId];
  if (!exerciseHistory) return [];

  return exerciseHistory
    .map((snapshot) => {
      let bestE1rm = 0;
      for (const set of snapshot.workSets) {
        const e1rm = calculateE1RM(set.kg, set.reps);
        if (e1rm > bestE1rm) bestE1rm = e1rm;
      }

      const dateStr = snapshot.timestamp.split("T")[0];
      return {
        date: dateStr,
        dateLabel: new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        e1rm: bestE1rm,
        exerciseName: exerciseId,
      };
    })
    .reverse();
}

export function getWeeklyVolume(days: number = 30): { week: string; weekLabel: string; volume: number }[] {
  const completed = getWorkoutsCompleted();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  const weeklyData: Record<string, number> = {};

  completed
    .filter((w) => new Date(w.timestamp) >= cutoff)
    .forEach((w) => {
      const date = new Date(w.timestamp);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split("T")[0];

      weeklyData[weekKey] = (weeklyData[weekKey] || 0) + (w.totalVolume || 0);
    });

  return Object.entries(weeklyData)
    .map(([week, volume]) => ({ 
      week, 
      weekLabel: new Date(week).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      volume 
    }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-8);
}

export function getWorkoutsInPeriod(days: number): number {
  const completed = getWorkoutsCompleted();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return completed.filter((w) => new Date(w.timestamp) >= cutoff).length;
}

export function getConsistency(days: number = 30): number {
  const completed = getWorkoutsCompleted();
  if (completed.length < 2) return 0;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const workoutsInPeriod = completed.filter((w) => new Date(w.timestamp) >= cutoff).length;
  const weeksInPeriod = Math.ceil(days / 7);
  const targetWorkouts = weeksInPeriod * 3; // 3x por semana

  return Math.min(Math.round((workoutsInPeriod / targetWorkouts) * 100), 100);
}

export function getPRsCount(): number {
  const history = getExerciseHistory();
  let prs = 0;

  Object.values(history).forEach((exerciseHistory) => {
    if (exerciseHistory.length < 2) return;

    let maxE1RM = 0;
    exerciseHistory.forEach((snapshot) => {
      snapshot.workSets.forEach((set) => {
        const e1rm = calculateE1RM(set.kg, set.reps);
        if (e1rm > maxE1RM) {
          maxE1RM = e1rm;
          prs++;
        }
      });
    });
  });

  return prs;
}

export function getExercisesWithHistory(): { id: string; name: string }[] {
  const history = getExerciseHistory();
  const plan = getUserWorkoutPlan();
  const result: { id: string; name: string }[] = [];

  Object.keys(history).forEach((exerciseId) => {
    for (const workout of plan.workouts) {
      const exercise = workout.exercicios.find((e) => e.id === exerciseId);
      if (exercise) {
        result.push({ id: exerciseId, name: exercise.nome });
        break;
      }
    }
  });

  return result;
}

export interface NutritionChartData {
  date: string;
  dateLabel: string;
  kcal: number;
  kcalMeta: number;
  protein: number;
  carbs: number;
  fat: number;
}

export function getNutritionChartData(days: number = 7): NutritionChartData[] {
  const logs = getNutritionLogs();
  const goals = getNutritionGoals();
  
  return logs
    .slice(0, days)
    .map((log) => ({
      date: log.dateKey,
      dateLabel: new Date(log.dateKey).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
      kcalMeta: goals.kcalTarget,
      kcal: log.kcal,
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
    }))
    .reverse();
}

export interface WeightChartData {
  date: string;
  dateLabel: string;
  weight: number;
}

export function getWeightChartData(days: number = 30): WeightChartData[] {
  const history = getWeightHistory();
  return history
    .slice(0, days)
    .map((entry) => {
      const dateStr = entry.timestamp.split("T")[0];
      return {
        date: dateStr,
        dateLabel: new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
        weight: entry.weight,
      };
    })
    .reverse();
}

export function getWeightVariation(): { current: number; variation: number; delta: number; trend: "up" | "down" | "stable" } {
  const history = getWeightHistory();
  if (history.length === 0) return { current: 0, variation: 0, delta: 0, trend: "stable" };

  const current = history[0].weight;
  if (history.length === 1) return { current, variation: 0, delta: 0, trend: "stable" };

  const previous = history[Math.min(history.length - 1, 7)].weight;
  const variation = Math.round((current - previous) * 10) / 10;

  let trend: "up" | "down" | "stable" = "stable";
  if (variation > 0.5) trend = "up";
  else if (variation < -0.5) trend = "down";

  return { current, variation, delta: variation, trend };
}
