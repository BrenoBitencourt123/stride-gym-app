// src/lib/arena/followRepo.ts
// Follow system repository - manages following/followers relationships

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { ArenaProfile, EloInfo } from './types';
import { getEloFromPoints } from './eloUtils';

// ============= TYPES =============

export type ProfileVisibility = 'public' | 'clanOnly' | 'private';

export interface PublicProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  avatarId?: string;
  elo: EloInfo;
  weeklyPoints: number;
  totalWorkouts: number;
  level: number;
  xp: number;
  xpGoal?: number;
  streak?: number;
  prsCount?: number;
  scheduleDays: number[];
  visibility: ProfileVisibility;
  clanId?: string;
  workoutHistory?: Array<{
    id: string;
    title: string;
    completedAt: string;
    duration: number;
    setsCount: number;
    volume: number;
  }>;
  weeklyActivity?: Array<{
    weekStart: string;
    workoutsCount: number;
    totalMinutes: number;
  }>;
  createdAt: string;
}

export interface FollowRelation {
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface SuggestedAthlete extends PublicProfile {
  matchScore: number; // Score based on elo, schedule overlap, etc.
  matchReason: 'same_elo' | 'schedule_overlap' | 'active';
}

// ============= FOLLOW OPERATIONS =============

/**
 * Follow a user
 */
export async function followUser(myUid: string, targetUid: string): Promise<boolean> {
  try {
    // Add to my following list
    const followingRef = doc(db, 'users', myUid, 'following', targetUid);
    await setDoc(followingRef, {
      createdAt: serverTimestamp(),
    });
    
    // Add to their followers list
    const followerRef = doc(db, 'users', targetUid, 'followers', myUid);
    await setDoc(followerRef, {
      createdAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error following user:', error);
    return false;
  }
}

/**
 * Unfollow a user
 */
export async function unfollowUser(myUid: string, targetUid: string): Promise<boolean> {
  try {
    // Remove from my following list
    const followingRef = doc(db, 'users', myUid, 'following', targetUid);
    await deleteDoc(followingRef);
    
    // Remove from their followers list
    const followerRef = doc(db, 'users', targetUid, 'followers', myUid);
    await deleteDoc(followerRef);
    
    return true;
  } catch (error) {
    console.error('Error unfollowing user:', error);
    return false;
  }
}

/**
 * Check if I'm following a user
 */
export async function isFollowing(myUid: string, targetUid: string): Promise<boolean> {
  try {
    const followingRef = doc(db, 'users', myUid, 'following', targetUid);
    const snap = await getDoc(followingRef);
    return snap.exists();
  } catch (error) {
    console.error('Error checking follow status:', error);
    return false;
  }
}

/**
 * Get list of users I'm following
 */
export async function getFollowing(uid: string): Promise<string[]> {
  try {
    const followingCol = collection(db, 'users', uid, 'following');
    const snap = await getDocs(followingCol);
    return snap.docs.map(doc => doc.id);
  } catch (error: any) {
    // Permission denied is expected if subcollection doesn't exist yet
    if (error?.code === 'permission-denied') {
      return [];
    }
    console.error('Error getting following list:', error);
    return [];
  }
}

/**
 * Get list of my followers
 */
export async function getFollowers(uid: string): Promise<string[]> {
  try {
    const followersCol = collection(db, 'users', uid, 'followers');
    const snap = await getDocs(followersCol);
    return snap.docs.map(doc => doc.id);
  } catch (error) {
    console.error('Error getting followers list:', error);
    return [];
  }
}

/**
 * Get following count
 */
export async function getFollowingCount(uid: string): Promise<number> {
  const following = await getFollowing(uid);
  return following.length;
}

/**
 * Get followers count
 */
export async function getFollowersCount(uid: string): Promise<number> {
  const followers = await getFollowers(uid);
  return followers.length;
}

// ============= PUBLIC PROFILE =============

/**
 * Get a user's public profile with progression data
 */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  try {
    // First check for explicit public profile
    const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
    const publicSnap = await getDoc(publicRef);
    
    // Also fetch progression data
    const progressionRef = doc(db, 'users', uid, 'arena', 'progression');
    const progressionSnap = await getDoc(progressionRef);
    const progression = progressionSnap.exists() ? progressionSnap.data() : {};
    
    // Fetch workout history for the profile
    const workoutHistory = await fetchUserWorkoutHistory(uid);
    const weeklyActivity = await fetchUserWeeklyActivity(uid);
    
    if (publicSnap.exists()) {
      const data = publicSnap.data();
      return {
        userId: uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        avatarId: data.avatarId,
        elo: data.elo || getEloFromPoints(0),
        weeklyPoints: data.weeklyPoints || 0,
        totalWorkouts: data.totalWorkouts || 0,
        level: progression.level || data.level || 1,
        xp: progression.xp || data.xp || 0,
        xpGoal: progression.xpGoal || 500,
        streak: progression.streak || 0,
        prsCount: progression.prsCount || 0,
        scheduleDays: data.scheduleDays || [],
        visibility: data.visibility || 'public',
        clanId: data.clanId,
        workoutHistory,
        weeklyActivity,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    }
    
    // Fallback to arena profile
    const profileRef = doc(db, 'users', uid, 'arena', 'profile');
    const profileSnap = await getDoc(profileRef);
    
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      return {
        userId: uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        avatarId: data.avatarId,
        elo: data.elo || getEloFromPoints(0),
        weeklyPoints: data.weeklyPoints || 0,
        totalWorkouts: data.totalWorkouts || 0,
        level: progression.level || data.level || 1,
        xp: progression.xp || data.xp || 0,
        xpGoal: progression.xpGoal || 500,
        streak: progression.streak || 0,
        prsCount: progression.prsCount || 0,
        scheduleDays: data.scheduleCurrent?.trainingDays || [],
        visibility: data.visibility || 'public',
        clanId: data.clanId,
        workoutHistory,
        weeklyActivity,
        createdAt: data.createdAt || new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting public profile:', error);
    return null;
  }
}

/**
 * Fetch user's recent workout history (last 10)
 */
async function fetchUserWorkoutHistory(uid: string): Promise<Array<{
  id: string;
  title: string;
  completedAt: string;
  duration: number;
  setsCount: number;
  volume: number;
}>> {
  try {
    const postsCol = collection(db, 'posts');
    const q = query(
      postsCol,
      where('authorId', '==', uid),
      where('type', 'in', ['workout', 'mixed']),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    
    const snap = await getDocs(q);
    const history: Array<{
      id: string;
      title: string;
      completedAt: string;
      duration: number;
      setsCount: number;
      volume: number;
    }> = [];
    
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.workoutSnapshot) {
        history.push({
          id: docSnap.id,
          title: data.workoutSnapshot.workoutTitle || 'Treino',
          completedAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          duration: data.workoutSnapshot.duration || 0,
          setsCount: data.workoutSnapshot.totalSets || 0,
          volume: data.workoutSnapshot.totalVolume || 0,
        });
      }
    });
    
    return history;
  } catch (error) {
    console.error('Error fetching workout history:', error);
    return [];
  }
}

/**
 * Fetch user's weekly activity for the last 12 weeks
 */
async function fetchUserWeeklyActivity(uid: string): Promise<Array<{
  weekStart: string;
  workoutsCount: number;
  totalMinutes: number;
}>> {
  try {
    // Get posts from the last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);
    
    const postsCol = collection(db, 'posts');
    const q = query(
      postsCol,
      where('authorId', '==', uid),
      where('type', 'in', ['workout', 'mixed']),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snap = await getDocs(q);
    
    // Group by week
    const weekMap = new Map<string, { count: number; minutes: number }>();
    
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const createdAt = data.createdAt?.toDate?.() || new Date();
      
      // Get week start (Monday)
      const weekStart = getWeekStart(createdAt);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const existing = weekMap.get(weekKey) || { count: 0, minutes: 0 };
      existing.count += 1;
      existing.minutes += Math.floor((data.workoutSnapshot?.duration || 0) / 60);
      weekMap.set(weekKey, existing);
    });
    
    // Build array for last 12 weeks
    const result: Array<{
      weekStart: string;
      workoutsCount: number;
      totalMinutes: number;
    }> = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 7));
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split('T')[0];
      
