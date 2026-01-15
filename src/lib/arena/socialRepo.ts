// src/lib/arena/socialRepo.ts
// Social features repository - username, public profiles, search

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { PublicProfile, EloInfo, Post } from './types';
import { getEloFromPoints } from './eloUtils';

// Re-export for convenience
export type PublicProfileData = PublicProfile;

// ============= USERNAME OPERATIONS =============

/**
 * Check if a username is available
 */
export async function isUsernameAvailable(username: string): Promise<boolean> {
  try {
    const usernameLower = username.toLowerCase().trim();
    
    // Check username format
    if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
      return false;
    }
    
    const usernameRef = doc(db, 'usernames', usernameLower);
    const snap = await getDoc(usernameRef);
    return !snap.exists();
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Reserve a username for a user
 */
export async function reserveUsername(uid: string, username: string): Promise<boolean> {
  try {
    const usernameLower = username.toLowerCase().trim();
    
    // Validate format
    if (!/^[a-z0-9_]{3,20}$/.test(usernameLower)) {
      throw new Error('Username inválido. Use 3-20 caracteres: letras, números e _');
    }
    
    // Check availability
    const available = await isUsernameAvailable(usernameLower);
    if (!available) {
      throw new Error('Este username já está em uso');
    }
    
    // Reserve the username
    const usernameRef = doc(db, 'usernames', usernameLower);
    await setDoc(usernameRef, {
      uid,
      createdAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error reserving username:', error);
    throw error;
  }
}

/**
 * Release a username (when user changes it)
 */
export async function releaseUsername(username: string): Promise<void> {
  try {
    const usernameLower = username.toLowerCase().trim();
    const usernameRef = doc(db, 'usernames', usernameLower);
    await deleteDoc(usernameRef);
  } catch (error) {
    console.error('Error releasing username:', error);
  }
}

/**
 * Get UID by username
 */
export async function getUidByUsername(username: string): Promise<string | null> {
  try {
    const usernameLower = username.toLowerCase().trim();
    const usernameRef = doc(db, 'usernames', usernameLower);
    const snap = await getDoc(usernameRef);
    
    if (snap.exists()) {
      return snap.data().uid;
    }
    return null;
  } catch (error) {
    console.error('Error getting UID by username:', error);
    return null;
  }
}

// ============= PUBLIC PROFILE OPERATIONS =============

/**
 * Get user's public profile
 */
export async function getPublicProfileByUid(uid: string): Promise<PublicProfile | null> {
  try {
    // First try dedicated publicProfile doc
    const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
    const publicSnap = await getDoc(publicRef);
    
    if (publicSnap.exists()) {
      const data = publicSnap.data();
      return {
        uid,
        username: data.username || '',
        usernameLower: data.usernameLower || data.username?.toLowerCase() || '',
        displayName: data.displayName || 'Atleta',
        bio: data.bio,
        location: data.location,
        photoURL: data.photoURL,
        avatarId: data.avatarId,
        coverPhotos: data.coverPhotos || [],
        instagramHandle: data.instagramHandle,
        elo: data.elo || getEloFromPoints(0),
        level: data.level || 1,
        xp: data.xp || 0,
        stats: data.stats || {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          workoutsCount: 0,
        },
        visibility: data.visibility || 'public',
        clanId: data.clanId,
        scheduleDays: data.scheduleDays || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    
    // Fallback to arena profile
    const arenaRef = doc(db, 'users', uid, 'arena', 'profile');
    const arenaSnap = await getDoc(arenaRef);
    
    if (arenaSnap.exists()) {
      const data = arenaSnap.data();
      return {
        uid,
        username: data.username || '',
        usernameLower: data.usernameLower || '',
        displayName: data.displayName || 'Atleta',
        bio: data.bio,
        location: data.location,
        photoURL: data.photoURL,
        avatarId: data.avatarId,
        coverPhotos: [],
        instagramHandle: data.instagramHandle,
        elo: data.elo || getEloFromPoints(0),
        level: data.level || 1,
        xp: data.xp || 0,
        stats: {
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
          workoutsCount: data.totalWorkouts || 0,
        },
        visibility: data.visibility || 'public',
        clanId: data.clanId,
        scheduleDays: data.scheduleCurrent?.trainingDays || [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting public profile:', error);
    return null;
  }
}

/**
 * Get public profile by username
 */
export async function getPublicProfileByUsername(username: string): Promise<PublicProfile | null> {
  try {
    const uid = await getUidByUsername(username);
    if (!uid) return null;
    return getPublicProfileByUid(uid);
  } catch (error) {
    console.error('Error getting profile by username:', error);
    return null;
  }
}

/**
 * Create or update public profile
 */
export async function updatePublicProfile(
  uid: string,
  updates: Partial<PublicProfile>
): Promise<boolean> {
  try {
    const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
    
    // If updating username, handle the reservation
    if (updates.username) {
      const currentProfile = await getPublicProfileByUid(uid);
      
      // Release old username if exists
      if (currentProfile?.username && currentProfile.username !== updates.username) {
        await releaseUsername(currentProfile.username);
      }
      
      // Reserve new username
      await reserveUsername(uid, updates.username);
      updates.usernameLower = updates.username.toLowerCase();
    }
    
    await setDoc(publicRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error updating public profile:', error);
    throw error;
  }
}

/**
 * Initialize public profile with username
 */
export async function initializePublicProfile(
  uid: string,
  username: string,
  displayName: string,
  photoURL?: string,
  avatarId?: string,
  elo?: EloInfo
): Promise<PublicProfile> {
  const usernameLower = username.toLowerCase().trim();
  
  // Reserve username first
  await reserveUsername(uid, username);
  
  const now = new Date().toISOString();
  const profile: PublicProfile = {
    uid,
    username: usernameLower,
    usernameLower,
    displayName,
    photoURL,
    avatarId,
    coverPhotos: [],
    elo: elo || getEloFromPoints(0),
    level: 1,
    xp: 0,
    stats: {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      workoutsCount: 0,
    },
    visibility: 'public',
    scheduleDays: [],
    createdAt: now,
    updatedAt: now,
  };
  
  const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
  await setDoc(publicRef, profile);
  
  // Also update arena profile with username
  const arenaRef = doc(db, 'users', uid, 'arena', 'profile');
  await setDoc(arenaRef, {
    username: usernameLower,
    usernameLower,
    updatedAt: now,
  }, { merge: true });
  
  return profile;
}

/**
 * Check if user has a username set
 */
export async function hasUsername(uid: string): Promise<boolean> {
  try {
    const profile = await getPublicProfileByUid(uid);
    return !!(profile?.username && profile.username.length > 0);
  } catch (error) {
    console.error('Error checking username:', error);
    return false;
  }
}

/**
 * Get or create a public profile
 */
export async function getOrCreatePublicProfile(
  uid: string,
  displayName: string,
  photoURL?: string,
  avatarId?: string
): Promise<PublicProfile> {
  const existing = await getPublicProfileByUid(uid);
  if (existing) return existing;
  
  const now = new Date().toISOString();
  const profile: PublicProfile = {
    uid,
    username: '',
    usernameLower: '',
    displayName,
    photoURL,
    avatarId,
    coverPhotos: [],
    elo: getEloFromPoints(0),
    level: 1,
    xp: 0,
    stats: {
      postsCount: 0,
      followersCount: 0,
      followingCount: 0,
      workoutsCount: 0,
    },
    visibility: 'public',
    scheduleDays: [],
    createdAt: now,
    updatedAt: now,
  };
  
  const publicRef = doc(db, 'users', uid, 'arena', 'publicProfile');
  await setDoc(publicRef, profile);
  
  return profile;
}
export async function searchUsers(
  term: string,
  limitCount: number = 20
): Promise<PublicProfile[]> {
  try {
    const termLower = term.toLowerCase().trim();
    if (termLower.length < 2) return [];
    
    const results: PublicProfile[] = [];
    const seenUids = new Set<string>();
    
    // Search usernames collection first (most accurate)
    const usernamesRef = collection(db, 'usernames');
    const usernameQuery = query(
      usernamesRef,
      where('__name__', '>=', termLower),
      where('__name__', '<', termLower + '\uf8ff'),
      limit(limitCount)
    );
    
    const usernameSnap = await getDocs(usernameQuery);
    
    for (const docSnap of usernameSnap.docs) {
      const uid = docSnap.data().uid;
      if (seenUids.has(uid)) continue;
      seenUids.add(uid);
      
      const profile = await getPublicProfileByUid(uid);
      if (profile && profile.visibility !== 'private') {
        results.push(profile);
      }
    }
    
    // If we need more results, search by displayName in arena profiles
    if (results.length < limitCount) {
      const usersCol = collection(db, 'users');
      const usersSnap = await getDocs(usersCol);
      
      for (const userDoc of usersSnap.docs) {
        if (seenUids.has(userDoc.id)) continue;
        if (results.length >= limitCount) break;
        
        try {
          const arenaRef = doc(db, 'users', userDoc.id, 'arena', 'profile');
          const arenaSnap = await getDoc(arenaRef);
          
          if (arenaSnap.exists()) {
            const data = arenaSnap.data();
            const displayNameLower = (data.displayName || '').toLowerCase();
            
            if (displayNameLower.startsWith(termLower)) {
              seenUids.add(userDoc.id);
              const profile = await getPublicProfileByUid(userDoc.id);
              if (profile && profile.visibility !== 'private') {
                results.push(profile);
              }
            }
          }
        } catch {
          // Skip inaccessible profiles
        }
      }
    }
    
    return results.slice(0, limitCount);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// ============= USER FEED OPERATIONS =============

/**
 * Get posts by a specific user
 */
export async function getUserPosts(
  authorId: string,
  limitCount: number = 20
): Promise<Post[]> {
  try {
    const postsCol = collection(db, 'posts');
    const q = query(
      postsCol,
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snap = await getDocs(q);
    const posts: Post[] = [];
    
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({
        id: docSnap.id,
        author: {
          userId: data.authorId,
          displayName: data.authorName,
          username: data.authorUsername,
          photoURL: data.authorAvatar,
          avatarId: data.authorAvatarId,
          elo: data.authorElo,
        },
        type: data.type || 'workout',
        visibility: data.visibility,
        postToClan: data.postToClan,
        clanId: data.clanId,
        text: data.text || data.description,
        description: data.description,
        media: data.media,
        photoURL: data.photoURL,
        workoutSnapshot: data.workoutSnapshot,
        kudosCount: data.kudosCount || 0,
        commentsCount: data.commentsCount || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      });
    });
    
    return posts;
  } catch (error) {
    console.error('Error getting user posts:', error);
    return [];
  }
}
