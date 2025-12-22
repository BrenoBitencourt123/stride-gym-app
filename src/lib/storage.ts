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