      const weekData = weekMap.get(weekKey);
      result.push({
        weekStart: weekKey,
        workoutsCount: weekData?.count || 0,
        totalMinutes: weekData?.minutes || 0,
      });
    }
    
    return result;
  } catch (error) {
    console.error('Error fetching weekly activity:', error);
    return [];
  }
}

/**
 * Get the Monday of the week for a given date
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Update profile visibility
 */
export async function updateProfileVisibility(
  uid: string, 
  visibility: ProfileVisibility
): Promise<boolean> {
  try {
    const profileRef = doc(db, 'users', uid, 'arena', 'profile');
    await setDoc(profileRef, { visibility }, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating visibility:', error);
    return false;
  }
}

// ============= SUGGESTIONS =============

/**
 * Get suggested athletes to follow
 * Fetches public profiles from arena collection,
 * filters out self and already following,
 * ranks by elo proximity, schedule overlap, and activity
 */
export async function getSuggestedAthletes(
  myUid: string,
  myProfile: ArenaProfile | null,
  limitCount: number = 15
): Promise<SuggestedAthlete[]> {
  try {
    // Get list of users I'm already following (silent fail if empty)
    let followingSet = new Set<string>();
    try {
      const followingList = await getFollowing(myUid);
      followingSet = new Set(followingList);
    } catch {
      // Ignore - new users won't have following list
    }
    
    // Query arena profiles directly to find active users
    const usersCol = collection(db, 'users');
    const usersSnap = await getDocs(usersCol);
    
    // Collect users with arena profiles
    const candidates: Array<{
      userId: string;
      displayName: string;
      photoURL?: string;
      avatarId?: string;
      elo: EloInfo;
      weeklyPoints: number;
      totalWorkouts: number;
      scheduleDays: number[];
    }> = [];
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      
      // Skip self and already following
      if (userId === myUid || followingSet.has(userId)) continue;
      
      // Try to get arena profile
      try {
        const arenaDoc = await getDoc(doc(db, 'users', userId, 'arena', 'profile'));
        if (arenaDoc.exists()) {
          const arenaData = arenaDoc.data();
          // Only include public profiles
          if (arenaData.visibility === 'private') continue;
          
          candidates.push({
            userId,
            displayName: arenaData.displayName || userDoc.data()?.displayName || 'Atleta',
            photoURL: arenaData.photoURL || userDoc.data()?.photoURL,
            avatarId: arenaData.avatarId,
            elo: arenaData.elo || getEloFromPoints(0),
            weeklyPoints: arenaData.weeklyPoints || 0,
            totalWorkouts: arenaData.totalWorkouts || 0,
            scheduleDays: arenaData.schedule?.current?.trainingDays || [],
          });
        }
      } catch {
        // Skip users we can't read
      }
    }
    
    // If no candidates found, return empty
    if (candidates.length === 0) {
      return [];
    }
    
    // Build suggestions from candidate data
    const suggestions: SuggestedAthlete[] = [];
    
    for (const candidate of candidates) {
      // Calculate match score
      let matchScore = 0;
      let matchReason: 'same_elo' | 'schedule_overlap' | 'active' = 'active';
      
      if (myProfile) {
        // Same elo tier or ±1
        const myTierIndex = getEloTierIndex(myProfile.elo.tier);
        const theirTierIndex = getEloTierIndex(candidate.elo.tier);
        const tierDiff = Math.abs(myTierIndex - theirTierIndex);
        
        if (tierDiff === 0) {
          matchScore += 30;
          matchReason = 'same_elo';
        } else if (tierDiff === 1) {
          matchScore += 20;
          matchReason = 'same_elo';
        }
        
        // Schedule overlap
        const myDays = new Set(myProfile.schedule.current.trainingDays);
        const theirDays = candidate.scheduleDays;
        const overlap = theirDays.filter(d => myDays.has(d)).length;
        
        if (overlap >= 2) {
          matchScore += 25;
          if (matchReason === 'active') matchReason = 'schedule_overlap';
        } else if (overlap === 1) {
          matchScore += 10;
        }
      }
      
      // Activity bonus (weekly points)
      matchScore += Math.min(candidate.weeklyPoints / 10, 20);
      
      suggestions.push({
        userId: candidate.userId,
        displayName: candidate.displayName,
        photoURL: candidate.photoURL,
        avatarId: candidate.avatarId,
        elo: candidate.elo,
        weeklyPoints: candidate.weeklyPoints,
        totalWorkouts: candidate.totalWorkouts,
        level: 1,
        xp: 0,
        scheduleDays: candidate.scheduleDays,
        visibility: 'public',
        createdAt: new Date().toISOString(),
        matchScore,
        matchReason,
      });
    }
    
    // Sort by match score descending
    suggestions.sort((a, b) => b.matchScore - a.matchScore);
    
    return suggestions.slice(0, limitCount);
  } catch (error) {
    console.error('Error getting suggested athletes:', error);
    return [];
  }
}

// Helper to get tier index for comparison
function getEloTierIndex(tier: string): number {
  const tiers = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'];
  return tiers.indexOf(tier);
}
