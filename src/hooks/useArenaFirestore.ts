// src/hooks/useArenaFirestore.ts
// React hook for Arena Firestore operations with caching and real-time updates

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArenaProfile,
  Post,
  Clan,
  ClanMember,
  InAppNotification,
  ClanRankingEntry,
  FreezeRequest,
  WorkoutSnapshot,
  PostVisibility,
} from '@/lib/arena/types';
import * as arenaFirestore from '@/lib/arena/arenaFirestore';

// Cache for reducing Firestore reads
interface ArenaCache {
  profile?: ArenaProfile | null;
  profileLoadedAt?: number;
  clan?: Clan | null;
  clanLoadedAt?: number;
  members?: ClanMember[];
  membersLoadedAt?: number;
}

const CACHE_TTL = 30000; // 30 seconds

export function useArenaProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ArenaProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const cacheRef = useRef<ArenaCache>({});

  const loadProfile = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Check cache
    const cache = cacheRef.current;
    if (!forceRefresh && cache.profile !== undefined && cache.profileLoadedAt) {
      if (Date.now() - cache.profileLoadedAt < CACHE_TTL) {
        setProfile(cache.profile);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      // First, try to migrate from localStorage if needed
      await arenaFirestore.migrateLocalStorageToFirestore(user.uid);
      
      let arenaProfile = await arenaFirestore.getArenaProfile(user.uid);
      
      // Initialize if doesn't exist
      if (!arenaProfile) {
        arenaProfile = await arenaFirestore.initializeArenaProfile(
          user.uid,
          user.displayName || 'Atleta',
          user.photoURL || undefined
        );
      }
      
      cache.profile = arenaProfile;
      cache.profileLoadedAt = Date.now();
      setProfile(arenaProfile);
      setError(null);
    } catch (err) {
      console.error('Error loading arena profile:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const updateProfile = useCallback(async (updates: Partial<arenaFirestore.FirestoreArenaProfile>) => {
    if (!user) return;
    
    try {
      await arenaFirestore.updateArenaProfile(user.uid, updates);
      cacheRef.current.profile = undefined;
      await loadProfile(true);
    } catch (err) {
      console.error('Error updating profile:', err);
      throw err;
    }
  }, [user, loadProfile]);

  const updateSchedule = useCallback(async (trainingDays: number[]) => {
    if (!user) return;
    
    try {
      await arenaFirestore.updateScheduleNext(user.uid, trainingDays);
      cacheRef.current.profile = undefined;
      await loadProfile(true);
    } catch (err) {
      console.error('Error updating schedule:', err);
      throw err;
    }
  }, [user, loadProfile]);

  return {
    profile,
    loading,
    error,
    refresh: () => loadProfile(true),
    updateProfile,
    updateSchedule,
  };
}

