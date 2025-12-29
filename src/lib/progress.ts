// Weight tracking, weekly check-ins, and calorie adjustment system
// Implements conservative, safe adjustments with guardrails
// Supports both weekly (recommended) and daily weighing modes

import { load, save } from './storage';
import { 
  getOnboardingData, 
  saveOnboardingData, 
  calculateMacros,
  Objective,
  OnboardingData 
} from './onboarding';

// ========== STORAGE KEY ==========
const PROGRESS_KEY = 'levelup.progress.v1';

// ========== TYPES ==========

export type WeighingFrequency = 'weekly' | 'daily';

export interface WeightLog {
  dateISO: string;      // YYYY-MM-DD
  weightKg: number;
  createdAtISO: string; // Full ISO timestamp
  isWeeklyCheckin?: boolean; // For weekly mode: marks this as the weekly check-in entry
}

export interface WeeklyCheckin {
  weekStartISO: string;
  weekEndISO: string;
  avg7?: number;          // Used in daily mode
  weightKg?: number;      // Used in weekly mode (single measurement)
  prevAvg7?: number;
  prevWeightKg?: number;  // Previous weekly check-in weight
  trendKg?: number;
  suggestedDeltaCalories?: number;
  appliedDeltaCalories?: number;
  appliedAtISO?: string;
  notes?: string;
}

export interface NutritionPlanHistoryEntry {
  atISO: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  reason: 'onboarding' | 'auto_adjust' | 'manual';
}

export interface ProgressData {
  weightLogs: WeightLog[];
  weeklyCheckins: WeeklyCheckin[];
  planHistory: NutritionPlanHistoryEntry[];
  lastCheckinAppliedISO?: string;
  weighingFrequency: WeighingFrequency;
  version: number;
}

// ========== MINIMUM CALORIE FLOORS (safe limits) ==========
const MIN_CALORIES_MALE = 1500;
const MIN_CALORIES_FEMALE = 1200;
const MAX_CALORIES = 5000;
const MAX_ADJUSTMENT_PER_CHECKIN = 150;
const MIN_LOGS_FOR_DAILY_CHECKIN = 4;
const MIN_CHECKINS_FOR_WEEKLY_ADJUST = 2;
const CHECKIN_INTERVAL_DAYS = 7;

// ========== DATA ACCESS ==========

function getDefaultProgressData(): ProgressData {
  return {
    weightLogs: [],
    weeklyCheckins: [],
    planHistory: [],
    weighingFrequency: 'weekly', // Default to weekly (recommended)
    version: 1,
  };
}

export function getProgressData(): ProgressData {
  return load<ProgressData>(PROGRESS_KEY, getDefaultProgressData());
}

export function saveProgressData(data: ProgressData): void {
  save(PROGRESS_KEY, data);
}

// ========== WEIGHT LOG FUNCTIONS ==========

export function getLocalDateISO(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function upsertWeightLog(dateISO: string, weightKg: number): void {
  const data = getProgressData();
  const existingIdx = data.weightLogs.findIndex(l => l.dateISO === dateISO);
  
  const entry: WeightLog = {
    dateISO,
    weightKg: Math.round(weightKg * 10) / 10, // Round to 1 decimal
    createdAtISO: new Date().toISOString(),
  };
  
  if (existingIdx >= 0) {
    data.weightLogs[existingIdx] = entry;
  } else {
    data.weightLogs.push(entry);
    // Keep sorted by date
    data.weightLogs.sort((a, b) => a.dateISO.localeCompare(b.dateISO));
  }
  
  saveProgressData(data);
}

export function getLastNDaysLogs(n: number, endingDateISO?: string): WeightLog[] {
  const data = getProgressData();
  const endDate = endingDateISO ? new Date(endingDateISO) : new Date();
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - n + 1);
  
  const startISO = getLocalDateISO(startDate);
  const endISO = getLocalDateISO(endDate);
  
  return data.weightLogs.filter(
    l => l.dateISO >= startISO && l.dateISO <= endISO
  );
}

export function getLatestWeight(): WeightLog | null {
  const data = getProgressData();
  if (data.weightLogs.length === 0) return null;
  return data.weightLogs[data.weightLogs.length - 1];
}

export function getTodayLog(): WeightLog | null {
  const data = getProgressData();
  const todayISO = getLocalDateISO();
  return data.weightLogs.find(l => l.dateISO === todayISO) || null;
}

// ========== WEIGHING FREQUENCY ==========

