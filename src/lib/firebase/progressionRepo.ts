// src/lib/firebase/progressionRepo.ts
// CORE PROGRESSION SYSTEM - Firestore as source of truth
// ELO (competitive, can go up/down) + LEVEL/XP (RPG, only goes up)

import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '@/services/firebase';
import { getEloFromPoints, type EloTier } from '@/lib/arena/eloUtils';
import { EloInfo } from '@/lib/arena/types';
import { 
  getSaoPauloDate, 
  getSaoPauloDayIndex, 
  formatDateKey,
  getWeekStartSaoPaulo 
} from '@/lib/arena/scheduleUtils';

// ============= TYPES =============

export interface UserStats {
  level: number;      // Starts at 1
  xp: number;         // Starts at 0
  xpGoal: number;     // Starts at 500
}

export interface UserArena {
  eloPoints: number;         // Total Elo points (can go up and down)
  eloTier: EloTier;          // Derived from eloPoints
  eloDiv: number;            // 1-4, derived from eloPoints
  weekPoints: number;        // Current week's points (derived)
  scheduleCurrent: {
    weekKey: string;         // e.g., "2026-W03"
    plannedDays: number[];   // [1,3,5] - days 0=Mon to 6=Sun
    plannedCount: number;    // Number of training days
  };
  scheduleNext: {
    weekKey: string;
    plannedDays: number[];
    plannedCount: number;
  } | null;
  nextScheduleEffectiveAt: Timestamp | null;
  frozenUntil: Timestamp | null;
}

export interface LedgerEntry {
  type: 'workout_credit' | 'miss_penalty';
  dateKey: string;           // YYYY-MM-DD
  pointsDelta: number;       // Can be positive or negative
  createdAt: Timestamp;
}

export interface XpLedgerEntry {
  type: 'workout_xp';
  dateKey: string;
  xpDelta: number;
  createdAt: Timestamp;
}

export interface FullProgressionState {
  stats: UserStats;
  arena: UserArena;
  clanId: string | null;
}

// ============= CONSTANTS =============

const DEFAULT_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpGoal: 500,
};

const DEFAULT_ARENA: UserArena = {
  eloPoints: 0,
  eloTier: 'iron',
  eloDiv: 4,
  weekPoints: 0,
  scheduleCurrent: {
    weekKey: getWeekKey(new Date()),
    plannedDays: [],
    plannedCount: 0,
  },
  scheduleNext: null,
  nextScheduleEffectiveAt: null,
  frozenUntil: null,
};

const XP_PER_WORKOUT = 150;
const WEEKLY_TARGET_POINTS = 100;
const PENALTY_FACTOR = 0.4; // 40% penalty

// ============= HELPERS =============

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Get Monday of this week
  const dayOfWeek = d.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + mondayOffset);
  
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const daysDiff = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNum = Math.ceil((daysDiff + startOfYear.getDay() + 1) / 7);
  
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekDateRange(): { weekStart: string; weekEnd: string } {
  const spDate = getWeekStartSaoPaulo();
  const weekStart = formatDateKey(spDate);
  
  const endDate = new Date(spDate);
  endDate.setDate(endDate.getDate() + 6);
  const weekEnd = formatDateKey(endDate);
  
  return { weekStart, weekEnd };
}

function calculatePointsPerWorkout(plannedCount: number): number {
  if (plannedCount <= 0) return 0;
  // Round to 1 decimal place
  return Math.round((WEEKLY_TARGET_POINTS / plannedCount) * 10) / 10;
}

function calculateMissPenalty(plannedCount: number): number {
  const pointsPerWorkout = calculatePointsPerWorkout(plannedCount);
  return -Math.round(pointsPerWorkout * PENALTY_FACTOR * 10) / 10;
}

function deriveEloFromPoints(totalPoints: number): { tier: EloTier; div: number } {
  const eloInfo = getEloFromPoints(totalPoints);
  return { tier: eloInfo.tier, div: eloInfo.division };
}

function processLevelUp(stats: UserStats): UserStats {
  let { level, xp, xpGoal } = stats;
  
  while (xp >= xpGoal) {
    xp = xp - xpGoal;
    level = level + 1;
    xpGoal = xpGoal + 300;
  }
  
  return { level, xp, xpGoal };
}

// ============= CORE FUNCTIONS =============

/**
 * Get user's stats (level, xp, xpGoal)
 */
export async function getUserStats(uid: string): Promise<UserStats | null> {
  if (!db || !uid) return null;
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.stats || null;
    }
    return null;
  } catch (error) {
    console.error('[progressionRepo] getUserStats error:', error);
    return null;
  }
}

/**
 * Get user's arena data (elo, schedule, etc.)
 */
