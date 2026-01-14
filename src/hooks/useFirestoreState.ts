// src/hooks/useFirestoreState.ts
// React hooks for Firebase-first state management
// Replaces localStorage-based hooks

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  getUserState,
  setUserState,
  subscribeToUserState,
  saveNutritionDay,
  subscribeToNutritionDay,
  saveWeightMeasurement,
  migrateLocalStorageToFirestore,
  hasBeenMigrated,
  getTodayDateKey,
  type NutritionDay
} from '@/lib/firebase/firestoreRepo';
import type { AppState, NutritionToday, NutritionDiet, Quests, TreinoHoje, TreinoProgresso } from '@/lib/appState';
import { getLocalState, createNewUserState } from '@/lib/appState';

// ============= TYPES =============

export type LoadingState = 'idle' | 'loading' | 'ready' | 'error';

export interface UseAppStateResult {
  state: AppState | null;
  loading: LoadingState;
  error: string | null;
  updateState: (updates: Partial<AppState>) => Promise<boolean>;
  refreshState: () => Promise<void>;
}

// ============= MAIN APP STATE HOOK =============

/**
 * Main hook for accessing and updating the full AppState from Firestore
 * Includes automatic migration from localStorage on first load
 */
export function useAppState(): UseAppStateResult {
  const { user } = useAuth();
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState<LoadingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const migrationInProgressRef = useRef(false);
  
  // Initial load and migration
  useEffect(() => {
    if (!user) {
      setState(null);
      setLoading('idle');
      return;
    }
    
    let isMounted = true;
    
    const initializeState = async () => {
      if (migrationInProgressRef.current) return;
      
      setLoading('loading');
      
      try {
        // Check if migration is needed
        const migrated = await hasBeenMigrated(user.uid);
        
        if (!migrated) {
          migrationInProgressRef.current = true;
          
          // Get local state for migration
          const localState = getLocalState();
          
          // Perform migration
          const result = await migrateLocalStorageToFirestore(user.uid, localState);
          
          if (!result.success) {
            console.warn('[useAppState] Migration failed:', result.error);
          }
          
          migrationInProgressRef.current = false;
        }
        
        // Fetch current state from Firestore
        let firestoreState = await getUserState(user.uid);
        
        // If no state exists, create a new one
        if (!firestoreState) {
          const newState = createNewUserState();
          await setUserState(user.uid, newState);
          firestoreState = newState;
        }
        
        if (isMounted) {
          setState(firestoreState);
          setLoading('ready');
        }
        
        // Subscribe to real-time updates
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        unsubscribeRef.current = subscribeToUserState(user.uid, (newState) => {
          if (isMounted && newState) {
            setState(newState);
          }
        });
        
      } catch (err) {
        console.error('[useAppState] Error:', err);
        if (isMounted) {
          setError(String(err));
          setLoading('error');
        }
      }
    };
    
    initializeState();
    
    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);
  
  // Update state function
  const updateState = useCallback(async (updates: Partial<AppState>): Promise<boolean> => {
    if (!user || !state) return false;
    
    const newState: AppState = {
      ...state,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Optimistic update
    setState(newState);
    
    // Persist to Firestore
    const success = await setUserState(user.uid, newState);
    
    if (!success) {
      // Rollback on failure
      setState(state);
    }
    
    return success;
  }, [user, state]);
  
  // Refresh state from server
  const refreshState = useCallback(async () => {
    if (!user) return;
    
    setLoading('loading');
    const firestoreState = await getUserState(user.uid);
    if (firestoreState) {
      setState(firestoreState);
    }
    setLoading('ready');
  }, [user]);
  
  return { state, loading, error, updateState, refreshState };
}

// ============= PROFILE & PROGRESSION HOOKS =============

export function useProfile() {
  const { state, updateState } = useAppState();
  
  const profile = state?.profile || null;
  const progression = state?.progression || null;
  
  const updateProfile = useCallback(async (updates: Partial<AppState['profile']>) => {
    if (!state) return false;
    return updateState({
      profile: { ...state.profile, ...updates }
    });
  }, [state, updateState]);
  
  const addXP = useCallback(async (amount: number) => {
    if (!state || !state.progression) return false;
    
    let newXP = state.progression.xp + amount;
    let newLevel = state.progression.accountLevel;
    let newXPToNext = state.progression.xpToNext;
    
    // Level up logic
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newXPToNext = Math.floor(newXPToNext * 1.2); // Escalating XP requirement
    }
    
    return updateState({
      progression: {
        ...state.progression,
        xp: newXP,
        accountLevel: newLevel,
        xpToNext: newXPToNext
      }
    });
  }, [state, updateState]);
  
  return { profile, progression, updateProfile, addXP };
}

// ============= WORKOUT HOOKS =============

export function useWorkoutPlan() {
  const { state, updateState } = useAppState();
  
  const plan = state?.plan || null;
  const treinoProgresso = state?.treinoProgresso || {};
  const treinoHoje = state?.treinoHoje || null;
  const weeklyCompletions = state?.weeklyCompletions || {};
  
  const updatePlan = useCallback(async (newPlan: AppState['plan']) => {
    return updateState({ plan: newPlan });
  }, [updateState]);
  
  const updateTreinoProgresso = useCallback(async (progresso: TreinoProgresso) => {
    return updateState({ treinoProgresso: progresso });
  }, [updateState]);
  
  const setTreinoHoje = useCallback(async (treino: TreinoHoje | null) => {
    return updateState({ treinoHoje: treino });
  }, [updateState]);
  
  const markWorkoutCompleted = useCallback(async (
    workoutId: string,
    weekStart: string,
    completion: { completedAt: string; xpGained: number; setsCompleted: number; totalVolume: number }
  ) => {
    if (!state) return false;
    
    const newWeeklyCompletions = {
      ...state.weeklyCompletions,
      [weekStart]: {
        ...(state.weeklyCompletions?.[weekStart] || {}),
        [workoutId]: completion
      }
    };
    
    return updateState({ 
      weeklyCompletions: newWeeklyCompletions,
      treinoHoje: state.treinoHoje ? { ...state.treinoHoje, completedAt: completion.completedAt } : null
    });
  }, [state, updateState]);
  
  return { 
    plan, 
    treinoProgresso, 
    treinoHoje, 
    weeklyCompletions,
    updatePlan, 
    updateTreinoProgresso, 
    setTreinoHoje,
    markWorkoutCompleted
  };
}

// ============= NUTRITION HOOKS =============

export function useNutritionGoals() {
  const { state, updateState } = useAppState();
  
  const targets = state?.nutrition?.targets || null;
  const dietPlan = state?.nutrition?.dietPlan || null;
  
  const updateTargets = useCallback(async (newTargets: AppState['nutrition']['targets']) => {
    if (!state) return false;
    return updateState({
      nutrition: {
        ...state.nutrition,
        targets: newTargets
      }
    });
  }, [state, updateState]);
  
  const updateDietPlan = useCallback(async (newDiet: NutritionDiet | undefined) => {
    if (!state) return false;
    return updateState({
      nutrition: {
        ...state.nutrition,
        dietPlan: newDiet
      }
    });
  }, [state, updateState]);
  
  return { targets, dietPlan, updateTargets, updateDietPlan };
}

export function useNutritionToday() {
  const { user } = useAuth();
  const { state, updateState } = useAppState();
  const [todayData, setTodayData] = useState<NutritionToday | null>(null);
  const [loading, setLoading] = useState(true);
  
  const dateKey = getTodayDateKey();
  
  // Subscribe to today's nutrition
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    setLoading(true);
    
    const unsubscribe = subscribeToNutritionDay(user.uid, dateKey, (nutrition) => {
      if (nutrition) {
        setTodayData({
          dateKey: nutrition.dateKey,
          meals: nutrition.meals
        });
      } else {
        // Return empty structure
        setTodayData({
          dateKey,
          meals: [
            { id: 'cafe', nome: 'Café da Manhã', entries: [] },
            { id: 'almoco', nome: 'Almoço', entries: [] },
            { id: 'lanche', nome: 'Lanche', entries: [] },
            { id: 'jantar', nome: 'Jantar', entries: [] },
          ]
        });
      }
      setLoading(false);
    });
    
    return unsubscribe;
  }, [user, dateKey]);
  
  const updateToday = useCallback(async (updates: Partial<NutritionToday>) => {
    if (!user || !todayData) return false;
    
    const newData: NutritionDay = {
      ...todayData,
      ...updates,
      dateKey,
      updatedAt: null // Will be set by Firestore
    };
    
    // Optimistic update
    setTodayData({ ...todayData, ...updates });
    
    // Also update in main state for consistency
    if (state?.nutrition) {
      await updateState({
        nutrition: {
          ...state.nutrition,
          dailyLogs: {
            ...state.nutrition.dailyLogs,
            [dateKey]: newData
          }
        }
      });
    }
    
    // Save to dedicated nutrition collection
    return saveNutritionDay(user.uid, newData);
  }, [user, todayData, dateKey, state, updateState]);
  
  const toggleFoodConsumed = useCallback(async (mealId: string, entryId: string) => {
    if (!todayData) return false;
    
    const newMeals = todayData.meals.map(meal => {
      if (meal.id !== mealId) return meal;
      return {
        ...meal,
        entries: meal.entries.map(entry => {
          if (entry.id !== entryId) return entry;
          return { ...entry, consumed: !entry.consumed };
        })
      };
    });
    
    return updateToday({ meals: newMeals });
  }, [todayData, updateToday]);
  
  const toggleAllMealConsumed = useCallback(async (mealId: string) => {
    if (!todayData) return false;
    
    const meal = todayData.meals.find(m => m.id === mealId);
    if (!meal) return false;
    
    const allConsumed = meal.entries.every(e => e.consumed);
    
    const newMeals = todayData.meals.map(m => {
      if (m.id !== mealId) return m;
      return {
        ...m,
        entries: m.entries.map(entry => ({
          ...entry,
          consumed: !allConsumed
        }))
      };
    });
    
    return updateToday({ meals: newMeals });
  }, [todayData, updateToday]);
  
  return { 
    today: todayData, 
    loading, 
    updateToday, 
    toggleFoodConsumed, 
    toggleAllMealConsumed 
  };
}

