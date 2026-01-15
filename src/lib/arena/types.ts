// src/lib/arena/types.ts
// Arena Module Types - Social Feed, Clans, Elo System

// ============= ELO & RANKING =============

export type EloTier = 
  | 'iron'
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'emerald'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'challenger';

export interface EloInfo {
  tier: EloTier;
  division: number; // 1-4, where 1 is highest within tier
  points: number; // Current arena points (0-100 per division)
  totalPoints: number; // Overall lifetime points for display
}

export const ELO_TIERS: EloTier[] = [
  'iron', 'bronze', 'silver', 'gold', 'platinum', 
  'emerald', 'diamond', 'master', 'grandmaster', 'challenger'
];

export const ELO_TIER_NAMES: Record<EloTier, string> = {
  iron: 'Ferro',
  bronze: 'Bronze',
  silver: 'Prata',
  gold: 'Ouro',
  platinum: 'Platina',
  emerald: 'Esmeralda',
  diamond: 'Diamante',
  master: 'Mestre',
  grandmaster: 'Grão-Mestre',
  challenger: 'Challenger',
};

// ============= WEEKLY SCHEDULE =============

export interface WeeklySchedule {
  // Days marked for training (0 = Monday, 6 = Sunday)
  trainingDays: number[];
  effectiveAt: string; // ISO timestamp when this schedule becomes active
}

export interface ArenaScheduleState {
  current: WeeklySchedule;
  pending?: WeeklySchedule; // Changes take effect next Monday
}

// ============= ARENA PROFILE =============

export interface ArenaProfile {
  userId: string;
  displayName: string;
  photoURL?: string;
  avatarId?: string;
  elo: EloInfo;
  schedule: ArenaScheduleState;
  weeklyPoints: number; // Points earned this week
  totalWorkouts: number;
  clanId?: string;
  freezeStatus?: {
    frozen: boolean;
    freezeUntil?: string;
    frozenDaysLast30: number;
  };
  createdAt: string;
  updatedAt: string;
}

// ============= POSTS =============

export type PostVisibility = 'public' | 'clan' | 'followers';
export type PostType = 'workout' | 'photo' | 'mixed';

// Media attachment for posts
export interface PostMedia {
  type: 'image';
  storagePath: string;
  url: string;
  width?: number;
  height?: number;
}

export interface WorkoutSetSnapshot {
  kg: number;
  reps: number;
  rir?: number;
  type?: 'warmup' | 'feeder' | 'work' | 'backoff';
}

export interface WorkoutExerciseSnapshot {
  exerciseId: string;
  exerciseName: string;
  muscleGroup?: string;
  sets: WorkoutSetSnapshot[];
}

export interface WorkoutSnapshot {
  workoutId: string;
  workoutTitle: string;
  duration: number; // seconds
  totalSets: number;
  totalReps: number;
  totalVolume: number; // kg
  prsCount: number;
  avgRir?: number;
  exercises: WorkoutExerciseSnapshot[];
}

export interface PostAuthor {
  userId: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  avatarId?: string;
  elo: EloInfo;
}

export interface Post {
  id: string;
  author: PostAuthor;
  type: PostType;
  visibility: PostVisibility;
  postToClan: boolean;
  clanId?: string;
  text?: string; // caption
  description?: string; // legacy, same as text
  media?: PostMedia[];
  photoURL?: string; // legacy single photo
  workoutSnapshot?: WorkoutSnapshot;
  kudosCount: number;
  commentsCount: number;
  createdAt: string;
}

// ============= PUBLIC PROFILE (Social) =============

export interface WorkoutHistoryItem {
  id: string;
  title: string;
  completedAt: string;
  duration: number; // seconds
  setsCount: number;
  volume: number; // kg
}

export interface WeeklyActivityData {
  weekStart: string; // ISO date
  workoutsCount: number;
  totalMinutes: number;
}