export function getWeighingFrequency(): WeighingFrequency {
  const data = getProgressData();
  return data.weighingFrequency || 'weekly';
}

export function setWeighingFrequency(frequency: WeighingFrequency): void {
  const data = getProgressData();
  data.weighingFrequency = frequency;
  saveProgressData(data);
}

// ========== AVERAGE & TREND CALCULATIONS ==========

export function compute7DayAverage(endingDateISO?: string): number | null {
  const logs = getLastNDaysLogs(7, endingDateISO);
  
  if (logs.length < MIN_LOGS_FOR_DAILY_CHECKIN) {
    return null; // Not enough data
  }
  
  const sum = logs.reduce((acc, l) => acc + l.weightKg, 0);
  return Math.round((sum / logs.length) * 10) / 10;
}

export function computePrevious7DayAverage(endingDateISO?: string): number | null {
  const endDate = endingDateISO ? new Date(endingDateISO) : new Date();
  const prevEndDate = new Date(endDate);
  prevEndDate.setDate(prevEndDate.getDate() - 7);
  
  return compute7DayAverage(getLocalDateISO(prevEndDate));
}

export function computeTrend(currentValue: number, prevValue: number): number {
  return Math.round((currentValue - prevValue) * 10) / 10;
}

// Get last N weekly check-ins (for weekly mode trend calculation)
export function getLastNWeeklyCheckins(n: number): WeeklyCheckin[] {
  const data = getProgressData();
  return data.weeklyCheckins.slice(-n);
}

// Compute weekly mode trend using last 2-4 check-ins
export function computeWeeklyModeTrend(): { 
  currentWeight: number | null; 
  prevWeight: number | null; 
  trendKg: number | null;
  checkinsCount: number;
  checkinsNeeded: number;
} {
  const checkins = getLastNWeeklyCheckins(4);
  const checkinsWithWeight = checkins.filter(c => c.weightKg !== undefined);
  
  if (checkinsWithWeight.length === 0) {
    return { 
      currentWeight: null, 
      prevWeight: null, 
      trendKg: null, 
      checkinsCount: 0,
      checkinsNeeded: MIN_CHECKINS_FOR_WEEKLY_ADJUST
    };
  }
  
  const currentWeight = checkinsWithWeight[checkinsWithWeight.length - 1].weightKg!;
  
  if (checkinsWithWeight.length < MIN_CHECKINS_FOR_WEEKLY_ADJUST) {
    return { 
      currentWeight, 
      prevWeight: null, 
      trendKg: null, 
      checkinsCount: checkinsWithWeight.length,
      checkinsNeeded: MIN_CHECKINS_FOR_WEEKLY_ADJUST - checkinsWithWeight.length
    };
  }
  
  // For trend: compare current with average of previous check-ins (smoothing)
  const prevCheckins = checkinsWithWeight.slice(0, -1);
  const prevAvg = prevCheckins.reduce((acc, c) => acc + c.weightKg!, 0) / prevCheckins.length;
  const trendKg = Math.round((currentWeight - prevAvg) * 10) / 10;
  
  return { 
    currentWeight, 
    prevWeight: Math.round(prevAvg * 10) / 10, 
    trendKg,
    checkinsCount: checkinsWithWeight.length,
    checkinsNeeded: 0
  };
}

export function getWeightStats(): {
  currentAvg7: number | null;
  prevAvg7: number | null;
  trendKg: number | null;
  logsLast7Days: number;
  logsNeeded: number;
  // Weekly mode stats
  weeklyModeStats: {
    currentWeight: number | null;
    prevWeight: number | null;
    trendKg: number | null;
    checkinsCount: number;
    checkinsNeeded: number;
  };
  frequency: WeighingFrequency;
} {
  const frequency = getWeighingFrequency();
  const logsLast7 = getLastNDaysLogs(7);
  const currentAvg7 = compute7DayAverage();
  const prevAvg7 = computePrevious7DayAverage();
  const weeklyModeStats = computeWeeklyModeTrend();
  
  let trendKg: number | null = null;
  if (frequency === 'daily' && currentAvg7 !== null && prevAvg7 !== null) {
    trendKg = computeTrend(currentAvg7, prevAvg7);
  } else if (frequency === 'weekly') {
    trendKg = weeklyModeStats.trendKg;
  }
  
  return {
    currentAvg7,
    prevAvg7,
    trendKg,
    logsLast7Days: logsLast7.length,
    logsNeeded: frequency === 'daily' ? Math.max(0, MIN_LOGS_FOR_DAILY_CHECKIN - logsLast7.length) : 0,
    weeklyModeStats,
    frequency,
  };
}