// ============= WEIGHT HOOKS =============

export function useWeight() {
  const { user } = useAuth();
  const { state, updateState } = useAppState();
  
  const entries = state?.bodyweight?.entries || [];
  
  const addWeight = useCallback(async (weight: number) => {
    if (!user || !state) return false;
    
    const date = getTodayDateKey();
    
    // Update in main state
    const newEntries = [
      ...state.bodyweight.entries,
      { date, weight, updatedAt: Date.now() }
    ];
    
    const success = await updateState({
      bodyweight: { entries: newEntries }
    });
    
    // Also save to dedicated measurements collection
    if (success) {
      await saveWeightMeasurement(user.uid, date, weight);
    }
    
    return success;
  }, [user, state, updateState]);
  
  return { entries, addWeight };
}

// ============= QUESTS HOOKS =============

export function useQuests() {
  const { state, updateState } = useAppState();
  
  const quests = state?.quests || {
    treinoDoDiaDone: false,
    registrarAlimentacaoDone: false,
    registrarPesoDone: false
  };
  
  const updateQuests = useCallback(async (updates: Partial<Quests>) => {
    if (!state) return false;
    return updateState({
      quests: { ...state.quests, ...updates }
    });
  }, [state, updateState]);
  
  const completeQuest = useCallback(async (quest: keyof Quests) => {
    return updateQuests({ [quest]: true });
  }, [updateQuests]);
  
  return { quests, updateQuests, completeQuest };
}

// ============= ACHIEVEMENTS HOOKS =============

export function useAchievements() {
  const { state, updateState } = useAppState();
  
  const unlocked = state?.achievements?.unlocked || [];
  
  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!state) return false;
    
    if (state.achievements.unlocked.includes(achievementId)) {
      return true; // Already unlocked
    }
    
    return updateState({
      achievements: {
        unlocked: [...state.achievements.unlocked, achievementId],
        updatedAt: Date.now()
      }
    });
  }, [state, updateState]);
  
  return { unlocked, unlockAchievement };
}
