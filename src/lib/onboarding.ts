// Onboarding types and calculation utilities
// Implements Mifflin-St Jeor BMR, TDEE, and macro calculations
// Data is persisted to Firebase Firestore for cross-device sync
// Legacy localStorage functions kept for backward compatibility during migration

import type { OnboardingData } from './appState';
import { load, save } from './localStore';

// Legacy storage key (for backward compatibility during migration)
const ONBOARDING_KEY = 'levelup.onboarding.v1';

// ========== RE-EXPORT TYPES ==========

export type Sex = 'male' | 'female';

export type ActivityLevel = 
  | 'sedentary'      // Little or no exercise
  | 'light'          // Light exercise 1-3 days/week
  | 'moderate'       // Moderate exercise 3-5 days/week
  | 'active'         // Heavy exercise 6-7 days/week
  | 'athlete';       // Very heavy exercise, physical job

export type Objective = 
  | 'lose_fat'       // Perder gordura
  | 'maintain'       // Manter peso
  | 'gain_muscle';   // Ganhar massa

export interface OnboardingProfile {
  birthDate: string;     // ISO date string
  sex: Sex;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
}

export interface OnboardingObjective {
  objective: Objective;
  targetWeightKg: number;
}

export interface OnboardingPlan {
  bmr: number;             // Basal Metabolic Rate (kcal)
  tdee: number;            // Total Daily Energy Expenditure (kcal)
  targetKcal: number;      // Adjusted based on objective
  proteinG: number;        // Grams of protein
  carbsG: number;          // Grams of carbs
  fatG: number;            // Grams of fat
  fiberG: number;          // Grams of fiber
}

// Re-export the OnboardingData type from appState for convenience
export type { OnboardingData } from './appState';

// ========== LEGACY FUNCTIONS (for backward compatibility) ==========
// These read/write to localStorage but will be synced to Firebase via AppStateContext

export function getOnboardingData(): OnboardingData | null {
  return load<OnboardingData | null>(ONBOARDING_KEY, null);
}

export function saveOnboardingData(data: OnboardingData): void {
  save(ONBOARDING_KEY, data);
}

export function isOnboardingComplete(): boolean {
  const data = getOnboardingData();
  return data !== null && !!data.completedAt;
}

export function clearOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // ignore
  }
}

export function completeOnboarding(
  profile: OnboardingProfile,
  objective: OnboardingObjective
): OnboardingData {
  const plan = calculatePlan(profile, objective);
  
  const data: OnboardingData = {
    profile,
    objective,
    plan,
    completedAt: new Date().toISOString(),
    version: 1,
  };
  
  saveOnboardingData(data);
  
  return data;
}

export function updateObjective(newObjective: OnboardingObjective): OnboardingData | null {
  const existing = getOnboardingData();
  if (!existing) return null;
  
  const plan = calculatePlan(existing.profile, newObjective);
  
  const updated: OnboardingData = {
    ...existing,
    objective: newObjective,
    plan,
    completedAt: new Date().toISOString(),
  };
  
  saveOnboardingData(updated);
  
  return updated;
}

// ========== AGE CALCULATION ==========

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

export function isAdult(birthDate: string): boolean {
  return calculateAge(birthDate) >= 18;
}

// ========== ACTIVITY MULTIPLIERS ==========

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

export function getActivityMultiplier(level: ActivityLevel): number {
  return ACTIVITY_MULTIPLIERS[level];
}

export function getActivityLabel(level: ActivityLevel): string {
  const labels: Record<ActivityLevel, string> = {
    sedentary: 'Sedentário',
    light: 'Leve',
    moderate: 'Moderado',
    active: 'Muito ativo',
    athlete: 'Atleta',
  };
  return labels[level];
}

export function getActivityDescription(level: ActivityLevel): string {
  const descriptions: Record<ActivityLevel, string> = {
    sedentary: 'Pouco ou nenhum exercício',
    light: 'Exercício leve 1-3 dias/semana',
    moderate: 'Exercício moderado 3-5 dias/semana',
    active: 'Exercício intenso 6-7 dias/semana',
    athlete: 'Exercício muito intenso, trabalho físico',
  };
  return descriptions[level];
}

// ========== OBJECTIVE HELPERS ==========

export function getObjectiveLabel(objective: Objective): string {
  const labels: Record<Objective, string> = {
    lose_fat: 'Perder gordura',
    maintain: 'Manter peso',
    gain_muscle: 'Ganhar massa',
  };
  return labels[objective];
}

