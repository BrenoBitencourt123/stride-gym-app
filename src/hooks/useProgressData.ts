// src/hooks/useProgressData.ts
// Hook for accessing progress data from Firebase via AppStateContext
// Replaces localStorage-based functions for the Progresso page

import { useMemo } from 'react';
import { useAppStateContext } from '@/contexts/AppStateContext';
import { foods, FoodItem } from '@/data/foods';

// ============= TYPES =============

export interface WeeklyVolumeData {
  weekLabel: string;
  volume: number;
}

export interface ConsistencyData {
  weekLabel: string;
  count: number;
}

export interface E1RMHistoryData {
  dateLabel: string;
  e1rm: number;
}

export interface NutritionChartData {
  dateLabel: string;
  kcal: number;
  kcalMeta: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface WeightChartData {
  dateLabel: string;
  weight: number;
}

export interface WeightVariation {
  current: number | null;
  variation: number | null;
  delta: number | null;
}

export interface WeightEntry {
  date: string;
  weight: number;
  updatedAt: number;
}

export interface ExerciseWithHistory {
  id: string;
  name: string;
}

export interface WeightStats {
  currentWeight: number | null;
  previousWeight: number | null;
  trendKg: number | null;
  entriesCount: number;
}

// ============= HOOK =============

export function useProgressData() {
  const { state, getOnboarding } = useAppStateContext();
  
  // Get workout history from Firebase
  const workoutHistory = useMemo(() => {
    return state?.workoutHistory || [];
  }, [state?.workoutHistory]);
  
  // Get exercise history from Firebase
  const exerciseHistory = useMemo(() => {
    return state?.exerciseHistory || {};
  }, [state?.exerciseHistory]);
  
  // Get workout plan from Firebase
  const workoutPlan = useMemo(() => {
    return state?.plan || { workouts: [], updatedAt: '' };
  }, [state?.plan]);
  
  // Get nutrition data from Firebase
  const nutritionTargets = useMemo(() => {
    return state?.nutrition?.targets || { kcal: 2050, protein: 160, carbs: 200, fats: 65 };
  }, [state?.nutrition?.targets]);
  
  const nutritionDailyLogs = useMemo(() => {
    return state?.nutrition?.dailyLogs || {};
  }, [state?.nutrition?.dailyLogs]);
  
  const nutritionTotalsLogs = useMemo(() => {
    return state?.nutrition?.totalsLogs || [];
  }, [state?.nutrition?.totalsLogs]);
  
  // Get bodyweight data from Firebase
  const bodyweightEntries = useMemo(() => {
    return state?.bodyweight?.entries || [];
  }, [state?.bodyweight?.entries]);
  
  // Get onboarding data
  const onboarding = getOnboarding();
  
  // ============= COMPUTED DATA =============
  
  // Total workouts in period
  const getWorkoutsInPeriod = (days: number): number => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    return workoutHistory.filter(w => new Date(w.timestamp) >= startDate).length;
  };
  