// ========== CHECK-IN SCHEDULING ==========

export function getNextCheckinDueDate(): Date | null {
  const data = getProgressData();
  const onboarding = getOnboardingData();
  
  if (!onboarding?.completedAt) return null;
  
  // Start from last applied check-in or onboarding completion
  const lastApplied = data.lastCheckinAppliedISO || onboarding.completedAt;
  const lastDate = new Date(lastApplied);
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + CHECKIN_INTERVAL_DAYS);
  
  return nextDate;
}

export function isCheckinDue(): boolean {
  const nextDue = getNextCheckinDueDate();
  if (!nextDue) return false;
  
  const now = new Date();
  return now >= nextDue;
}

export function isCheckinAvailable(): boolean {
  const frequency = getWeighingFrequency();
  
  // Check-in available if due date passed
  if (!isCheckinDue()) return false;
  
  if (frequency === 'daily') {
    // Daily mode: need enough weight logs
    const stats = getWeightStats();
    return stats.logsNeeded === 0;
  }
  
  // Weekly mode: always available when due (no data requirements for recording)
  return true;
}

// Check if adjustment is available (different from check-in availability)
export function isAdjustmentAvailable(): boolean {
  const frequency = getWeighingFrequency();
  const stats = getWeightStats();
  
  if (frequency === 'daily') {
    // Daily mode: need trend data
    return stats.trendKg !== null;
  }
  
  // Weekly mode: need at least 2 check-ins for trend
  return stats.weeklyModeStats.checkinsNeeded === 0;
}

// ========== CALORIE ADJUSTMENT LOGIC ==========

export function suggestCalorieAdjustment(
  goal: Objective,
  trendKg: number,
  currentCalories: number,
  weightKg: number,
  sex: 'male' | 'female'
): { delta: number; reason: string } {
  // Determine minimum floor
  const minCalories = sex === 'male' ? MIN_CALORIES_MALE : MIN_CALORIES_FEMALE;
  
  let delta = 0;
  let reason = '';
  
  if (goal === 'lose_fat') {
    // Goal: lose 0.2-0.7 kg/week (negative trend is good)
    if (trendKg > -0.2) {
      // Not losing fast enough
      delta = -100;
      reason = 'Perda de peso abaixo do esperado. Redução moderada sugerida.';
    } else if (trendKg >= -0.7) {
      // Perfect range
      delta = 0;
      reason = 'Progresso adequado. Manter plano atual.';
    } else {
      // Losing too fast (< -0.7 kg/week)
      delta = 100;
      reason = 'Perda rápida demais. Aumento sugerido para preservar massa muscular.';
    }
  } else if (goal === 'gain_muscle') {
    // Goal: gain 0.1-0.4 kg/week
    if (trendKg < 0.1) {
      // Not gaining enough
      delta = 100;
      reason = 'Ganho de peso abaixo do esperado. Aumento moderado sugerido.';
    } else if (trendKg <= 0.4) {
      // Perfect range
      delta = 0;
      reason = 'Progresso adequado. Manter plano atual.';
    } else {
      // Gaining too fast
      delta = -100;
      reason = 'Ganho rápido demais. Redução sugerida para minimizar gordura.';
    }
  } else {
    // maintain
    if (Math.abs(trendKg) <= 0.2) {
      delta = 0;
      reason = 'Peso estável. Manter plano atual.';
    } else if (trendKg > 0.2) {
      delta = -100;
      reason = 'Leve ganho de peso. Redução moderada sugerida.';
    } else {
      delta = 100;
      reason = 'Leve perda de peso. Aumento moderado sugerido.';
    }
  }
  
  // Apply max adjustment limit
  delta = Math.max(-MAX_ADJUSTMENT_PER_CHECKIN, Math.min(MAX_ADJUSTMENT_PER_CHECKIN, delta));
  
  // Ensure we don't go below minimum
  const newCalories = currentCalories + delta;
  if (newCalories < minCalories) {
    delta = minCalories - currentCalories;
    if (delta >= 0) {
      delta = 0;
      reason = `Já está no mínimo seguro (${minCalories} kcal). Não é possível reduzir mais.`;
    }
  }
  
  // Ensure we don't go above maximum
  if (newCalories > MAX_CALORIES) {
    delta = MAX_CALORIES - currentCalories;
    reason = `Próximo do limite máximo. Ajuste limitado.`;
  }
  
  return { delta, reason };
}