export function getObjectiveDescription(objective: Objective): string {
  const descriptions: Record<Objective, string> = {
    lose_fat: 'Déficit calórico moderado para perda de gordura sustentável',
    maintain: 'Calorias de manutenção para composição corporal estável',
    gain_muscle: 'Superávit calórico moderado para ganho de massa muscular',
  };
  return descriptions[objective];
}

// ========== BMR CALCULATION (Mifflin-St Jeor) ==========

export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  // Mifflin-St Jeor Equation
  // Men: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) + 5
  // Women: BMR = 10 × weight(kg) + 6.25 × height(cm) − 5 × age(y) − 161
  
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  
  if (sex === 'male') {
    return Math.round(base + 5);
  } else {
    return Math.round(base - 161);
  }
}

// ========== TDEE CALCULATION ==========

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = getActivityMultiplier(activityLevel);
  return Math.round(bmr * multiplier);
}

// ========== CALORIE ADJUSTMENT ==========

export function calculateTargetKcal(tdee: number, objective: Objective): number {
  switch (objective) {
    case 'lose_fat':
      // Moderate deficit: ~20% below TDEE (typically 300-500 kcal)
      return Math.round(tdee * 0.8);
    case 'gain_muscle':
      // Moderate surplus: ~10-15% above TDEE (typically 200-400 kcal)
      return Math.round(tdee * 1.12);
    case 'maintain':
    default:
      return tdee;
  }
}

// ========== MACRO CALCULATION ==========

export interface MacroDistribution {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
}

export function calculateMacros(
  targetKcal: number,
  weightKg: number,
  objective: Objective
): MacroDistribution {
  // Protein: ~1.6-2.2g/kg body weight
  // Higher for muscle gain and fat loss to preserve muscle
  let proteinPerKg: number;
  switch (objective) {
    case 'lose_fat':
      proteinPerKg = 2.0; // Higher to preserve muscle in deficit
      break;
    case 'gain_muscle':
      proteinPerKg = 1.8;
      break;
    case 'maintain':
    default:
      proteinPerKg = 1.6;
  }
  
  const proteinG = Math.round(weightKg * proteinPerKg);
  const proteinKcal = proteinG * 4;
  
  // Fat: minimum healthy range is 0.5-0.7g/kg, but typically 20-30% of calories
  // We'll use ~25% of calories, with a minimum of 0.6g/kg
  const fatFromPercent = Math.round((targetKcal * 0.25) / 9);
  const fatMinimum = Math.round(weightKg * 0.6);
  const fatG = Math.max(fatFromPercent, fatMinimum);
  const fatKcal = fatG * 9;
  
  // Carbs: fill the remaining calories
  const remainingKcal = targetKcal - proteinKcal - fatKcal;
  const carbsG = Math.max(0, Math.round(remainingKcal / 4));
  
  // Fiber: ~14g per 1000 kcal
  const fiberG = Math.round((targetKcal / 1000) * 14);
  
  return {
    proteinG,
    carbsG,
    fatG,
    fiberG,
  };
}

// ========== FULL PLAN CALCULATION ==========

export function calculatePlan(
  profile: OnboardingProfile,
  objective: OnboardingObjective
): OnboardingPlan {
  const age = calculateAge(profile.birthDate);
  const bmr = calculateBMR(profile.weightKg, profile.heightCm, age, profile.sex);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const targetKcal = calculateTargetKcal(tdee, objective.objective);
  const macros = calculateMacros(targetKcal, profile.weightKg, objective.objective);
  
  return {
    bmr,
    tdee,
    targetKcal,
    ...macros,
  };
}

// ========== CREATE ONBOARDING DATA ==========

export function createOnboardingData(
  profile: OnboardingProfile,
  objective: OnboardingObjective
): OnboardingData {
  const plan = calculatePlan(profile, objective);
  
  return {
    profile,
    objective,
    plan,
    completedAt: new Date().toISOString(),
    version: 1,
  };
}

// ========== UPDATE OBJECTIVE (RECALCULATE PLAN) ==========

export function recalculateWithNewObjective(
  existingData: OnboardingData,
  newObjective: OnboardingObjective
): OnboardingData {
  const plan = calculatePlan(existingData.profile, newObjective);
  
  return {
    ...existingData,
    objective: newObjective,
    plan,
    completedAt: new Date().toISOString(),
  };
}