export interface PublicProfile {
  uid: string;
  username: string;
  usernameLower: string;
  displayName: string;
  bio?: string;
  location?: string;
  photoURL?: string;
  avatarId?: string;
  coverPhotos?: string[];
  instagramHandle?: string;
  elo: EloInfo;
  level: number;
  xp: number;
  xpGoal?: number;
  streak?: number;
  prsCount?: number;
  stats: {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    workoutsCount: number;
  };
  visibility: 'public' | 'clanOnly' | 'private';
  clanId?: string;
  scheduleDays: number[];
  workoutHistory?: WorkoutHistoryItem[];
  weeklyActivity?: WeeklyActivityData[];
  createdAt: string;
  updatedAt: string;
}

export interface PostReaction {
  userId: string;
  type: 'kudos';
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  author: PostAuthor;
  content: string;
  createdAt: string;
}

// ============= CLANS =============

export type ClanRole = 'gm' | 'officer' | 'member';
export type MemberStatus = 'active' | 'frozen' | 'pending';

export type DailyMemberStatus = 
  | 'trained' // ✅ Treinou (dia marcado e concluiu)
  | 'pending' // ❌ Não treinou ainda (dia marcado e não concluiu)
  | 'rest'    // 💤 Descanso (dia não marcado)
  | 'frozen'; // 🧊 Congelado (freeze ativo)

export interface ClanMember {
  userId: string;
  displayName: string;
  photoURL?: string;
  avatarId?: string;
  role: ClanRole;
  status: MemberStatus;
  elo: EloInfo;
  weeklyPoints: number;
  joinedAt: string;
  schedule?: WeeklySchedule;
  freezeUntil?: string;
}

export interface Clan {
  id: string;
  name: string;
  tag: string; // 3-5 char clan tag
  description?: string;
  iconURL?: string;
  inviteCode: string;
  isPublic: boolean;
  clanElo?: EloInfo; // Median of active members
  membersCount: number;
  weeklyPoints: number; // Sum of active members' points
  monthlyPoints: number;
  presenceRate: number; // % of training days completed
  gmUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FreezeRequest {
  id: string;
  userId: string;
  clanId: string;
  displayName: string;
  reason: string;
  freezeFrom: string;
  freezeUntil: string;
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface JoinRequest {
  id: string;
  userId: string;
  clanId: string;
  displayName: string;
  photoURL?: string;
  elo: EloInfo;
  status: 'pending' | 'approved' | 'denied';
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

// ============= NOTIFICATIONS =============

export type NotificationType = 
  | 'motivation' // Someone motivated you
  | 'kudos'      // Someone gave kudos
  | 'comment'    // Someone commented on your post
  | 'clan_invite'
  | 'freeze_approved'
  | 'freeze_denied';

export interface InAppNotification {
  id: string;
  userId: string; // recipient
  type: NotificationType;
  title: string;
  message: string;
  fromUserId?: string;
  fromDisplayName?: string;
  relatedId?: string; // postId, clanId, etc.
  read: boolean;
  createdAt: string;
}

// ============= RANKING =============

export interface ClanRankingEntry {
  clanId: string;
  clanName: string;
  clanTag: string;
  iconURL?: string;
  clanElo?: EloInfo;
  membersCount: number;
  activeMembers: number;
  weeklyPoints: number;
  monthlyPoints: number;
  presenceRate: number;
  rank: number;
}

// ============= ARENA STATE (localStorage) =============

export interface ArenaState {
  version: number;
  profile?: ArenaProfile;
  posts: Post[];
  myReactions: Record<string, 'kudos'>; // postId -> reaction
  myClan?: Clan;
  clanMembers: ClanMember[];
  freezeRequests: FreezeRequest[];
  joinRequests: JoinRequest[];
  notifications: InAppNotification[];
  weeklyRanking: ClanRankingEntry[];
  monthlyRanking: ClanRankingEntry[];
  updatedAt: number;
}

export const ARENA_STATE_KEY = 'levelup.arena';
export const ARENA_STATE_VERSION = 1;
