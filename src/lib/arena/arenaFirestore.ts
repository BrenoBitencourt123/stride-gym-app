// src/lib/arena/arenaFirestore.ts
// Arena Firestore persistence layer - source of truth for all Arena data

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  onSnapshot,
  increment,
  Timestamp,
  writeBatch,
  type DocumentSnapshot,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import {
  ArenaProfile,
  Post,
  PostAuthor,
  WorkoutSnapshot,
  Clan,
  ClanMember,
  ClanRankingEntry,
  FreezeRequest,
  InAppNotification,
  EloInfo,
  PostVisibility,
  WeeklySchedule,
  ArenaScheduleState,
} from './types';
import { getEloFromPoints, calculateMedianElo } from './eloUtils';
import { createDefaultSchedule, calculateWorkoutPoints, getSaoPauloDayIndex, applyPendingScheduleIfDue } from './scheduleUtils';

// ============= COLLECTION REFERENCES =============

const usersCol = () => collection(db, 'users');
const postsCol = () => collection(db, 'posts');
const clansCol = () => collection(db, 'clans');
const invitesCol = () => collection(db, 'invites');
const notificationsCol = (uid: string) => collection(db, 'notifications', uid, 'items');

// ============= ARENA PROFILE =============

export interface FirestoreArenaProfile {
  displayName: string;
  photoURL?: string;
  avatarId?: string;
  elo: EloInfo;
  scheduleCurrent: WeeklySchedule;
  scheduleNext?: WeeklySchedule | null;
  nextScheduleEffectiveAt?: string | null;
  weeklyPoints: number;
  totalWorkouts: number;
  clanId?: string | null;
  freezeStatus?: {
    frozen: boolean;
    freezeUntil?: string;
    frozenDaysLast30: number;
  };
  migratedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export async function getArenaProfile(uid: string): Promise<ArenaProfile | null> {
  try {
    const docRef = doc(db, 'users', uid, 'arena', 'profile');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data() as FirestoreArenaProfile;
    
    // Convert to ArenaProfile format
    const profile: ArenaProfile = {
      userId: uid,
      displayName: data.displayName,
      photoURL: data.photoURL,
      avatarId: data.avatarId,
      elo: data.elo,
      schedule: {
        current: data.scheduleCurrent,
        pending: data.scheduleNext || undefined,
      },
      weeklyPoints: data.weeklyPoints,
      totalWorkouts: data.totalWorkouts,
      clanId: data.clanId || undefined,
      freezeStatus: data.freezeStatus,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
    
    // Apply pending schedule if due
    const updatedSchedule = applyPendingScheduleIfDue(profile.schedule);
    if (updatedSchedule !== profile.schedule) {
      profile.schedule = updatedSchedule;
      // Update in Firestore
      await updateArenaProfileSchedule(uid, updatedSchedule);
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting arena profile:', error);
    return null;
  }
}

export async function initializeArenaProfile(
  uid: string,
  displayName: string,
  photoURL?: string
): Promise<ArenaProfile> {
  const defaultSchedule = createDefaultSchedule();
  const now = new Date().toISOString();
  
  const profileData: FirestoreArenaProfile = {
    displayName,
    photoURL,
    elo: getEloFromPoints(0),
    scheduleCurrent: defaultSchedule.current,
    scheduleNext: null,
    nextScheduleEffectiveAt: null,
    weeklyPoints: 0,
    totalWorkouts: 0,
    clanId: null,
    createdAt: now,
    updatedAt: now,
  };
  
  const docRef = doc(db, 'users', uid, 'arena', 'profile');
  await setDoc(docRef, profileData);
  
  return {
    userId: uid,
    displayName,
    photoURL,
    elo: profileData.elo,
    schedule: { current: defaultSchedule.current },
    weeklyPoints: 0,
    totalWorkouts: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export async function updateArenaProfile(
  uid: string,
  updates: Partial<FirestoreArenaProfile>
): Promise<void> {
  const docRef = doc(db, 'users', uid, 'arena', 'profile');
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

async function updateArenaProfileSchedule(uid: string, schedule: ArenaScheduleState): Promise<void> {
  const docRef = doc(db, 'users', uid, 'arena', 'profile');
  await updateDoc(docRef, {
    scheduleCurrent: schedule.current,
    scheduleNext: schedule.pending || null,
    nextScheduleEffectiveAt: schedule.pending?.effectiveAt || null,
    updatedAt: new Date().toISOString(),
  });
}

export async function updateScheduleNext(uid: string, trainingDays: number[]): Promise<void> {
  const nextMonday = new Date();
  const dayOfWeek = nextMonday.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  
  const scheduleNext: WeeklySchedule = {
    trainingDays: [...trainingDays].sort((a, b) => a - b),
    effectiveAt: nextMonday.toISOString(),
  };
  
  const docRef = doc(db, 'users', uid, 'arena', 'profile');
  await updateDoc(docRef, {
    scheduleNext,
    nextScheduleEffectiveAt: scheduleNext.effectiveAt,
    updatedAt: new Date().toISOString(),
  });
}

// ============= POSTS =============

export interface FirestorePost {
  authorId: string;
  authorName: string;
  authorUsername?: string;
  authorAvatar?: string;
  authorAvatarId?: string;
  authorElo: EloInfo;
  type: 'workout' | 'photo' | 'mixed';
  visibility: PostVisibility;
  postToClan: boolean;
  clanId?: string | null;
  text?: string;
  description?: string;
  photoURL?: string;
  media?: Array<{
    type: 'image';
    storagePath: string;
    url: string;
    width?: number;
    height?: number;
  }>;
  workoutSnapshot?: WorkoutSnapshot;
  kudosCount: number;
  commentsCount: number;
  createdAt: Timestamp;
}

function firestorePostToPost(id: string, data: FirestorePost): Post {
  return {
    id,
    author: {
      userId: data.authorId,
      displayName: data.authorName,
      username: data.authorUsername,
      photoURL: data.authorAvatar,
      avatarId: data.authorAvatarId,
      elo: data.authorElo,
    },
    type: data.type,
    visibility: data.visibility,
    postToClan: data.postToClan,
    clanId: data.clanId || undefined,
    text: data.text || data.description,
    description: data.description,
    media: data.media,
    photoURL: data.photoURL,
    workoutSnapshot: data.workoutSnapshot,
    kudosCount: data.kudosCount,
    commentsCount: data.commentsCount,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function createPost(
  uid: string,
  profile: ArenaProfile,
  workoutSnapshot: WorkoutSnapshot,
  description: string,
  visibility: PostVisibility,
  postToClan: boolean,
  clanId?: string,
  photoURL?: string
): Promise<Post> {
  // Build post data, explicitly handling undefined fields
  // Firestore doesn't allow undefined values, so we omit them or use null
  const postData: Record<string, any> = {
    authorId: uid,
    authorName: profile.displayName || 'Atleta',
    authorElo: profile.elo || getEloFromPoints(0),
    type: photoURL ? 'mixed' : 'workout',
    visibility,
    postToClan: postToClan || false,
    kudosCount: 0,
    commentsCount: 0,
    createdAt: Timestamp.now(),
  };

  // Only add optional fields if they have values (avoid undefined)
  if (profile.photoURL) {
    postData.authorAvatar = profile.photoURL;
  }
  if (profile.avatarId) {
    postData.authorAvatarId = profile.avatarId;
  }
  if (postToClan && clanId) {
    postData.clanId = clanId;
  }
  if (photoURL) {
    postData.photoURL = photoURL;
  }
  if (description && description.trim()) {
    postData.description = description.trim();
  }
  
  // Clean workoutSnapshot to remove undefined values
  if (workoutSnapshot) {
    const cleanSnapshot: Record<string, any> = {};
    for (const [key, value] of Object.entries(workoutSnapshot)) {
      if (value !== undefined) {
        // Handle nested objects/arrays
        if (Array.isArray(value)) {
          cleanSnapshot[key] = value.map(item => {
            if (typeof item === 'object' && item !== null) {
              const cleanItem: Record<string, any> = {};
              for (const [k, v] of Object.entries(item)) {
                if (v !== undefined) cleanItem[k] = v;
              }
              return cleanItem;
            }
            return item;
          });
        } else {
          cleanSnapshot[key] = value;
        }
      }
    }
    postData.workoutSnapshot = cleanSnapshot;
  }
  
  const docRef = await addDoc(postsCol(), postData);
  
  return firestorePostToPost(docRef.id, postData as FirestorePost);
}

export async function getGlobalFeed(
  limitCount: number = 20,
  cursor?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    postsCol(),
    where('visibility', '==', 'public'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  if (cursor) {
    q = query(q, startAfter(cursor));
  }
  
  const snapshot = await getDocs(q);
  const posts: Post[] = [];
  let lastDoc: DocumentSnapshot | null = null;
  
  snapshot.forEach((doc) => {
    posts.push(firestorePostToPost(doc.id, doc.data() as FirestorePost));
    lastDoc = doc;
  });
  
  return { posts, lastDoc };
}

export async function getClanFeed(
  clanId: string,
  limitCount: number = 20,
  cursor?: DocumentSnapshot
): Promise<{ posts: Post[]; lastDoc: DocumentSnapshot | null }> {
  let q = query(
    postsCol(),
    where('clanId', '==', clanId),
    where('postToClan', '==', true),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  if (cursor) {
    q = query(q, startAfter(cursor));
  }
  
  const snapshot = await getDocs(q);
  const posts: Post[] = [];
  let lastDoc: DocumentSnapshot | null = null;
  
  snapshot.forEach((doc) => {
    posts.push(firestorePostToPost(doc.id, doc.data() as FirestorePost));
    lastDoc = doc;
  });
  
  return { posts, lastDoc };
}

export async function getPostById(postId: string): Promise<Post | null> {
  const docRef = doc(db, 'posts', postId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return firestorePostToPost(docSnap.id, docSnap.data() as FirestorePost);
}

// ============= DELETE POST =============

export async function deletePost(postId: string, uid: string): Promise<boolean> {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      console.error('Post not found');
      return false;
    }
    
    const postData = postSnap.data() as FirestorePost;
    
    // Verify ownership
    if (postData.authorId !== uid) {
      console.error('User is not the author of this post');
      return false;
    }
    
    // Delete the post
    await deleteDoc(postRef);
    
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
}

// ============= KUDOS =============

export async function toggleKudos(postId: string, uid: string): Promise<boolean> {
  const reactionRef = doc(db, 'posts', postId, 'reactions', uid);
  const reactionSnap = await getDoc(reactionRef);
  
  const postRef = doc(db, 'posts', postId);
  
  if (reactionSnap.exists()) {
    // Remove kudos
    await deleteDoc(reactionRef);
    await updateDoc(postRef, { kudosCount: increment(-1) });
    return false;
  } else {
    // Add kudos
    await setDoc(reactionRef, {
      type: 'kudos',
      createdAt: serverTimestamp(),
    });
    await updateDoc(postRef, { kudosCount: increment(1) });
    return true;
  }
}

export async function hasGivenKudos(postId: string, uid: string): Promise<boolean> {
  const reactionRef = doc(db, 'posts', postId, 'reactions', uid);
  const reactionSnap = await getDoc(reactionRef);
  return reactionSnap.exists();
}

// ============= COMMENTS =============

export interface PostComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export async function addComment(
  postId: string,
  uid: string,
  authorName: string,
  authorAvatar: string | undefined,
  text: string
): Promise<PostComment> {
  const commentData = {
    authorId: uid,
    authorName,
    authorAvatar,
    text,
    createdAt: serverTimestamp(),
  };
  
  const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), commentData);
  
  // Update comment count
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, { commentsCount: increment(1) });
  
  return {
    id: commentRef.id,
    authorId: uid,
    authorName,
    authorAvatar,
    text,
    createdAt: new Date().toISOString(),
  };
}

export async function getPostComments(postId: string): Promise<PostComment[]> {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const comments: PostComment[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    comments.push({
      id: doc.id,
      authorId: data.authorId,
      authorName: data.authorName,
      authorAvatar: data.authorAvatar,
      text: data.text,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    });
  });
  
  return comments;
}

// ============= CLANS =============

export interface FirestoreClan {
  name: string;
  tag: string;
  description?: string;
  iconURL?: string;
  inviteCode: string;
  isPublic: boolean;
  ownerId: string; // GM
  memberCount: number;
  activeCount: number;
  weeklyPoints: number;
  monthlyPoints: number;
  presenceRate: number;
  clanElo?: EloInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

function firestoreClanToClan(id: string, data: FirestoreClan): Clan {
  return {
    id,
    name: data.name,
    tag: data.tag,
    description: data.description,
    iconURL: data.iconURL,
    inviteCode: data.inviteCode,
    isPublic: data.isPublic,
    clanElo: data.clanElo,
    membersCount: data.memberCount,
    weeklyPoints: data.weeklyPoints,
    monthlyPoints: data.monthlyPoints,
    presenceRate: data.presenceRate,
    gmUserId: data.ownerId,
    createdAt: data.createdAt.toDate().toISOString(),
    updatedAt: data.updatedAt.toDate().toISOString(),
  };
}

export async function createClan(
  uid: string,
  profile: ArenaProfile,
  name: string,
  tag: string,
  description?: string
): Promise<Clan> {
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const clanData: FirestoreClan = {
    name,
    tag: tag.toUpperCase(),
    description,
    inviteCode,
    isPublic: true,
    ownerId: uid,
    memberCount: 1,
    activeCount: 1,
    weeklyPoints: 0,
    monthlyPoints: 0,
    presenceRate: 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };
  
  // Create clan document
  const clanRef = await addDoc(clansCol(), clanData);
  const clanId = clanRef.id;
  
  // Create GM member document
  await setDoc(doc(db, 'clans', clanId, 'members', uid), {
    role: 'gm',
    status: 'active',
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    elo: profile.elo,
    weeklyPoints: profile.weeklyPoints,
    joinedAt: serverTimestamp(),
    scheduleCurrentDays: profile.schedule.current.trainingDays,
    lastWorkoutAt: null,
    freezeUntil: null,
  });
  
  // Create invite document
  await setDoc(doc(db, 'invites', inviteCode), {
    clanId,
    createdAt: serverTimestamp(),
    active: true,
  });
  
  // Update user's clanId
  await updateArenaProfile(uid, { clanId });
  
  return firestoreClanToClan(clanId, clanData);
}

export async function getClanById(clanId: string): Promise<Clan | null> {
  const docRef = doc(db, 'clans', clanId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return firestoreClanToClan(docSnap.id, docSnap.data() as FirestoreClan);
}

export async function getClanByInviteCode(inviteCode: string): Promise<Clan | null> {
  const inviteRef = doc(db, 'invites', inviteCode.toUpperCase());
  const inviteSnap = await getDoc(inviteRef);
  
  if (!inviteSnap.exists() || !inviteSnap.data().active) {
    return null;
  }
  
  const clanId = inviteSnap.data().clanId;
  return getClanById(clanId);
}

export async function joinClanByCode(
  uid: string,
  profile: ArenaProfile,
  inviteCode: string
): Promise<Clan | null> {
  const clan = await getClanByInviteCode(inviteCode);
  
  if (!clan) {
    return null;
  }
  
  // Check if user is already a member
  const memberRef = doc(db, 'clans', clan.id, 'members', uid);
  const memberSnap = await getDoc(memberRef);
  
  if (memberSnap.exists()) {
    return clan; // Already a member
  }
  
  // Add member
  await setDoc(memberRef, {
    role: 'member',
    status: 'active',
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    elo: profile.elo,
    weeklyPoints: profile.weeklyPoints,
    joinedAt: serverTimestamp(),
    scheduleCurrentDays: profile.schedule.current.trainingDays,
    lastWorkoutAt: null,
    freezeUntil: null,
  });
  
  // Update clan member count
  const clanRef = doc(db, 'clans', clan.id);
  await updateDoc(clanRef, {
    memberCount: increment(1),
    activeCount: increment(1),
    updatedAt: serverTimestamp(),
  });
  
  // Update user's clanId
  await updateArenaProfile(uid, { clanId: clan.id });
  
  return { ...clan, membersCount: clan.membersCount + 1 };
}

export async function leaveClan(uid: string, clanId: string): Promise<void> {
  const memberRef = doc(db, 'clans', clanId, 'members', uid);
  await deleteDoc(memberRef);
  
  // Update clan member count
  const clanRef = doc(db, 'clans', clanId);
  await updateDoc(clanRef, {
    memberCount: increment(-1),
    activeCount: increment(-1),
    updatedAt: serverTimestamp(),
  });
  
  // Remove clanId from user profile
  await updateArenaProfile(uid, { clanId: null });
}

export async function getClanMembers(clanId: string): Promise<ClanMember[]> {
  const membersRef = collection(db, 'clans', clanId, 'members');
  const snapshot = await getDocs(membersRef);
  
  const members: ClanMember[] = [];
  
  snapshot.forEach((doc) => {
    const data = doc.data();
    members.push({
      userId: doc.id,
      displayName: data.displayName,
      photoURL: data.photoURL,
      role: data.role,
      status: data.status,
      elo: data.elo,
      weeklyPoints: data.weeklyPoints || 0,
      joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      schedule: data.scheduleCurrentDays ? { trainingDays: data.scheduleCurrentDays, effectiveAt: '' } : undefined,
      freezeUntil: data.freezeUntil,
    });
  });
  
  return members;
}

export async function updateMemberRole(
  clanId: string,
  targetUid: string,
  newRole: 'officer' | 'member'
): Promise<void> {
  const memberRef = doc(db, 'clans', clanId, 'members', targetUid);
  await updateDoc(memberRef, { role: newRole });
}

export async function removeMember(clanId: string, targetUid: string): Promise<void> {
  await leaveClan(targetUid, clanId);
}

export async function getMyClan(uid: string): Promise<Clan | null> {
  const profile = await getArenaProfile(uid);
  if (!profile?.clanId) {
    return null;
  }
  return getClanById(profile.clanId);
}

// ============= FREEZE REQUESTS =============

export interface FirestoreFreezeRequest {
  userId: string;
  displayName: string;
  reason: string;
  freezeFrom: string;
  freezeUntil: string;
  status: 'pending' | 'approved' | 'denied';
  decidedBy?: string;
  decidedAt?: Timestamp;
  createdAt: Timestamp;
}

function firestoreFreezeToRequest(id: string, clanId: string, data: FirestoreFreezeRequest): FreezeRequest {
  return {
    id,
    userId: data.userId,
    clanId,
    displayName: data.displayName,
    reason: data.reason,
    freezeFrom: data.freezeFrom,
    freezeUntil: data.freezeUntil,
    status: data.status,
    reviewedBy: data.decidedBy,
    reviewedAt: data.decidedAt?.toDate?.()?.toISOString(),
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

export async function requestFreeze(
  uid: string,
  clanId: string,
  displayName: string,
  reason: string,
  freezeFrom: string,
  freezeUntil: string
): Promise<FreezeRequest> {
  const requestData: FirestoreFreezeRequest = {
    userId: uid,
    displayName,
    reason,
    freezeFrom,
    freezeUntil,
    status: 'pending',
    createdAt: Timestamp.now(),
  };
  
  const requestRef = await addDoc(collection(db, 'clans', clanId, 'freezeRequests'), requestData);
  
  return firestoreFreezeToRequest(requestRef.id, clanId, requestData);
}

export async function getPendingFreezeRequests(clanId: string): Promise<FreezeRequest[]> {
  const q = query(
    collection(db, 'clans', clanId, 'freezeRequests'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  const requests: FreezeRequest[] = [];
  
  snapshot.forEach((doc) => {
    requests.push(firestoreFreezeToRequest(doc.id, clanId, doc.data() as FirestoreFreezeRequest));
  });
  
  return requests;
}

export async function reviewFreezeRequest(
  clanId: string,
  requestId: string,
  approved: boolean,
  decidedBy: string
): Promise<void> {
  const requestRef = doc(db, 'clans', clanId, 'freezeRequests', requestId);
  const requestSnap = await getDoc(requestRef);
  
  if (!requestSnap.exists()) {
    throw new Error('Freeze request not found');
  }
  
  const requestData = requestSnap.data() as FirestoreFreezeRequest;
  
  await updateDoc(requestRef, {
    status: approved ? 'approved' : 'denied',
    decidedBy,
    decidedAt: serverTimestamp(),
  });
  
  if (approved) {
    // Update member status
    const memberRef = doc(db, 'clans', clanId, 'members', requestData.userId);
    await updateDoc(memberRef, {
      status: 'frozen',
      freezeUntil: requestData.freezeUntil,
    });
    
    // Update clan active count
    const clanRef = doc(db, 'clans', clanId);
    await updateDoc(clanRef, {
      activeCount: increment(-1),
      updatedAt: serverTimestamp(),
    });
    
    // Send notification
    await sendNotification(requestData.userId, {
      type: 'freeze_approved',
      title: 'Freeze aprovado',
      message: `Seu pedido de freeze foi aprovado até ${new Date(requestData.freezeUntil).toLocaleDateString('pt-BR')}`,
    });
  } else {
    await sendNotification(requestData.userId, {
      type: 'freeze_denied',
      title: 'Freeze negado',
      message: 'Seu pedido de freeze foi negado pelo clã.',
    });
  }
}

// ============= NOTIFICATIONS =============

export interface FirestoreNotification {
  type: InAppNotification['type'];
  title: string;
  message: string;
  fromUserId?: string;
  fromDisplayName?: string;
  relatedId?: string;
  clanId?: string;
  postId?: string;
  read: boolean;
  createdAt: Timestamp;
  readAt?: Timestamp;
}

function firestoreNotifToNotif(id: string, uid: string, data: FirestoreNotification): InAppNotification {
  return {
    id,
    userId: uid,
    type: data.type,
    title: data.title,
    message: data.message,
    fromUserId: data.fromUserId,
    fromDisplayName: data.fromDisplayName,
    relatedId: data.relatedId,
    read: data.read,
    createdAt: data.createdAt.toDate().toISOString(),
  };
}

interface NotificationData {
  type: InAppNotification['type'];
  title: string;
  message: string;
  fromUserId?: string;
  fromDisplayName?: string;
  relatedId?: string;
  clanId?: string;
  postId?: string;
}

export async function sendNotification(toUid: string, data: NotificationData): Promise<void> {
  const notifData: FirestoreNotification = {
    type: data.type,
    title: data.title,
    message: data.message,
    fromUserId: data.fromUserId,
    fromDisplayName: data.fromDisplayName,
    relatedId: data.relatedId,
    clanId: data.clanId,
    postId: data.postId,
    read: false,
    createdAt: Timestamp.now(),
  };
  
  await addDoc(collection(db, 'notifications', toUid, 'items'), notifData);
}

export async function getNotifications(uid: string): Promise<InAppNotification[]> {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  const notifications: InAppNotification[] = [];
  
  snapshot.forEach((doc) => {
    notifications.push(firestoreNotifToNotif(doc.id, uid, doc.data() as FirestoreNotification));
  });
  
  return notifications;
}

export async function getUnreadNotificationsCount(uid: string): Promise<number> {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.size;
}

export async function markNotificationRead(uid: string, notificationId: string): Promise<void> {
  const notifRef = doc(db, 'notifications', uid, 'items', notificationId);
  await updateDoc(notifRef, {
    read: true,
    readAt: serverTimestamp(),
  });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    where('read', '==', false)
  );
  
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  
  snapshot.forEach((doc) => {
    batch.update(doc.ref, { read: true, readAt: serverTimestamp() });
  });
  
  await batch.commit();
}

// ============= MOTIVATION =============

export const MOTIVATION_MESSAGES = [
  'Bora treinar! 💪 Você consegue!',
  'Falta pouco! O treino te espera! 🔥',
  'Não desiste! A vitória está próxima! 🏆',
];

export async function sendMotivation(
  fromUid: string,
  fromDisplayName: string,
  toUid: string,
  toDisplayName: string,
  messageIndex: number,
  clanId?: string
): Promise<void> {
  const message = MOTIVATION_MESSAGES[messageIndex] || MOTIVATION_MESSAGES[0];
  
  await sendNotification(toUid, {
    type: 'motivation',
    title: 'Motivação!',
    message: `${fromDisplayName}: "${message}"`,
    fromUserId: fromUid,
    fromDisplayName,
    clanId,
  });
}

// ============= WORKOUT COMPLETION =============

export async function onWorkoutCompleted(
  uid: string,
  workoutSnapshot: WorkoutSnapshot
): Promise<void> {
  const profile = await getArenaProfile(uid);
  if (!profile) return;
  
  const todayIndex = getSaoPauloDayIndex();
  const schedule = profile.schedule.current;
  const isScheduledDay = schedule.trainingDays.includes(todayIndex);
  
  // Calculate points earned
  const pointsEarned = calculateWorkoutPoints(schedule, isScheduledDay);
  
  // Update profile
  const newElo = getEloFromPoints(profile.elo.totalPoints + pointsEarned);
  
  await updateArenaProfile(uid, {
    weeklyPoints: profile.weeklyPoints + pointsEarned,
    totalWorkouts: profile.totalWorkouts + 1,
    elo: newElo,
  });
  
  // Record workout for today (for presence tracking)
  const today = new Date().toISOString().split('T')[0];
  const workoutLogRef = doc(db, 'users', uid, 'workoutLogs', today);
  await setDoc(workoutLogRef, {
    completedAt: serverTimestamp(),
    workoutId: workoutSnapshot.workoutId,
    isScheduledDay,
  });
  
  // If in a clan, update member and clan stats
  if (profile.clanId) {
    const memberRef = doc(db, 'clans', profile.clanId, 'members', uid);
    await updateDoc(memberRef, {
      weeklyPoints: increment(pointsEarned),
      elo: newElo,
      lastWorkoutAt: serverTimestamp(),
    });
    
    // Recalculate clan stats (could be done via Cloud Function in production)
    const members = await getClanMembers(profile.clanId);
    const activeMembers = members.filter(m => m.status === 'active');
    const clanElo = calculateMedianElo(activeMembers);
    const totalWeeklyPoints = activeMembers.reduce((sum, m) => sum + m.weeklyPoints, 0);
    
    const clanRef = doc(db, 'clans', profile.clanId);
    await updateDoc(clanRef, {
      clanElo,
      weeklyPoints: totalWeeklyPoints,
      updatedAt: serverTimestamp(),
    });
  }
}

export async function hasMemberTrainedToday(uid: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const workoutLogRef = doc(db, 'users', uid, 'workoutLogs', today);
  const logSnap = await getDoc(workoutLogRef);
  return logSnap.exists();
}

// ============= REAL-TIME LISTENERS =============

export function subscribeToNotifications(
  uid: string,
  callback: (notifications: InAppNotification[]) => void
): Unsubscribe {
  const q = query(
    collection(db, 'notifications', uid, 'items'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications: InAppNotification[] = [];
    snapshot.forEach((doc) => {
      notifications.push(firestoreNotifToNotif(doc.id, uid, doc.data() as FirestoreNotification));
    });
    callback(notifications);
  });
}

export function subscribeToClanMembers(
  clanId: string,
  callback: (members: ClanMember[]) => void
): Unsubscribe {
  const membersRef = collection(db, 'clans', clanId, 'members');
  
  return onSnapshot(membersRef, (snapshot) => {
    const members: ClanMember[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      members.push({
        userId: doc.id,
        displayName: data.displayName,
        photoURL: data.photoURL,
        role: data.role,
        status: data.status,
        elo: data.elo,
        weeklyPoints: data.weeklyPoints || 0,
        joinedAt: data.joinedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        schedule: data.scheduleCurrentDays ? { trainingDays: data.scheduleCurrentDays, effectiveAt: '' } : undefined,
        freezeUntil: data.freezeUntil,
      });
    });
    callback(members);
  });
}

// ============= RANKINGS =============

export async function getWeeklyRankings(): Promise<ClanRankingEntry[]> {
  const q = query(
    clansCol(),
    orderBy('weeklyPoints', 'desc'),
    limit(20)
  );
  
  const snapshot = await getDocs(q);
  const rankings: ClanRankingEntry[] = [];
  let rank = 1;
  
  snapshot.forEach((doc) => {
    const data = doc.data() as FirestoreClan;
    rankings.push({
      clanId: doc.id,
      clanName: data.name,
      clanTag: data.tag,
      iconURL: data.iconURL,
      clanElo: data.clanElo,
      membersCount: data.memberCount,
      activeMembers: data.activeCount,
      weeklyPoints: data.weeklyPoints,
      monthlyPoints: data.monthlyPoints,
      presenceRate: data.presenceRate,
      rank: rank++,
    });
  });
  
  return rankings;
}

export async function getMonthlyRankings(): Promise<ClanRankingEntry[]> {
  const q = query(
    clansCol(),
    orderBy('monthlyPoints', 'desc'),
    limit(20)
  );
  
  const snapshot = await getDocs(q);
  const rankings: ClanRankingEntry[] = [];
  let rank = 1;
  
  snapshot.forEach((doc) => {
    const data = doc.data() as FirestoreClan;
    rankings.push({
      clanId: doc.id,
      clanName: data.name,
      clanTag: data.tag,
      iconURL: data.iconURL,
      clanElo: data.clanElo,
      membersCount: data.memberCount,
      activeMembers: data.activeCount,
      weeklyPoints: data.weeklyPoints,
      monthlyPoints: data.monthlyPoints,
      presenceRate: data.presenceRate,
      rank: rank++,
    });
  });
  
  return rankings;
}

// ============= MIGRATION FROM LOCAL STORAGE =============

import { load } from '../localStore';
import { ArenaState, ARENA_STATE_KEY, ARENA_STATE_VERSION } from './types';

export async function migrateLocalStorageToFirestore(uid: string): Promise<boolean> {
  try {
    // Check if already migrated
    const profile = await getArenaProfile(uid);
    if (profile) {
      // Already has Firestore data, skip migration
      return true;
    }
    
    // Load from localStorage
    const localState = load<ArenaState | null>(ARENA_STATE_KEY, null);
    
    if (!localState || !localState.profile) {
      // No local data to migrate
      return false;
    }
    
    // Migrate profile
    const localProfile = localState.profile;
    await initializeArenaProfile(uid, localProfile.displayName, localProfile.photoURL);
    await updateArenaProfile(uid, {
      elo: localProfile.elo,
      scheduleCurrent: localProfile.schedule.current,
      scheduleNext: localProfile.schedule.pending || null,
      weeklyPoints: localProfile.weeklyPoints,
      totalWorkouts: localProfile.totalWorkouts,
      freezeStatus: localProfile.freezeStatus,
      migratedAt: new Date().toISOString(),
    });
    
    // Migrate clan if exists
    if (localState.myClan) {
      const clan = localState.myClan;
      const createdClan = await createClan(uid, localProfile as ArenaProfile, clan.name, clan.tag, clan.description);
      
      // Note: We can't migrate other members as they're local-only data
    }
    
    // Migrate posts (author's own posts only)
    for (const post of localState.posts) {
      if (post.author.userId === uid && post.workoutSnapshot) {
        await createPost(
          uid,
          localProfile as ArenaProfile,
          post.workoutSnapshot,
          post.description || '',
          post.visibility,
          post.postToClan,
          localState.myClan?.id,
          post.photoURL
        );
      }
    }
    
    console.log('Arena data migrated to Firestore successfully');
    return true;
  } catch (error) {
    console.error('Error migrating arena data to Firestore:', error);
    return false;
  }
}
