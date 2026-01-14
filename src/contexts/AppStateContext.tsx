// src/contexts/AppStateContext.tsx
// Global AppState context with Firebase-first persistence
// Replaces localStorage-based state management

import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import {
  getUserState,
  setUserState,
  subscribeToUserState,
  migrateLocalStorageToFirestore,
  hasBeenMigrated
} from '@/lib/firebase/firestoreRepo';
import { getLocalState, createNewUserState, type AppState, type OnboardingData } from '@/lib/appState';
import { isDevModeBypass, save, load } from '@/lib/localStore';
import type { NutritionToday, NutritionDiet, Quests, TreinoHoje, TreinoProgresso, UserWorkoutPlan } from '@/lib/appState';

// ============= CONSTANTS =============
const DEV_STATE_KEY = 'levelup.devState.v1';

// ============= TYPES =============

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface AppStateContextType {
  // State
  state: AppState | null;
  loading: boolean;
  syncState: SyncState;
  error: string | null;
  
  // Core actions
  updateState: (updates: Partial<AppState>) => Promise<boolean>;
  refreshState: () => Promise<void>;
  
  // Derived getters (for backward compatibility)
  getProfile: () => AppState['profile'] | null;
  getProgression: () => AppState['progression'] | null;
  getPlan: () => UserWorkoutPlan | null;
  getNutritionTargets: () => AppState['nutrition']['targets'] | null;
  getNutritionDiet: () => NutritionDiet | undefined;
  getNutritionToday: () => NutritionToday | null;
  getQuests: () => Quests | null;
  getTreinoHoje: () => TreinoHoje | null;
  getTreinoProgresso: () => TreinoProgresso | null;
  getWeeklyCompletions: (weekStart: string) => Record<string, any> | null;
  getOnboarding: () => OnboardingData | null;
  
  // Specific updaters
  updateProfile: (updates: Partial<AppState['profile']>) => Promise<boolean>;
  updateProgression: (updates: Partial<AppState['progression']>) => Promise<boolean>;
  updatePlan: (plan: UserWorkoutPlan) => Promise<boolean>;
  updateNutritionTargets: (targets: AppState['nutrition']['targets']) => Promise<boolean>;
  updateNutritionDiet: (diet: NutritionDiet | undefined) => Promise<boolean>;
  updateNutritionToday: (today: NutritionToday) => Promise<boolean>;
  updateQuests: (quests: Partial<Quests>) => Promise<boolean>;
  updateTreinoHoje: (treino: TreinoHoje | null) => Promise<boolean>;
  updateTreinoProgresso: (progresso: TreinoProgresso) => Promise<boolean>;
  markWorkoutCompleted: (workoutId: string, weekStart: string, completion: any) => Promise<boolean>;
  addXP: (amount: number) => Promise<boolean>;
  updateOnboarding: (data: OnboardingData | null) => Promise<boolean>;
  isOnboardingComplete: () => boolean;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

// ============= PROVIDER =============

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<AppState | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const migrationDoneRef = useRef(false);
  const devModeBypass = isDevModeBypass();
  
  // Initialize and subscribe to state
  useEffect(() => {
    // Dev mode bypass - use localStorage instead of Firebase
    if (devModeBypass && !user) {
      const devState = load<AppState | null>(DEV_STATE_KEY, null);
      if (devState) {
        setState(devState);
      } else {
        const newState = createNewUserState();
        setState(newState);
        save(DEV_STATE_KEY, newState);
      }
      setLoading(false);
      setSyncState('synced');
      return;
    }
    
    if (!user) {
      setState(null);
      setLoading(false);
      setSyncState('idle');
      return;
    }
    
    let isMounted = true;
    
    const initialize = async () => {
      setLoading(true);
      setSyncState('syncing');
      
      try {
        // One-time migration from localStorage
        if (!migrationDoneRef.current) {
          const alreadyMigrated = await hasBeenMigrated(user.uid);
          
          if (!alreadyMigrated) {
            console.log('[AppStateContext] Starting localStorage migration...');
            const localState = getLocalState();
            const result = await migrateLocalStorageToFirestore(user.uid, localState);
            
            if (result.success) {
              console.log('[AppStateContext] Migration completed');
            } else {
              console.warn('[AppStateContext] Migration failed:', result.error);
            }
          }
          
          migrationDoneRef.current = true;
        }
        
        // Get current state from Firestore
        let firestoreState = await getUserState(user.uid);
        
        if (!firestoreState) {
          // Create new state for new users
          const newState = createNewUserState();
          await setUserState(user.uid, newState);
          firestoreState = newState;
        } else {
          // Check if existing user has empty workout plan
          const hasPlan = firestoreState.plan && 
                          Array.isArray(firestoreState.plan.workouts) && 
                          firestoreState.plan.workouts.length > 0;
          
          if (!hasPlan) {
            // Merge default plan into existing state
            const defaultState = createNewUserState();
            firestoreState = {
              ...firestoreState,
              plan: defaultState.plan,
            };
            await setUserState(user.uid, firestoreState);
            console.log('[AppStateContext] Added default workout plan to existing user');
          }
        }
        
        if (isMounted) {
          setState(firestoreState);
          setLoading(false);
          setSyncState('synced');
        }
        
        // Subscribe to real-time updates
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        
        unsubscribeRef.current = subscribeToUserState(user.uid, (newState) => {
          if (isMounted && newState) {
            setState(newState);
            setSyncState('synced');
          }
        });
        
      } catch (err) {
        console.error('[AppStateContext] Initialization error:', err);
        if (isMounted) {
          setError(String(err));
          setLoading(false);
          setSyncState('error');
        }
      }
    };
    
    initialize();
    
    // Handle online/offline
    const handleOnline = () => setSyncState('syncing');
    const handleOffline = () => setSyncState('offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (!navigator.onLine) {
      setSyncState('offline');
    }
    
    return () => {
      isMounted = false;
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);
  
  // ============= CORE ACTIONS =============
  
  const updateState = useCallback(async (updates: Partial<AppState>): Promise<boolean> => {
    if (!state) return false;
    
    const newState: AppState = {
      ...state,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Optimistic update
    setState(newState);
    setSyncState('syncing');
    
    // Dev mode - save to localStorage instead of Firebase
    if (devModeBypass && !user) {
      save(DEV_STATE_KEY, newState);
      setSyncState('synced');
      return true;
    }
    
    // Persist to Firestore
    if (!user) {
      setSyncState('error');
      return false;
    }
    
    const success = await setUserState(user.uid, newState);
    
    if (success) {
      setSyncState('synced');
    } else {
      // Rollback on failure
      setState(state);
      setSyncState('error');
    }
    
    return success;
  }, [user, state, devModeBypass]);
  
  const refreshState = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    const firestoreState = await getUserState(user.uid);
    if (firestoreState) {
      setState(firestoreState);
    }
    setLoading(false);
  }, [user]);
  
  // ============= GETTERS =============
  
  const getProfile = useCallback(() => state?.profile || null, [state]);
  const getProgression = useCallback(() => state?.progression || null, [state]);
  const getPlan = useCallback(() => state?.plan || null, [state]);
  const getNutritionTargets = useCallback(() => state?.nutrition?.targets || null, [state]);
  const getNutritionDiet = useCallback(() => state?.nutrition?.dietPlan, [state]);
  
  const getNutritionToday = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return state?.nutrition?.dailyLogs?.[today] || null;
  }, [state]);
  
  const getQuests = useCallback(() => state?.quests || null, [state]);
  const getTreinoHoje = useCallback(() => state?.treinoHoje || null, [state]);
  const getTreinoProgresso = useCallback(() => state?.treinoProgresso || null, [state]);
  
  const getWeeklyCompletions = useCallback((weekStart: string) => {
    return state?.weeklyCompletions?.[weekStart] || null;
  }, [state]);
  
  const getOnboarding = useCallback(() => {
    return state?.onboarding || null;
  }, [state]);
  
  const isOnboardingComplete = useCallback(() => {
    return state?.onboarding?.completedAt != null;
  }, [state]);
  
  // ============= SPECIFIC UPDATERS =============
  
  const updateProfile = useCallback(async (updates: Partial<AppState['profile']>) => {
    if (!state) return false;
    return updateState({ profile: { ...state.profile, ...updates } });
  }, [state, updateState]);
  
  const updateProgression = useCallback(async (updates: Partial<AppState['progression']>) => {
    if (!state) return false;
    return updateState({ progression: { ...state.progression, ...updates } });
  }, [state, updateState]);
  
  const updatePlan = useCallback(async (plan: UserWorkoutPlan) => {
    return updateState({ plan });
  }, [updateState]);
  
  const updateNutritionTargets = useCallback(async (targets: AppState['nutrition']['targets']) => {
    if (!state) return false;
    return updateState({
      nutrition: { ...state.nutrition, targets }
    });
  }, [state, updateState]);
  
  const updateNutritionDiet = useCallback(async (diet: NutritionDiet | undefined) => {
    if (!state) return false;
    return updateState({
      nutrition: { ...state.nutrition, dietPlan: diet }
    });
  }, [state, updateState]);
  
  const updateNutritionToday = useCallback(async (today: NutritionToday) => {
    if (!state) return false;
    return updateState({
      nutrition: {
        ...state.nutrition,
        dailyLogs: {
          ...state.nutrition.dailyLogs,
          [today.dateKey]: today
        }
      }
    });
  }, [state, updateState]);
  
  const updateQuests = useCallback(async (quests: Partial<Quests>) => {
    if (!state) return false;
    return updateState({ quests: { ...state.quests, ...quests } as Quests });
  }, [state, updateState]);
  
  const updateTreinoHoje = useCallback(async (treino: TreinoHoje | null) => {
    return updateState({ treinoHoje: treino });
  }, [updateState]);
  
  const updateTreinoProgresso = useCallback(async (progresso: TreinoProgresso) => {
    return updateState({ treinoProgresso: progresso });
  }, [updateState]);
  
  const markWorkoutCompleted = useCallback(async (
    workoutId: string,
    weekStart: string,
    completion: any
  ) => {
    if (!state) return false;
    
    return updateState({
      weeklyCompletions: {
        ...state.weeklyCompletions,
        [weekStart]: {
          ...(state.weeklyCompletions?.[weekStart] || {}),
          [workoutId]: completion
        }
      },
      treinoHoje: state.treinoHoje 
        ? { ...state.treinoHoje, completedAt: completion.completedAt } 
        : null
    });
  }, [state, updateState]);
  
  const addXP = useCallback(async (amount: number) => {
    if (!state?.progression) return false;
    
    let newXP = state.progression.xp + amount;
    let newLevel = state.progression.accountLevel;
    let newXPToNext = state.progression.xpToNext;
    
    while (newXP >= newXPToNext) {
      newXP -= newXPToNext;
      newLevel += 1;
      newXPToNext = Math.floor(newXPToNext * 1.2);
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
  
  const updateOnboarding = useCallback(async (data: OnboardingData | null) => {
    // Handle case where state is not yet initialized (new users during onboarding)
    const currentState = state || createNewUserState();
    
    // Also update nutrition targets based on onboarding plan
    const updates: Partial<AppState> = {
      onboarding: data
    };
    
    if (data?.plan) {
      updates.nutrition = {
        ...currentState.nutrition,
        targets: {
          kcal: data.plan.targetKcal,
          protein: data.plan.proteinG,
          carbs: data.plan.carbsG,
          fats: data.plan.fatG,
        }
      };
    }
    
    const newState: AppState = {
      ...currentState,
      ...updates,
      updatedAt: Date.now()
    };
    
    // Optimistic update
    setState(newState);
    setSyncState('syncing');
    
    // Dev mode - save to localStorage instead of Firebase
    if (devModeBypass && !user) {
      save(DEV_STATE_KEY, newState);
      setSyncState('synced');
      return true;
    }
    
    // Persist to Firestore
    if (!user) {
      setSyncState('error');
      return false;
    }
    
    const success = await setUserState(user.uid, newState);
    
    if (success) {
      setSyncState('synced');
    } else {
      setState(state);
      setSyncState('error');
    }
    
    return success;
  }, [user, state, devModeBypass]);
  
  // ============= CONTEXT VALUE =============
  
  const value: AppStateContextType = {
    state,
    loading,
    syncState,
    error,
    updateState,
    refreshState,
    getProfile,
    getProgression,
    getPlan,
    getNutritionTargets,
    getNutritionDiet,
    getNutritionToday,
    getQuests,
    getTreinoHoje,
    getTreinoProgresso,
    getWeeklyCompletions,
    getOnboarding,
    updateProfile,
    updateProgression,
    updatePlan,
    updateNutritionTargets,
    updateNutritionDiet,
    updateNutritionToday,
    updateQuests,
    updateTreinoHoje,
    updateTreinoProgresso,
    markWorkoutCompleted,
    addXP,
    updateOnboarding,
    isOnboardingComplete
  };
  
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

// ============= HOOK =============

export function useAppStateContext() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppStateContext must be used within an AppStateProvider');
  }
  return context;
}

// ============= CONVENIENCE HOOKS =============

export function useProfile() {
  const { getProfile, updateProfile, getProgression, addXP } = useAppStateContext();
  return {
    profile: getProfile(),
    progression: getProgression(),
    updateProfile,
    addXP
  };
}

export function useWorkoutPlan() {
  const { 
    getPlan, 
    getTreinoHoje, 
    getTreinoProgresso, 
    getWeeklyCompletions,
    updatePlan, 
    updateTreinoHoje, 
    updateTreinoProgresso,
    markWorkoutCompleted
  } = useAppStateContext();
  
  return {
    plan: getPlan(),
    treinoHoje: getTreinoHoje(),
    treinoProgresso: getTreinoProgresso(),
    getWeeklyCompletions,
    updatePlan,
    updateTreinoHoje,
    updateTreinoProgresso,
    markWorkoutCompleted
  };
}

export function useNutrition() {
  const { 
    getNutritionTargets, 
    getNutritionDiet, 
    getNutritionToday,
    updateNutritionTargets,
    updateNutritionDiet,
    updateNutritionToday
  } = useAppStateContext();
  
  return {
    targets: getNutritionTargets(),
    dietPlan: getNutritionDiet(),
    today: getNutritionToday(),
    updateTargets: updateNutritionTargets,
    updateDietPlan: updateNutritionDiet,
    updateToday: updateNutritionToday
  };
}

export function useQuests() {
  const { getQuests, updateQuests } = useAppStateContext();
  return {
    quests: getQuests(),
    updateQuests
  };
}