export async function getUserArena(uid: string): Promise<UserArena | null> {
  if (!db || !uid) return null;
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.arena || null;
    }
    return null;
  } catch (error) {
    console.error('[progressionRepo] getUserArena error:', error);
    return null;
  }
}

/**
 * Ensure user has stats and arena initialized with defaults
 */
export async function ensureProgressionDefaults(uid: string): Promise<FullProgressionState> {
  if (!db || !uid) {
    return { stats: DEFAULT_STATS, arena: DEFAULT_ARENA, clanId: null };
  }
  
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    let stats = DEFAULT_STATS;
    let arena = DEFAULT_ARENA;
    let clanId: string | null = null;
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      stats = data.stats || DEFAULT_STATS;
      arena = data.arena || DEFAULT_ARENA;
      clanId = data.clanId || null;
    }
    
    // If missing, initialize
    if (!docSnap.exists() || !docSnap.data()?.stats || !docSnap.data()?.arena) {
      await setDoc(docRef, {
        stats,
        arena,
        clanId,
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    
    return { stats, arena, clanId };
  } catch (error) {
    console.error('[progressionRepo] ensureProgressionDefaults error:', error);
    return { stats: DEFAULT_STATS, arena: DEFAULT_ARENA, clanId: null };
  }
}

/**
 * Check if today is a training day for the user
 */
export function isTrainingDay(arena: UserArena, date?: Date): boolean {
  const d = date || getSaoPauloDate();
  const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1; // 0=Mon, 6=Sun
  return arena.scheduleCurrent.plannedDays.includes(dayIndex);
}

/**
 * Check if user was frozen on a specific date
 */
export async function isFrozenOnDate(uid: string, dateKey: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    // Check user's frozenUntil field
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) return false;
    
    const arena = docSnap.data()?.arena as UserArena | undefined;
    if (!arena?.frozenUntil) return false;
    
    const frozenUntilDate = arena.frozenUntil.toDate();
    const checkDate = new Date(dateKey + 'T23:59:59');
    
    return checkDate <= frozenUntilDate;
  } catch (error) {
    console.error('[progressionRepo] isFrozenOnDate error:', error);
    return false;
  }
}

/**
 * Check if a ledger entry exists (for idempotency)
 */
async function ledgerEntryExists(uid: string, entryId: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const entryRef = doc(db, 'users', uid, 'arenaLedger', entryId);
    const entrySnap = await getDoc(entryRef);
    return entrySnap.exists();
  } catch {
    return false;
  }
}

/**
 * Check if an XP ledger entry exists (for idempotency)
 */
async function xpLedgerEntryExists(uid: string, entryId: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const entryRef = doc(db, 'users', uid, 'xpLedger', entryId);
    const entrySnap = await getDoc(entryRef);
    return entrySnap.exists();
  } catch {
    return false;
  }
}

/**
 * CORE: Apply workout rewards (XP always, Elo only on training days)
 * Uses transactions for idempotency across devices
 */
