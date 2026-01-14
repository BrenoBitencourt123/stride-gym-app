// src/lib/arena/arenaStorage.ts
// Arena state persistence layer (localStorage)

import { load, save, emitChange } from '../localStore';
import {
  ArenaState,
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
  DailyMemberStatus,
  ARENA_STATE_KEY,
  ARENA_STATE_VERSION,
} from './types';
import { getEloFromPoints, calculateMedianElo } from './eloUtils';
import { 
  createDefaultSchedule, 
  calculateWorkoutPoints,
  getSaoPauloDayIndex,
  applyPendingScheduleIfDue,
  getMemberDailyStatus
} from './scheduleUtils';

// Re-export types for components
export type { 
  WorkoutSnapshot, 
  ClanMember,
  DailyMemberStatus,
  Post,
  ClanRankingEntry,
} from './types';

// Type aliases for backwards compatibility
export type ArenaPost = Post;
export type ClanRanking = ClanRankingEntry;

// Alias functions
export const getGlobalFeed = () => getFeedPosts('global');
export const getClanFeed = (clanId: string) => getFeedPosts('clan');
export const getUserClan = getMyClan;
export const getPostKudos = (postId: string) => {
  const post = getPostById(postId);
  return post ? Array(post.kudosCount).fill({ type: 'kudos' }) : [];
};
export const hasUserKudos = hasGivenKudos;
export const getClanRanking = (period: 'weekly' | 'monthly') => 
  period === 'weekly' ? getWeeklyRankings() : getMonthlyRankings();

// ============= DEFAULT STATE =============

const DEFAULT_ARENA_STATE: ArenaState = {
  version: ARENA_STATE_VERSION,
  posts: [],
  myReactions: {},
  clanMembers: [],
  freezeRequests: [],
  joinRequests: [],
  notifications: [],
  weeklyRanking: [],
  monthlyRanking: [],
  updatedAt: Date.now(),
};

// ============= STATE ACCESS =============

export function getArenaState(): ArenaState {
  const stored = load<ArenaState | null>(ARENA_STATE_KEY, null);
  
  if (stored && stored.version === ARENA_STATE_VERSION) {
    // Apply pending schedules if due
    if (stored.profile?.schedule) {
      const updatedSchedule = applyPendingScheduleIfDue(stored.profile.schedule);
      if (updatedSchedule !== stored.profile.schedule) {
        stored.profile.schedule = updatedSchedule;
        saveArenaState(stored);
      }
    }
    return stored;
  }
  
  return { ...DEFAULT_ARENA_STATE };
}

export function saveArenaState(state: ArenaState): void {
  state.updatedAt = Date.now();
  save(ARENA_STATE_KEY, state);
  emitChange();
}

function updateArenaState(updater: (state: ArenaState) => void): ArenaState {
  const state = getArenaState();
  updater(state);
  saveArenaState(state);
  return state;
}

// ============= PROFILE =============

export function getArenaProfile(): ArenaProfile | undefined {
  return getArenaState().profile;
}