  // PRs count
  const getPRsCount = (): number => {
    let prs = 0;
    
    for (const exerciseId of Object.keys(exerciseHistory)) {
      const entries = exerciseHistory[exerciseId];
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
  };
  
  // Consistency data
  const getConsistency = (days: number): ConsistencyData[] => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const weeksMap: Record<string, number> = {};
    
    for (const w of workoutHistory) {
      const date = new Date(w.timestamp);
      if (date >= startDate) {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weeksMap[key] = (weeksMap[key] || 0) + 1;
      }
    }
    
    return Object.entries(weeksMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekLabel, count]) => ({ weekLabel, count }));
  };
  
  // Weekly volume data
  const getWeeklyVolume = (days: number): WeeklyVolumeData[] => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    
    const weeksMap: Record<string, number> = {};
    
    for (const w of workoutHistory) {
      const date = new Date(w.timestamp);
      if (date >= startDate) {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().split('T')[0];
        weeksMap[key] = (weeksMap[key] || 0) + w.totalVolume;
      }
    }
    
    return Object.entries(weeksMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([weekLabel, volume]) => ({ weekLabel, volume }));
  };
  
  // E1RM history for specific exercise
  const getE1RMHistory = (exerciseId: string): E1RMHistoryData[] => {
    const entries = exerciseHistory[exerciseId] || [];
    
    return entries.map(e => {
      const firstSet = e.workSets[0];
      const e1rm = firstSet ? Math.round(firstSet.kg * (1 + firstSet.reps / 30)) : 0;
      return {
        dateLabel: e.timestamp.split('T')[0],
        e1rm,
      };
    });
  };
  
  // Exercises with history
  const getExercisesWithHistory = (): ExerciseWithHistory[] => {
    const result: ExerciseWithHistory[] = [];
    
    for (const exerciseId of Object.keys(exerciseHistory)) {
      let name = exerciseId;
      for (const workout of workoutPlan.workouts) {
        const ex = workout.exercicios.find(e => e.id === exerciseId);
        if (ex) {
          name = ex.nome;
          break;
        }
      }
      result.push({ id: exerciseId, name });
    }
    
    return result;
  };
  
  // Nutrition chart data from Firebase totals logs
  const getNutritionChartData = (days: number = 7): NutritionChartData[] => {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - days);
    const startKey = startDate.toISOString().split('T')[0];
    
    // First try to use totalsLogs
    if (nutritionTotalsLogs.length > 0) {
      return nutritionTotalsLogs
        .filter(log => log.dateKey >= startKey)
        .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
        .map(log => ({
          dateLabel: log.dateKey,
          kcal: log.kcal,
          kcalMeta: nutritionTargets.kcal,
          protein: log.p,
          carbs: log.c,
          fat: log.g,
        }));
    }
    
    // Fallback to calculating from dailyLogs
    const chartData: NutritionChartData[] = [];
    
    for (const [dateKey, dayLog] of Object.entries(nutritionDailyLogs)) {
      if (dateKey < startKey) continue;
      
      let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      
      for (const meal of dayLog.meals) {
        for (const entry of meal.entries) {
          if (entry.consumed) {
            const food = foods.find((f: FoodItem) => f.id === entry.foodId);
            if (food) {
              const multiplier = entry.quantidade / (food.porcaoBase || 100);
              totalKcal += food.kcal * multiplier;
              totalProtein += food.p * multiplier;
              totalCarbs += food.c * multiplier;
              totalFat += food.g * multiplier;
            }
          }
        }
      }
      
      if (totalKcal > 0) {
        chartData.push({
          dateLabel: dateKey,
          kcal: Math.round(totalKcal),
          kcalMeta: nutritionTargets.kcal,
          protein: Math.round(totalProtein),
          carbs: Math.round(totalCarbs),
          fat: Math.round(totalFat),
        });
      }
    }
    
    return chartData.sort((a, b) => a.dateLabel.localeCompare(b.dateLabel));
  };
  
  // Weight chart data
  const getWeightChartData = (): WeightChartData[] => {
    return bodyweightEntries.map(w => ({
      dateLabel: w.date,
      weight: w.weight,
    }));
  };
  
  // Weight variation
  const getWeightVariation = (): WeightVariation => {
    if (bodyweightEntries.length === 0) {
      return { current: null, variation: null, delta: null };
    }
    
    const sorted = [...bodyweightEntries].sort((a, b) => a.date.localeCompare(b.date));
    const current = sorted[sorted.length - 1].weight;
    
    if (sorted.length < 2) {
      return { current, variation: null, delta: null };
    }
    
    const first = sorted[0].weight;
    const delta = Math.round((current - first) * 10) / 10;
    const variation = Math.round((delta / first) * 1000) / 10;
    
    return { current, variation, delta };
  };
  
  // Weight history (sorted entries)
  const getWeightHistory = (): WeightEntry[] => {
    return [...bodyweightEntries].sort((a, b) => a.date.localeCompare(b.date));
  };
  
  // Weight stats
  const getWeightStats = (): WeightStats => {
    const sorted = [...bodyweightEntries].sort((a, b) => a.date.localeCompare(b.date));
    
    if (sorted.length === 0) {
      return { currentWeight: null, previousWeight: null, trendKg: null, entriesCount: 0 };
    }
    
    const currentWeight = sorted[sorted.length - 1].weight;
    
    if (sorted.length < 2) {
      return { currentWeight, previousWeight: null, trendKg: null, entriesCount: sorted.length };
    }
    
    // Get entries from last 2 weeks for trend
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const twoWeeksKey = twoWeeksAgo.toISOString().split('T')[0];
    
    const recentEntries = sorted.filter(e => e.date >= twoWeeksKey);
    
    if (recentEntries.length < 2) {
      return { 
        currentWeight, 
        previousWeight: sorted[sorted.length - 2].weight, 
        trendKg: null, 
        entriesCount: sorted.length 
      };
    }
    
    // Calculate average of first half vs second half for trend
    const midpoint = Math.floor(recentEntries.length / 2);
    const firstHalf = recentEntries.slice(0, midpoint);
    const secondHalf = recentEntries.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, e) => sum + e.weight, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, e) => sum + e.weight, 0) / secondHalf.length;
    
    const trendKg = Math.round((secondAvg - firstAvg) * 10) / 10;
    
    return {
      currentWeight,
      previousWeight: Math.round(firstAvg * 10) / 10,
      trendKg,
      entriesCount: sorted.length,
    };
  };
  
  // Check-in availability (simplified - based on onboarding)
  const isCheckinAvailable = (): boolean => {
    if (!onboarding?.completedAt) return false;
    
    const lastCheckin = new Date(onboarding.completedAt);
    const nextDue = new Date(lastCheckin);
    nextDue.setDate(nextDue.getDate() + 7);
    
    return new Date() >= nextDue;
  };
  
  // Next check-in date
  const getNextCheckinDueDate = (): Date | null => {
    if (!onboarding?.completedAt) return null;
    
    const lastCheckin = new Date(onboarding.completedAt);
    const nextDue = new Date(lastCheckin);
    nextDue.setDate(nextDue.getDate() + 7);
    
    return nextDue;
  };
  
  // Plan history from onboarding
  const getPlanHistory = () => {
    if (!onboarding?.plan) return [];
    
    return [{
      atISO: onboarding.completedAt,
      calories: onboarding.plan.targetKcal,
      proteinG: onboarding.plan.proteinG,
      carbsG: onboarding.plan.carbsG,
      fatG: onboarding.plan.fatG,
      fiberG: onboarding.plan.fiberG,
      reason: 'onboarding' as const,
    }];
  };
  
  // Weighing frequency (default to weekly)
  const getWeighingFrequency = (): 'weekly' | 'daily' => {
    return 'weekly';
  };
  
  return {
    // Raw data
    workoutHistory,
    exerciseHistory,
    workoutPlan,
    nutritionTargets,
    nutritionDailyLogs,
    nutritionTotalsLogs,
    bodyweightEntries,
    onboarding,
    
    // Computed functions
    getWorkoutsInPeriod,
    getPRsCount,
    getConsistency,
    getWeeklyVolume,
    getE1RMHistory,
    getExercisesWithHistory,
    getNutritionChartData,
    getWeightChartData,
    getWeightVariation,
    getWeightHistory,
    getWeightStats,
    isCheckinAvailable,
    getNextCheckinDueDate,
    getPlanHistory,
    getWeighingFrequency,
  };
}
