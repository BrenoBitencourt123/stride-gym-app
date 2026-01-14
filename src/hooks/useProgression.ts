// src/hooks/useProgression.ts
// React hook for accessing progression state (Firestore-backed)

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  FullProgressionState,
  UserStats,
  UserArena,
  subscribeToProgression,
  ensureProgressionDefaults,
  applyPendingMissPenalties,
  applyWorkoutRewards,
  getWeekPoints,
  updateTrainingSchedule,
  applyPendingScheduleIfDue,
} from '@/lib/firebase/progressionRepo';
import { getEloDisplayName, getEloFrameStyles } from '@/lib/arena/eloUtils';
import { EloTier } from '@/lib/arena/types';

export interface ProgressionData {
  // Stats (RPG - only goes up)
  level: number;
  xp: number;
  xpGoal: number;
  xpProgress: number; // 0-100 percentage
  
  // Arena (Competitive - can go up/down)
  eloPoints: number;
  eloTier: EloTier;
  eloDiv: number;
  eloDisplayName: string;
  eloStyles: ReturnType<typeof getEloFrameStyles>;
  weekPoints: number;
  
  // Schedule
  trainingDays: number[];
  plannedCount: number;
  pendingSchedule: number[] | null;
  
  // Clan
  clanId: string | null;
  
  // State
  loading: boolean;
  error: string | null;
}

const DEFAULT_PROGRESSION: ProgressionData = {
  level: 1,
  xp: 0,
  xpGoal: 500,
  xpProgress: 0,
  eloPoints: 0,
  eloTier: 'iron',
  eloDiv: 4,
  eloDisplayName: 'Ferro IV',
  eloStyles: getEloFrameStyles('iron'),
  weekPoints: 0,
  trainingDays: [],
  plannedCount: 0,
  pendingSchedule: null,
  clanId: null,
  loading: true,
  error: null,
};

export function useProgression() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressionData>(DEFAULT_PROGRESSION);
  const [initialized, setInitialized] = useState(false);

  // Initialize on first load
  useEffect(() => {
    if (!user?.uid) {
      setData({ ...DEFAULT_PROGRESSION, loading: false });
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const init = async () => {
      try {
        // Ensure defaults exist
        await ensureProgressionDefaults(user.uid);
        
        // Apply pending schedule if due
        await applyPendingScheduleIfDue(user.uid);
        
        // Apply any pending miss penalties
        await applyPendingMissPenalties(user.uid);
        
        // Subscribe to real-time updates
        unsubscribe = subscribeToProgression(user.uid, async (state) => {
          if (!state) {
            setData(prev => ({ ...prev, loading: false, error: 'Failed to load progression' }));
            return;
          }

          // Get week points (calculated from ledger)
          const weekPoints = await getWeekPoints(user.uid);

          const newData: ProgressionData = {
            // Stats
            level: state.stats.level,
            xp: state.stats.xp,
            xpGoal: state.stats.xpGoal,
            xpProgress: Math.min(100, (state.stats.xp / state.stats.xpGoal) * 100),
            
            // Arena
            eloPoints: state.arena.eloPoints,
            eloTier: state.arena.eloTier,
            eloDiv: state.arena.eloDiv,
            eloDisplayName: getEloDisplayName(state.arena.eloTier, state.arena.eloDiv),
            eloStyles: getEloFrameStyles(state.arena.eloTier),
            weekPoints,
            
            // Schedule
            trainingDays: state.arena.scheduleCurrent.plannedDays,
            plannedCount: state.arena.scheduleCurrent.plannedCount,
            pendingSchedule: state.arena.scheduleNext?.plannedDays || null,
            
            // Clan
            clanId: state.clanId,
            
            // State
            loading: false,
            error: null,
          };

          setData(newData);
          setInitialized(true);
        });
      } catch (error) {
        console.error('[useProgression] init error:', error);
        setData(prev => ({ ...prev, loading: false, error: 'Failed to initialize' }));
      }
    };

    init();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  // Apply workout rewards
  const completeWorkout = useCallback(async (dateKey?: string) => {
    if (!user?.uid) return null;
    
    try {
      const result = await applyWorkoutRewards(user.uid, dateKey);
      return result;
    } catch (error) {
      console.error('[useProgression] completeWorkout error:', error);
      return null;
    }
  }, [user?.uid]);

  // Update training schedule
  const setTrainingDays = useCallback(async (days: number[]) => {
    if (!user?.uid) return;
    
    try {
      await updateTrainingSchedule(user.uid, days);
    } catch (error) {
      console.error('[useProgression] setTrainingDays error:', error);
    }
  }, [user?.uid]);

  // Refresh progression data
  const refresh = useCallback(async () => {
    if (!user?.uid) return;
    
    setData(prev => ({ ...prev, loading: true }));
    
    try {
      await applyPendingScheduleIfDue(user.uid);
      await applyPendingMissPenalties(user.uid);
      // The subscription will update the data automatically
    } catch (error) {
      console.error('[useProgression] refresh error:', error);
    }
  }, [user?.uid]);

  return {
    ...data,
    completeWorkout,
    setTrainingDays,
    refresh,
    initialized,
  };
}

export default useProgression;
