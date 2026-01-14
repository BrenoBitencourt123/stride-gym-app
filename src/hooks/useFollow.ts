// src/hooks/useFollow.ts
// React hook for follow/unfollow functionality

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as followRepo from '@/lib/arena/followRepo';

interface UseFollowResult {
  isFollowing: boolean;
  loading: boolean;
  toggleFollow: () => Promise<void>;
  followersCount: number;
  followingCount: number;
}

export function useFollow(targetUid: string | null): UseFollowResult {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  useEffect(() => {
    if (!user || !targetUid || targetUid === user.uid) {
      setLoading(false);
      return;
    }

    const loadFollowStatus = async () => {
      setLoading(true);
      try {
        const [following, followers, followingCt] = await Promise.all([
          followRepo.isFollowing(user.uid, targetUid),
          followRepo.getFollowersCount(targetUid),
          followRepo.getFollowingCount(targetUid),
        ]);
        
        setIsFollowing(following);
        setFollowersCount(followers);
        setFollowingCount(followingCt);
      } catch (error) {
        console.error('Error loading follow status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFollowStatus();
  }, [user, targetUid]);

  const toggleFollow = useCallback(async () => {
    if (!user || !targetUid || targetUid === user.uid) return;
    
    setLoading(true);
    
    // Optimistic update
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setFollowersCount(prev => prev + (wasFollowing ? -1 : 1));
    
    try {
      if (wasFollowing) {
        await followRepo.unfollowUser(user.uid, targetUid);
      } else {
        await followRepo.followUser(user.uid, targetUid);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => prev + (wasFollowing ? 1 : -1));
      console.error('Error toggling follow:', error);
    } finally {
      setLoading(false);
    }
  }, [user, targetUid, isFollowing]);

  return {
    isFollowing,
    loading,
    toggleFollow,
    followersCount,
    followingCount,
  };
}

// Hook to get my follow stats
export function useMyFollowStats() {
  const { user } = useAuth();
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStats = async () => {
      try {
        const [followers, following] = await Promise.all([
          followRepo.getFollowersCount(user.uid),
          followRepo.getFollowingCount(user.uid),
        ]);
        
        setFollowersCount(followers);
        setFollowingCount(following);
      } catch (error) {
        console.error('Error loading follow stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [user]);

  return { followersCount, followingCount, loading };
}