export function initializeArenaProfile(userId: string, displayName: string, photoURL?: string): ArenaProfile {
  const profile: ArenaProfile = {
    userId,
    displayName,
    photoURL,
    elo: getEloFromPoints(0),
    schedule: createDefaultSchedule(),
    weeklyPoints: 0,
    totalWorkouts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  updateArenaState(state => {
    state.profile = profile;
  });
  
  return profile;
}

export function updateArenaProfile(updates: Partial<ArenaProfile>): ArenaProfile | undefined {
  let updatedProfile: ArenaProfile | undefined;
  
  updateArenaState(state => {
    if (state.profile) {
      state.profile = {
        ...state.profile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      updatedProfile = state.profile;
    }
  });
  
  return updatedProfile;
}

export function updateSchedule(trainingDays: number[]): void {
  updateArenaState(state => {
    if (state.profile) {
      const nextMonday = new Date();
      const dayOfWeek = nextMonday.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      
      state.profile.schedule = {
        current: state.profile.schedule.current,
        pending: {
          trainingDays: [...trainingDays].sort((a, b) => a - b),
          effectiveAt: nextMonday.toISOString(),
        },
      };
      state.profile.updatedAt = new Date().toISOString();
    }
  });
}

// ============= POSTS =============

export function getFeedPosts(filter: 'global' | 'clan' = 'global'): Post[] {
  const state = getArenaState();
  
  if (filter === 'clan' && state.myClan) {
    return state.posts
      .filter(p => p.clanId === state.myClan?.id && p.postToClan)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  
  return state.posts
    .filter(p => p.visibility === 'public')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getPostById(postId: string): Post | undefined {
  return getArenaState().posts.find(p => p.id === postId);
}

export function createPost(
  workoutSnapshot: WorkoutSnapshot,
  description: string,
  visibility: PostVisibility,
  postToClan: boolean,
  photoURL?: string
): Post {
  const state = getArenaState();
  const profile = state.profile;
  
  if (!profile) {
    throw new Error('Arena profile not initialized');
  }
  
  const author: PostAuthor = {
    userId: profile.userId,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    elo: profile.elo,
  };
  
  const post: Post = {
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    author,
    type: 'workout',
    visibility,
    postToClan,
    clanId: postToClan ? state.myClan?.id : undefined,
    photoURL,
    description,
    workoutSnapshot,
    kudosCount: 0,
    commentsCount: 0,
    createdAt: new Date().toISOString(),
  };
  
  updateArenaState(s => {
    s.posts.unshift(post);
    // Keep max 100 posts
    if (s.posts.length > 100) {
      s.posts = s.posts.slice(0, 100);
    }
  });
  
  return post;
}

export function toggleKudos(postId: string): void {
  updateArenaState(state => {
    const post = state.posts.find(p => p.id === postId);
    if (!post) return;
    
    if (state.myReactions[postId]) {
      delete state.myReactions[postId];
      post.kudosCount = Math.max(0, post.kudosCount - 1);
    } else {
      state.myReactions[postId] = 'kudos';
      post.kudosCount += 1;
    }
  });
}

export function hasGivenKudos(postId: string): boolean {
  return !!getArenaState().myReactions[postId];
}

// ============= CLANS =============

export function getMyClan(): Clan | undefined {
  return getArenaState().myClan;
}

export function getClanMembers(): ClanMember[] {
  return getArenaState().clanMembers;
}

export function createClan(name: string, tag: string, description?: string): Clan {
  const state = getArenaState();
  const profile = state.profile;
  
  if (!profile) {
    throw new Error('Arena profile not initialized');
  }
  
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const clan: Clan = {
    id: `clan_${Date.now()}`,
    name,
    tag: tag.toUpperCase(),
    description,
    inviteCode,
    isPublic: true,
    membersCount: 1,
    weeklyPoints: 0,
    monthlyPoints: 0,
    presenceRate: 0,
    gmUserId: profile.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  const gmMember: ClanMember = {
    userId: profile.userId,
    displayName: profile.displayName,
    photoURL: profile.photoURL,
    role: 'gm',
    status: 'active',
    elo: profile.elo,
    weeklyPoints: profile.weeklyPoints,
    joinedAt: new Date().toISOString(),
    schedule: profile.schedule.current,
  };
  
  updateArenaState(s => {
    s.myClan = clan;
    s.clanMembers = [gmMember];
    if (s.profile) {
      s.profile.clanId = clan.id;
    }
  });
  
  return clan;
}

export function joinClanByCode(inviteCode: string): boolean {
  // In MVP, simulate finding a clan by code
  // In production, this would query Firestore
  const state = getArenaState();
  const profile = state.profile;
  
  if (!profile || state.myClan) {
    return false; // Already in a clan or no profile
  }
  
  // For demo: create a mock clan if code is valid format
  if (inviteCode.length >= 4) {
    const clan: Clan = {
      id: `clan_joined_${Date.now()}`,
      name: 'Clã Demo',
      tag: 'DEMO',
      inviteCode: inviteCode.toUpperCase(),
      isPublic: true,
      membersCount: 2,
      weeklyPoints: 0,
      monthlyPoints: 0,
      presenceRate: 0,
      gmUserId: 'demo_gm',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const member: ClanMember = {
      userId: profile.userId,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      role: 'member',
      status: 'active',
      elo: profile.elo,
      weeklyPoints: profile.weeklyPoints,
      joinedAt: new Date().toISOString(),
      schedule: profile.schedule.current,
    };
    
    updateArenaState(s => {
      s.myClan = clan;
      s.clanMembers = [member];
      if (s.profile) {
        s.profile.clanId = clan.id;
      }
    });
    
    return true;
  }
  
  return false;
}

export function leaveClan(): void {
  updateArenaState(state => {
    state.myClan = undefined;
    state.clanMembers = [];
    state.freezeRequests = [];
    state.joinRequests = [];
    if (state.profile) {
      state.profile.clanId = undefined;
    }
  });
}

// ============= FREEZE REQUESTS =============

export function requestFreeze(reason: string, freezeFrom: string, freezeUntil: string): FreezeRequest {
  const state = getArenaState();
  const profile = state.profile;
  
  if (!profile || !state.myClan) {
    throw new Error('Must be in a clan to request freeze');
  }
  
  const request: FreezeRequest = {
    id: `freeze_${Date.now()}`,
    userId: profile.userId,
    clanId: state.myClan.id,
    displayName: profile.displayName,
    reason,
    freezeFrom,
    freezeUntil,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  
  updateArenaState(s => {
    s.freezeRequests.push(request);
  });
  
  return request;
}

export function reviewFreezeRequest(requestId: string, approved: boolean, reviewerId: string): void {
  updateArenaState(state => {
    const request = state.freezeRequests.find(r => r.id === requestId);
    if (!request) return;
    
    request.status = approved ? 'approved' : 'denied';
    request.reviewedBy = reviewerId;
    request.reviewedAt = new Date().toISOString();
    
    if (approved) {
      // Update member status
      const member = state.clanMembers.find(m => m.userId === request.userId);
      if (member) {
        member.status = 'frozen';
        member.freezeUntil = request.freezeUntil;
      }
      
      // Update profile if it's the current user
      if (state.profile && state.profile.userId === request.userId) {
        state.profile.freezeStatus = {
          frozen: true,
          freezeUntil: request.freezeUntil,
          frozenDaysLast30: (state.profile.freezeStatus?.frozenDaysLast30 || 0) + 
            Math.ceil((new Date(request.freezeUntil).getTime() - new Date(request.freezeFrom).getTime()) / (1000 * 60 * 60 * 24)),
        };
      }
      
      // Send notification
      addNotification(request.userId, {
        type: 'freeze_approved',
        title: 'Freeze aprovado',
        message: `Seu pedido de freeze foi aprovado até ${new Date(request.freezeUntil).toLocaleDateString('pt-BR')}`,
      });
    } else {
      addNotification(request.userId, {
        type: 'freeze_denied',
        title: 'Freeze negado',
        message: 'Seu pedido de freeze foi negado pelo clã.',
      });
    }
  });
}

export function getPendingFreezeRequests(): FreezeRequest[] {
  return getArenaState().freezeRequests.filter(r => r.status === 'pending');
}

// ============= NOTIFICATIONS =============

export function getNotifications(): InAppNotification[] {
  return getArenaState().notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getUnreadNotificationsCount(): number {
  return getArenaState().notifications.filter(n => !n.read).length;
}

interface NotificationData {
  type: InAppNotification['type'];
  title: string;
  message: string;
  fromUserId?: string;
  fromDisplayName?: string;
  relatedId?: string;
}

export function addNotification(toUserId: string, data: NotificationData): void {
  const notification: InAppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    userId: toUserId,
    type: data.type,
    title: data.title,
    message: data.message,
    fromUserId: data.fromUserId,
    fromDisplayName: data.fromDisplayName,
    relatedId: data.relatedId,
    read: false,
    createdAt: new Date().toISOString(),
  };
  
  updateArenaState(state => {
    state.notifications.unshift(notification);
    // Keep max 50 notifications
    if (state.notifications.length > 50) {
      state.notifications = state.notifications.slice(0, 50);
    }
  });
}

export function markNotificationRead(notificationId: string): void {
  updateArenaState(state => {
    const notif = state.notifications.find(n => n.id === notificationId);
    if (notif) {
      notif.read = true;
    }
  });
}

export function markAllNotificationsRead(): void {
  updateArenaState(state => {
    state.notifications.forEach(n => { n.read = true; });
  });
}

// ============= MOTIVATION =============

export const MOTIVATION_MESSAGES = [
  'Bora treinar! 💪 Você consegue!',
  'Falta pouco! O treino te espera! 🔥',
  'Não desiste! A vitória está próxima! 🏆',
];

export function sendMotivation(toUserId: string, toDisplayName: string, messageIndex: number): void {
  const state = getArenaState();
  const fromProfile = state.profile;
  
  if (!fromProfile) return;
  
  const message = MOTIVATION_MESSAGES[messageIndex] || MOTIVATION_MESSAGES[0];
  
  addNotification(toUserId, {
    type: 'motivation',
    title: 'Motivação!',
    message: `${fromProfile.displayName}: "${message}"`,
    fromUserId: fromProfile.userId,
    fromDisplayName: fromProfile.displayName,
  });
}

// ============= WORKOUT COMPLETION INTEGRATION =============

export function onWorkoutCompleted(workoutSnapshot: WorkoutSnapshot): void {
  updateArenaState(state => {
    if (!state.profile) return;
    
    const todayIndex = getSaoPauloDayIndex();
    const schedule = state.profile.schedule.current;
    const isScheduledDay = schedule.trainingDays.includes(todayIndex);
    
    // Calculate points earned
    const pointsEarned = calculateWorkoutPoints(schedule, isScheduledDay);
    
    // Update profile
    state.profile.weeklyPoints += pointsEarned;
    state.profile.totalWorkouts += 1;
    state.profile.elo = getEloFromPoints(
      state.profile.elo.totalPoints + pointsEarned
    );
    state.profile.updatedAt = new Date().toISOString();
    
    // Update clan member if in clan
    if (state.myClan) {
      const member = state.clanMembers.find(m => m.userId === state.profile?.userId);
      if (member) {
        member.weeklyPoints += pointsEarned;
        member.elo = state.profile.elo;
      }
      
      // Recalculate clan elo
      const clanElo = calculateMedianElo(state.clanMembers);
      state.myClan.clanElo = clanElo;
      state.myClan.weeklyPoints = state.clanMembers
        .filter(m => m.status === 'active')
        .reduce((sum, m) => sum + m.weeklyPoints, 0);
    }
  });
}

// ============= RANKINGS =============

export function getWeeklyRankings(): ClanRankingEntry[] {
  // In MVP, return mock data or computed from local state
  const state = getArenaState();
  
  if (state.myClan) {
    const entry: ClanRankingEntry = {
      clanId: state.myClan.id,
      clanName: state.myClan.name,
      clanTag: state.myClan.tag,
      iconURL: state.myClan.iconURL,
      clanElo: state.myClan.clanElo,
      membersCount: state.myClan.membersCount,
      activeMembers: state.clanMembers.filter(m => m.status === 'active').length,
      weeklyPoints: state.myClan.weeklyPoints,
      monthlyPoints: state.myClan.monthlyPoints,
      presenceRate: state.myClan.presenceRate,
      rank: 1,
    };
    return [entry];
  }
  
  return state.weeklyRanking;
}

export function getMonthlyRankings(): ClanRankingEntry[] {
  const state = getArenaState();
  return state.monthlyRanking;
}

// ============= HELPER: Get today's workout log for member =============

const WORKOUT_LOGS_TODAY_KEY = 'levelup.arena.workoutLogsToday';

interface TodayWorkoutLog {
  dateKey: string;
  userIds: string[];
}

export function markMemberTrainedToday(userId: string): void {
  const today = new Date().toISOString().split('T')[0];
  let log = load<TodayWorkoutLog | null>(WORKOUT_LOGS_TODAY_KEY, null);
  
  if (!log || log.dateKey !== today) {
    log = { dateKey: today, userIds: [] };
  }
  
  if (!log.userIds.includes(userId)) {
    log.userIds.push(userId);
    save(WORKOUT_LOGS_TODAY_KEY, log);
  }
}

export function hasMemberTrainedToday(userId: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const log = load<TodayWorkoutLog | null>(WORKOUT_LOGS_TODAY_KEY, null);
  
  if (!log || log.dateKey !== today) {
    return false;
  }
  
  return log.userIds.includes(userId);
}