export async function applyWorkoutRewards(uid: string, dateKey?: string): Promise<{
  xpGained: number;
  eloGained: number;
  newStats: UserStats;
  newArena: UserArena;
}> {
  if (!db || !uid) {
    throw new Error('Firebase not configured or no UID');
  }
  
  const workoutDateKey = dateKey || formatDateKey(getSaoPauloDate());
  const xpEntryId = `${workoutDateKey}_workout_xp`;
  const eloEntryId = `${workoutDateKey}_workout_credit`;
  
  const userRef = doc(db, 'users', uid);
  const xpLedgerRef = doc(db, 'users', uid, 'xpLedger', xpEntryId);
  const eloLedgerRef = doc(db, 'users', uid, 'arenaLedger', eloEntryId);
  
  try {
    const result = await runTransaction(db, async (transaction) => {
      // Read current state
      const userSnap = await transaction.get(userRef);
      const xpLedgerSnap = await transaction.get(xpLedgerRef);
      const eloLedgerSnap = await transaction.get(eloLedgerRef);
      
      // Get or initialize stats/arena
      const userData = userSnap.data() || {};
      let stats: UserStats = userData.stats || { ...DEFAULT_STATS };
      let arena: UserArena = userData.arena || { ...DEFAULT_ARENA };
      
      let xpGained = 0;
      let eloGained = 0;
      
      // 1. Apply XP if not already credited today
      if (!xpLedgerSnap.exists()) {
        xpGained = XP_PER_WORKOUT;
        stats.xp += xpGained;
        
        // Process level ups
        stats = processLevelUp(stats);
        
        // Create XP ledger entry
        transaction.set(xpLedgerRef, {
          type: 'workout_xp',
          dateKey: workoutDateKey,
          xpDelta: xpGained,
          createdAt: serverTimestamp(),
        });
      }
      
      // 2. Apply Elo if today is a training day AND not already credited
      // Convert dateKey to Date to check if training day
      const workoutDate = new Date(workoutDateKey + 'T12:00:00');
      const dayIndex = workoutDate.getDay() === 0 ? 6 : workoutDate.getDay() - 1;
      const isTodayTraining = arena.scheduleCurrent.plannedDays.includes(dayIndex);
      
      if (isTodayTraining && !eloLedgerSnap.exists()) {
        const pointsPerWorkout = calculatePointsPerWorkout(arena.scheduleCurrent.plannedCount);
        eloGained = pointsPerWorkout;
        
        arena.eloPoints = Math.max(0, arena.eloPoints + eloGained);
        
        // Derive tier/div from new points
        const { tier, div } = deriveEloFromPoints(arena.eloPoints);
        arena.eloTier = tier;
        arena.eloDiv = div;
        
        // Create Elo ledger entry
        transaction.set(eloLedgerRef, {
          type: 'workout_credit',
          dateKey: workoutDateKey,
          pointsDelta: eloGained,
          createdAt: serverTimestamp(),
        });
      }
      
      // Update user document
      transaction.set(userRef, {
        stats,
        arena,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      return { xpGained, eloGained, newStats: stats, newArena: arena };
    });
    
    console.log(`[progressionRepo] Workout rewards applied: +${result.xpGained} XP, +${result.eloGained} Elo`);
    return result;
  } catch (error) {
    console.error('[progressionRepo] applyWorkoutRewards error:', error);
    throw error;
  }
}

/**
 * CORE: Apply pending miss penalties for past training days this week
 * Called on app boot / Arena open
 */
export async function applyPendingMissPenalties(uid: string): Promise<{
  penaltiesApplied: number;
  totalPenalty: number;
}> {
  if (!db || !uid) {
    return { penaltiesApplied: 0, totalPenalty: 0 };
  }
  
  const userRef = doc(db, 'users', uid);
  
  try {
    // Get current user data
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      return { penaltiesApplied: 0, totalPenalty: 0 };
    }
    
    const userData = userSnap.data();
    const arena: UserArena = userData.arena || { ...DEFAULT_ARENA };
    
    // Get week date range
    const weekStartDate = getWeekStartSaoPaulo();
    const today = getSaoPauloDate();
    
    // Get all days from week start until yesterday
    const daysToCheck: string[] = [];
    const currentDate = new Date(weekStartDate);
    
    while (currentDate < today) {
      const dayIndex = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1;
      
      // Only check training days
      if (arena.scheduleCurrent.plannedDays.includes(dayIndex)) {
        daysToCheck.push(formatDateKey(currentDate));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    let penaltiesApplied = 0;
    let totalPenalty = 0;
    
    for (const dateKey of daysToCheck) {
      const creditEntryId = `${dateKey}_workout_credit`;
      const penaltyEntryId = `${dateKey}_miss_penalty`;
      
      // Check if workout was done
      const creditExists = await ledgerEntryExists(uid, creditEntryId);
      if (creditExists) continue; // Workout done, skip
      
      // Check if penalty already applied
      const penaltyExists = await ledgerEntryExists(uid, penaltyEntryId);
      if (penaltyExists) continue; // Penalty already applied
      
      // Check if user was frozen
      const wasFrozen = await isFrozenOnDate(uid, dateKey);
      if (wasFrozen) continue; // Was frozen, skip penalty
      
      // Apply penalty via transaction
      const penalty = calculateMissPenalty(arena.scheduleCurrent.plannedCount);
      
      await runTransaction(db, async (transaction) => {
        const penaltyRef = doc(db, 'users', uid, 'arenaLedger', penaltyEntryId);
        const penaltySnap = await transaction.get(penaltyRef);
        
        if (penaltySnap.exists()) return; // Double check
        
        // Get latest user data
        const latestUserSnap = await transaction.get(userRef);
        const latestArena: UserArena = latestUserSnap.data()?.arena || arena;
        
        // Apply penalty
        latestArena.eloPoints = Math.max(0, latestArena.eloPoints + penalty);
        
        // Derive new tier/div
        const { tier, div } = deriveEloFromPoints(latestArena.eloPoints);
        latestArena.eloTier = tier;
        latestArena.eloDiv = div;
        
        // Create penalty ledger entry
        transaction.set(penaltyRef, {
          type: 'miss_penalty',
          dateKey,
          pointsDelta: penalty,
          createdAt: serverTimestamp(),
        });
        
        // Update user
        transaction.set(userRef, {
          arena: latestArena,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      });
      
      penaltiesApplied++;
      totalPenalty += Math.abs(penalty);
    }
    
    if (penaltiesApplied > 0) {
      console.log(`[progressionRepo] Applied ${penaltiesApplied} miss penalties: -${totalPenalty} Elo`);
    }
    
    return { penaltiesApplied, totalPenalty };
  } catch (error) {
    console.error('[progressionRepo] applyPendingMissPenalties error:', error);
    return { penaltiesApplied: 0, totalPenalty: 0 };
  }
}

/**
 * Calculate week points from ledger entries
 */
export async function getWeekPoints(uid: string): Promise<number> {
  if (!db || !uid) return 0;
  
  try {
    const { weekStart, weekEnd } = getWeekDateRange();
    
    const ledgerRef = collection(db, 'users', uid, 'arenaLedger');
    const q = query(
      ledgerRef,
      where('dateKey', '>=', weekStart),
      where('dateKey', '<=', weekEnd)
    );
    
    const snapshot = await getDocs(q);
    let weekPoints = 0;
    
    snapshot.forEach((doc) => {
      const data = doc.data() as LedgerEntry;
      weekPoints += data.pointsDelta;
    });
    
    return Math.max(0, weekPoints);
  } catch (error) {
    console.error('[progressionRepo] getWeekPoints error:', error);
    return 0;
  }
}

/**
 * Update user's training schedule
 */
export async function updateTrainingSchedule(
  uid: string,
  trainingDays: number[]
): Promise<void> {
  if (!db || !uid) return;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    const arena: UserArena = userSnap.data()?.arena || { ...DEFAULT_ARENA };
    
    // Check if this is first setup (no days configured yet)
    const isFirstSetup = arena.scheduleCurrent.plannedDays.length === 0;
    
    const sortedDays = [...trainingDays].sort((a, b) => a - b);
    
    if (isFirstSetup) {
      // First time: apply immediately
      arena.scheduleCurrent = {
        weekKey: getWeekKey(getSaoPauloDate()),
        plannedDays: sortedDays,
        plannedCount: sortedDays.length,
      };
      arena.scheduleNext = null;
      arena.nextScheduleEffectiveAt = null;
    } else {
      // Subsequent changes: queue for next Monday
      const nextMonday = getWeekStartSaoPaulo();
      nextMonday.setDate(nextMonday.getDate() + 7);
      
      arena.scheduleNext = {
        weekKey: getWeekKey(nextMonday),
        plannedDays: sortedDays,
        plannedCount: sortedDays.length,
      };
      arena.nextScheduleEffectiveAt = Timestamp.fromDate(nextMonday);
    }
    
    await setDoc(userRef, {
      arena,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    
    console.log('[progressionRepo] Schedule updated:', sortedDays);
  } catch (error) {
    console.error('[progressionRepo] updateTrainingSchedule error:', error);
  }
}

/**
 * Apply pending schedule if it's past the effective date
 */
export async function applyPendingScheduleIfDue(uid: string): Promise<boolean> {
  if (!db || !uid) return false;
  
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return false;
    
    const arena: UserArena = userSnap.data()?.arena;
    if (!arena?.scheduleNext || !arena?.nextScheduleEffectiveAt) return false;
    
    const now = getSaoPauloDate();
    const effectiveAt = arena.nextScheduleEffectiveAt.toDate();
    
    if (now >= effectiveAt) {
      // Apply pending schedule
      arena.scheduleCurrent = arena.scheduleNext;
      arena.scheduleNext = null;
      arena.nextScheduleEffectiveAt = null;
      
      await setDoc(userRef, {
        arena,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      
      console.log('[progressionRepo] Applied pending schedule');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('[progressionRepo] applyPendingScheduleIfDue error:', error);
    return false;
  }
}

/**
 * Subscribe to user progression changes (real-time)
 */
export function subscribeToProgression(
  uid: string,
  callback: (state: FullProgressionState | null) => void
): Unsubscribe {
  if (!db || !uid) {
    callback(null);
    return () => {};
  }
  
  const userRef = doc(db, 'users', uid);
  
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data();
      callback({
        stats: data.stats || DEFAULT_STATS,
        arena: data.arena || DEFAULT_ARENA,
        clanId: data.clanId || null,
      });
    } else {
      callback({
        stats: DEFAULT_STATS,
        arena: DEFAULT_ARENA,
        clanId: null,
      });
    }
  }, (error) => {
    console.error('[progressionRepo] subscribeToProgression error:', error);
    callback(null);
  });
}

/**
 * Get full progression state (for PlayerCard etc.)
 */
export async function getFullProgression(uid: string): Promise<FullProgressionState> {
  if (!db || !uid) {
    return { stats: DEFAULT_STATS, arena: DEFAULT_ARENA, clanId: null };
  }
  
  // Ensure defaults exist
  const state = await ensureProgressionDefaults(uid);
  
  // Apply pending schedule if due
  await applyPendingScheduleIfDue(uid);
  
  // Calculate current week points
  const weekPoints = await getWeekPoints(uid);
  state.arena.weekPoints = weekPoints;
  
  return state;
}

// Export types for use elsewhere
export type { EloTier };
