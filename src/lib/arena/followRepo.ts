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
  scheduleDays: number[];
  visibility: ProfileVisibility;
  clanId?: string;
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
 * Get a user's public profile
 */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  try {
    // First check for explicit public profile
    const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
    const publicSnap = await getDoc(publicRef);
    
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
        scheduleDays: data.scheduleDays || [],
        visibility: data.visibility || 'public',
        clanId: data.clanId,
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
        scheduleDays: data.scheduleCurrent?.trainingDays || [],
        visibility: data.visibility || 'public',
        clanId: data.clanId,
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
 * MVP logic: fetch public profiles from recent posts authors,
 * filter out self and already following,
 * rank by elo proximity, schedule overlap, and activity
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
    
    // Query posts to find active users (authors of recent public posts)
    const postsCol = collection(db, 'posts');
    const recentPostsQuery = query(
      postsCol,
      where('visibility', '==', 'public'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    let postsSnap;
    try {
      postsSnap = await getDocs(recentPostsQuery);
    } catch (error) {
      console.error('Error fetching posts for suggestions:', error);
      return [];
    }
    
    // Collect unique author IDs with their denormalized data
    const authorIds = new Set<string>();
    const authorDataMap = new Map<string, {
      displayName: string;
      photoURL?: string;
      avatarId?: string;
      elo: EloInfo;
    }>();
    
    postsSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const authorId = data.authorId;
      
      // Skip self and already following
      if (authorId === myUid || followingSet.has(authorId)) return;
      
      if (!authorIds.has(authorId)) {
        authorIds.add(authorId);
        authorDataMap.set(authorId, {
          displayName: data.authorName || 'Atleta',
          photoURL: data.authorAvatar,
          avatarId: data.authorAvatarId,
          elo: data.authorElo || getEloFromPoints(0),
        });
      }
    });
    
    // If no posts found, return empty
    if (authorIds.size === 0) {
      return [];
    }
    
    // Build suggestions from post author data (no extra profile fetch needed for MVP)
    const suggestions: SuggestedAthlete[] = [];
    
    for (const authorId of authorIds) {
      const authorData = authorDataMap.get(authorId);
      if (!authorData) continue;
      
      // Try to get full profile, but use post data as fallback
      let profile: PublicProfile | null = null;
      try {
        profile = await getPublicProfile(authorId);
      } catch {
        // Use denormalized data from post
      }
      
      const finalProfile: PublicProfile = profile || {
        userId: authorId,
        displayName: authorData.displayName,
        photoURL: authorData.photoURL,
        avatarId: authorData.avatarId,
        elo: authorData.elo,
        weeklyPoints: 0,
        totalWorkouts: 0,
        scheduleDays: [],
        visibility: 'public',
        createdAt: new Date().toISOString(),
      };
      
      // Skip if profile is not public
      if (profile && profile.visibility !== 'public') continue;
      
      // Calculate match score
      let matchScore = 0;
      let matchReason: 'same_elo' | 'schedule_overlap' | 'active' = 'active';
      
      if (myProfile) {
        // Same elo tier or ±1
        const myTierIndex = getEloTierIndex(myProfile.elo.tier);
        const theirTierIndex = getEloTierIndex(finalProfile.elo.tier);
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
        const theirDays = finalProfile.scheduleDays;
        const overlap = theirDays.filter(d => myDays.has(d)).length;
        
        if (overlap >= 2) {
          matchScore += 25;
          if (matchReason === 'active') matchReason = 'schedule_overlap';
        } else if (overlap === 1) {
          matchScore += 10;
        }
      }
      
      // Activity bonus (weekly points)
      matchScore += Math.min(finalProfile.weeklyPoints / 10, 20);
      
      suggestions.push({
        ...finalProfile,
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