export function useArenaFeed(type: 'global' | 'clan') {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [clanId, setClanId] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      if (type === 'global') {
        const result = await arenaFirestore.getGlobalFeed(20);
        setPosts(result.posts);
      } else {
        // Get user's clan first
        const clan = await arenaFirestore.getMyClan(user.uid);
        setClanId(clan?.id || null);
        
        if (clan) {
          const result = await arenaFirestore.getClanFeed(clan.id, 20);
          setPosts(result.posts);
        } else {
          setPosts([]);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error loading feed:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user, type]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  const toggleKudos = useCallback(async (postId: string) => {
    if (!user) return;
    
    try {
      const hasKudos = await arenaFirestore.toggleKudos(postId, user.uid);
      
      // Update local state
      setPosts(currentPosts => 
        currentPosts.map(post => 
          post.id === postId 
            ? { ...post, kudosCount: post.kudosCount + (hasKudos ? 1 : -1) }
            : post
        )
      );
    } catch (err) {
      console.error('Error toggling kudos:', err);
    }
  }, [user]);

  return {
    posts,
    loading,
    error,
    clanId,
    refresh: loadFeed,
    toggleKudos,
  };
}

export function useArenaPost(postId: string) {
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [hasKudos, setHasKudos] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!postId) return;

    const loadPost = async () => {
      setLoading(true);
      try {
        const postData = await arenaFirestore.getPostById(postId);
        setPost(postData);
        
        if (user && postData) {
          const kudosGiven = await arenaFirestore.hasGivenKudos(postId, user.uid);
          setHasKudos(kudosGiven);
        }
      } catch (err) {
        console.error('Error loading post:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [postId, user]);

  const toggleKudos = useCallback(async () => {
    if (!user || !post) return;
    
    try {
      const newHasKudos = await arenaFirestore.toggleKudos(postId, user.uid);
      setHasKudos(newHasKudos);
      setPost(p => p ? { ...p, kudosCount: p.kudosCount + (newHasKudos ? 1 : -1) } : null);
    } catch (err) {
      console.error('Error toggling kudos:', err);
    }
  }, [user, post, postId]);

  return { post, hasKudos, loading, toggleKudos };
}

export function useArenaClan() {
  const { user } = useAuth();
  const [clan, setClan] = useState<Clan | null>(null);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [freezeRequests, setFreezeRequests] = useState<FreezeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const loadClan = useCallback(async () => {
    if (!user) {
      setClan(null);
      setMembers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const userClan = await arenaFirestore.getMyClan(user.uid);
      setClan(userClan);
      
      if (userClan) {
        const clanMembers = await arenaFirestore.getClanMembers(userClan.id);
        setMembers(clanMembers);
        
        const requests = await arenaFirestore.getPendingFreezeRequests(userClan.id);
        setFreezeRequests(requests);
        
        // Subscribe to real-time member updates
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
        unsubscribeRef.current = arenaFirestore.subscribeToClanMembers(
          userClan.id,
          setMembers
        );
      }
    } catch (err) {
      console.error('Error loading clan:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadClan();
    
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadClan]);

  const createClan = useCallback(async (name: string, tag: string, description?: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const profile = await arenaFirestore.getArenaProfile(user.uid);
    if (!profile) throw new Error('Arena profile not initialized');
    
    const newClan = await arenaFirestore.createClan(user.uid, profile, name, tag, description);
    setClan(newClan);
    await loadClan();
    return newClan;
  }, [user, loadClan]);

  const joinClan = useCallback(async (inviteCode: string) => {
    if (!user) throw new Error('Must be logged in');
    
    const profile = await arenaFirestore.getArenaProfile(user.uid);
    if (!profile) throw new Error('Arena profile not initialized');
    
    const joinedClan = await arenaFirestore.joinClanByCode(user.uid, profile, inviteCode);
    if (joinedClan) {
      setClan(joinedClan);
      await loadClan();
    }
    return joinedClan;
  }, [user, loadClan]);

  const leaveClan = useCallback(async () => {
    if (!user || !clan) return;
    
    await arenaFirestore.leaveClan(user.uid, clan.id);
    setClan(null);
    setMembers([]);
  }, [user, clan]);

  const requestFreeze = useCallback(async (reason: string, freezeFrom: string, freezeUntil: string) => {
    if (!user || !clan) throw new Error('Must be in a clan');
    
    const profile = await arenaFirestore.getArenaProfile(user.uid);
    if (!profile) throw new Error('Profile not found');
    
    const request = await arenaFirestore.requestFreeze(
      user.uid,
      clan.id,
      profile.displayName,
      reason,
      freezeFrom,
      freezeUntil
    );
    
    setFreezeRequests(prev => [...prev, request]);
    return request;
  }, [user, clan]);

  const reviewFreeze = useCallback(async (requestId: string, approved: boolean) => {
    if (!user || !clan) return;
    
    await arenaFirestore.reviewFreezeRequest(clan.id, requestId, approved, user.uid);
    setFreezeRequests(prev => prev.filter(r => r.id !== requestId));
    await loadClan();
  }, [user, clan, loadClan]);

  const updateMemberRole = useCallback(async (targetUid: string, newRole: 'officer' | 'member') => {
    if (!clan) return;
    
    await arenaFirestore.updateMemberRole(clan.id, targetUid, newRole);
    await loadClan();
  }, [clan, loadClan]);

  const removeMember = useCallback(async (targetUid: string) => {
    if (!clan) return;
    
    await arenaFirestore.removeMember(clan.id, targetUid);
    await loadClan();
  }, [clan, loadClan]);

  return {
    clan,
    members,
    freezeRequests,
    loading,
    refresh: loadClan,
    createClan,
    joinClan,
    leaveClan,
    requestFreeze,
    reviewFreeze,
    updateMemberRole,
    removeMember,
  };
}

export function useArenaNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // Subscribe to real-time notifications
    unsubscribeRef.current = arenaFirestore.subscribeToNotifications(
      user.uid,
      (notifs) => {
        setNotifications(notifs);
        setUnreadCount(notifs.filter(n => !n.read).length);
        setLoading(false);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [user]);

  const markRead = useCallback(async (notificationId: string) => {
    if (!user) return;
    await arenaFirestore.markNotificationRead(user.uid, notificationId);
  }, [user]);

  const markAllRead = useCallback(async () => {
    if (!user) return;
    await arenaFirestore.markAllNotificationsRead(user.uid);
  }, [user]);

  const sendMotivation = useCallback(async (
    toUid: string,
    toDisplayName: string,
    messageIndex: number,
    clanId?: string
  ) => {
    if (!user) return;
    
    const profile = await arenaFirestore.getArenaProfile(user.uid);
    if (!profile) return;
    
    await arenaFirestore.sendMotivation(
      user.uid,
      profile.displayName,
      toUid,
      toDisplayName,
      messageIndex,
      clanId
    );
  }, [user]);

  return {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    sendMotivation,
  };
}

export function useArenaRankings() {
  const [weeklyRankings, setWeeklyRankings] = useState<ClanRankingEntry[]>([]);
  const [monthlyRankings, setMonthlyRankings] = useState<ClanRankingEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRankings = async () => {
      setLoading(true);
      try {
        const [weekly, monthly] = await Promise.all([
          arenaFirestore.getWeeklyRankings(),
          arenaFirestore.getMonthlyRankings(),
        ]);
        setWeeklyRankings(weekly);
        setMonthlyRankings(monthly);
      } catch (err) {
        console.error('Error loading rankings:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRankings();
  }, []);

  return { weeklyRankings, monthlyRankings, loading };
}

// Hook for creating posts
export function useCreatePost() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const createPost = useCallback(async (
    workoutSnapshot: WorkoutSnapshot,
    description: string,
    visibility: PostVisibility,
    postToClan: boolean,
    photoURL?: string
  ): Promise<Post | null> => {
    if (!user) return null;
    
    setLoading(true);
    try {
      let profile = await arenaFirestore.getArenaProfile(user.uid);
      
      // Initialize profile if it doesn't exist
      if (!profile) {
        console.log('[useCreatePost] Profile not found, initializing...');
        profile = await arenaFirestore.initializeArenaProfile(
          user.uid,
          user.displayName || 'Atleta',
          user.photoURL || undefined
        );
      }
      
      const post = await arenaFirestore.createPost(
        user.uid,
        profile,
        workoutSnapshot,
        description,
        visibility,
        postToClan,
        profile.clanId,
        photoURL
      );
      
      return post;
    } catch (err) {
      console.error('Error creating post:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return { createPost, loading };
}

// Hook for workout completion
export function useWorkoutComplete() {
  const { user } = useAuth();

  const onComplete = useCallback(async (workoutSnapshot: WorkoutSnapshot) => {
    if (!user) return;
    
    try {
      await arenaFirestore.onWorkoutCompleted(user.uid, workoutSnapshot);
    } catch (err) {
      console.error('Error recording workout completion:', err);
    }
  }, [user]);

  return { onComplete };
}