// ========== APPLY ADJUSTMENT ==========

export function applyCalorieAdjustment(delta: number, reason: 'auto_adjust' | 'manual' = 'auto_adjust'): boolean {
  const onboarding = getOnboardingData();
  if (!onboarding) return false;
  
  const currentCalories = onboarding.plan.targetKcal;
  const newCalories = currentCalories + delta;
  
  // Recalculate macros with new calorie target
  const macros = calculateMacros(
    newCalories,
    onboarding.profile.weightKg,
    onboarding.objective.objective
  );
  
  // Update the plan
  const updatedData: OnboardingData = {
    ...onboarding,
    plan: {
      ...onboarding.plan,
      targetKcal: newCalories,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
      fiberG: macros.fiberG,
    },
  };
  
  saveOnboardingData(updatedData);
  
  // Record in plan history
  const progressData = getProgressData();
  progressData.planHistory.push({
    atISO: new Date().toISOString(),
    calories: newCalories,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    fiberG: macros.fiberG,
    reason,
  });
  
  // Update last check-in applied
  progressData.lastCheckinAppliedISO = new Date().toISOString();
  
  saveProgressData(progressData);
  
  return true;
}

export function recordCheckin(
  params: {
    avg7?: number;
    weightKg?: number;
    prevAvg7?: number | null;
    prevWeightKg?: number | null;
    trendKg: number | null;
    suggestedDelta: number;
    appliedDelta: number | null;
    notes?: string;
  }
): void {
  const data = getProgressData();
  const now = new Date();
  const weekEnd = getLocalDateISO(now);
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 6);
  
  const checkin: WeeklyCheckin = {
    weekStartISO: getLocalDateISO(weekStart),
    weekEndISO: weekEnd,
    avg7: params.avg7,
    weightKg: params.weightKg,
    prevAvg7: params.prevAvg7 ?? undefined,
    prevWeightKg: params.prevWeightKg ?? undefined,
    trendKg: params.trendKg ?? undefined,
    suggestedDeltaCalories: params.suggestedDelta,
    appliedDeltaCalories: params.appliedDelta ?? undefined,
    appliedAtISO: params.appliedDelta !== null ? new Date().toISOString() : undefined,
    notes: params.notes,
  };
  
  data.weeklyCheckins.push(checkin);
  
  // Update last check-in date even if adjustment was skipped
  data.lastCheckinAppliedISO = new Date().toISOString();
  
  saveProgressData(data);
}

// Record a weekly mode check-in with weight
export function recordWeeklyCheckinWithWeight(weightKg: number): void {
  const data = getProgressData();
  const dateISO = getLocalDateISO();
  
  // First, upsert the weight log
  upsertWeightLog(dateISO, weightKg);
  
  // Mark this log as a weekly check-in
  const logIdx = data.weightLogs.findIndex(l => l.dateISO === dateISO);
  if (logIdx >= 0) {
    data.weightLogs[logIdx].isWeeklyCheckin = true;
    saveProgressData(data);
  }
}

// ========== PLAN HISTORY ==========

export function getPlanHistory(limit: number = 5): NutritionPlanHistoryEntry[] {
  const data = getProgressData();
  return data.planHistory.slice(-limit).reverse();
}

export function getReasonLabel(reason: NutritionPlanHistoryEntry['reason']): string {
  switch (reason) {
    case 'onboarding': return 'Configuração inicial';
    case 'auto_adjust': return 'Ajuste automático';
    case 'manual': return 'Ajuste manual';
    default: return reason;
  }
}

// ========== INITIALIZE FROM ONBOARDING ==========

export function initializePlanHistoryFromOnboarding(): void {
  const data = getProgressData();
  const onboarding = getOnboardingData();
  
  // Only add if history is empty and onboarding exists
  if (data.planHistory.length === 0 && onboarding?.plan) {
    data.planHistory.push({
      atISO: onboarding.completedAt,
      calories: onboarding.plan.targetKcal,
      proteinG: onboarding.plan.proteinG,
      carbsG: onboarding.plan.carbsG,
      fatG: onboarding.plan.fatG,
      fiberG: onboarding.plan.fiberG,
      reason: 'onboarding',
    });
    saveProgressData(data);
  }
}
