// src/hooks/useSuggestedAthletes.ts
// React hook for fetching suggested athletes to follow

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useArenaProfile } from './useArenaFirestore';
import { getSuggestedAthletes, SuggestedAthlete, followUser, isFollowing } from '@/lib/arena/followRepo';

export function useSuggestedAthletes(limitCount: number = 15) {
  const { user } = useAuth();
  const { profile } = useArenaProfile();
  const [athletes, setAthletes] = useState<SuggestedAthlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  const loadSuggestions = useCallback(async () => {
    if (!user) {
      setAthletes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const suggestions = await getSuggestedAthletes(user.uid, profile, limitCount);
      setAthletes(suggestions);
      
      // Initialize following states
      const states: Record<string, boolean> = {};
      for (const athlete of suggestions) {
        states[athlete.userId] = false;
      }
      setFollowingStates(states);
      
      setError(null);
    } catch (err) {
      console.error('Error loading suggestions:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, profile, limitCount]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const followAthlete = useCallback(async (targetUid: string) => {
    if (!user) return;
    
    // Optimistic update
    setFollowingStates(prev => ({ ...prev, [targetUid]: true }));
    
    try {
      await followUser(user.uid, targetUid);
    } catch (error) {
      // Revert on error
      setFollowingStates(prev => ({ ...prev, [targetUid]: false }));
      console.error('Error following athlete:', error);
    }
  }, [user]);

  const hideAthlete = useCallback((targetUid: string) => {
    setAthletes(prev => prev.filter(a => a.userId !== targetUid));
  }, []);

  return {
    athletes,
    loading,
    error,
    refresh: loadSuggestions,
    followAthlete,
    hideAthlete,
    followingStates,
  };
}
