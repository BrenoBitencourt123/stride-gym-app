// src/lib/arena/scheduleUtils.ts
// Weekly schedule and points calculation utilities
// NOTE: This file no longer uses localStorage - trained status is passed from Firebase hooks

import { 
  ArenaScheduleState, 
  WeeklySchedule, 
  DailyMemberStatus,
  ClanMember
} from './types';
import { getPointsPerWorkout, getMissedWorkoutPenalty } from './eloUtils';

// Re-export DayStatus type
export type DayStatus = DailyMemberStatus;

// NOTE: hasMemberTrainedToday is now handled by Firebase via useArenaFirestore hook
// The trained status should be passed as a parameter from the component

// Alias for getMemberDailyStatus - now requires trainedToday to be passed explicitly
// Components should get this from Firebase arenaLedger, not localStorage
export const getMemberDayStatus = (member: ClanMember, trainedToday: boolean = false): DailyMemberStatus => {
  return getMemberDailyStatus(member, trainedToday);
};

// ============= TIMEZONE & DATE UTILITIES =============

const SAO_PAULO_TZ = 'America/Sao_Paulo';

/**
 * Get current date in São Paulo timezone
 */
export function getSaoPauloDate(): Date {
  const now = new Date();
  const spString = now.toLocaleString('en-US', { timeZone: SAO_PAULO_TZ });
  return new Date(spString);
}

/**
 * Get day of week index (0 = Monday, 6 = Sunday) in São Paulo timezone
 */
export function getSaoPauloDayIndex(): number {
  const date = getSaoPauloDate();
  const jsDay = date.getDay(); // 0 = Sunday
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Get the start of current week (Monday 00:00) in São Paulo timezone
 */
export function getWeekStartSaoPaulo(): Date {
  const date = getSaoPauloDate();
  const dayIndex = getSaoPauloDayIndex();
  
  date.setDate(date.getDate() - dayIndex);
  date.setHours(0, 0, 0, 0);
  
  return date;
}

/**
 * Get the start of next week (next Monday 00:00)
 */
export function getNextWeekStart(): Date {
  const weekStart = getWeekStartSaoPaulo();
  weekStart.setDate(weekStart.getDate() + 7);
  return weekStart;
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get today's date key
 */
export function getTodayKey(): string {
  return formatDateKey(getSaoPauloDate());
}

// ============= SCHEDULE MANAGEMENT =============

/**
 * Create default schedule (no training days set)
 */
export function createDefaultSchedule(): ArenaScheduleState {
  return {
    current: {
      trainingDays: [],
      effectiveAt: new Date().toISOString(),
    },
  };
}

/**
 * Update schedule with pending changes (takes effect next Monday)
 */
export function updateScheduleWithPending(
  current: ArenaScheduleState,
  newTrainingDays: number[]
): ArenaScheduleState {
  const nextMonday = getNextWeekStart();
  
  return {
    current: current.current,
    pending: {
      trainingDays: [...newTrainingDays].sort((a, b) => a - b),
      effectiveAt: nextMonday.toISOString(),
    },
  };
}

/**
 * Apply pending schedule if current date is past effectiveAt
 */
export function applyPendingScheduleIfDue(schedule: ArenaScheduleState): ArenaScheduleState {
  if (!schedule.pending) return schedule;
  
  const now = getSaoPauloDate();
  const effectiveAt = new Date(schedule.pending.effectiveAt);
  
  if (now >= effectiveAt) {
    return {
      current: schedule.pending,
      pending: undefined,
    };
  }
  
  return schedule;
}

/**
 * Check if a specific day is a training day
 */
export function isTrainingDay(schedule: WeeklySchedule, dayIndex: number): boolean {
  return schedule.trainingDays.includes(dayIndex);
}

/**
 * Check if today is a training day
 */
export function isTodayTrainingDay(schedule: WeeklySchedule): boolean {
  const todayIndex = getSaoPauloDayIndex();
  return isTrainingDay(schedule, todayIndex);
}

// ============= POINTS CALCULATION =============

/**
 * Calculate points earned for completing a workout
 */
export function calculateWorkoutPoints(
  schedule: WeeklySchedule,
  isScheduledDay: boolean
): number {
  const trainingDaysCount = schedule.trainingDays.length;
  
  if (trainingDaysCount === 0) return 0;
  
  // If workout on scheduled day, full points
  if (isScheduledDay) {
    return getPointsPerWorkout(trainingDaysCount);
  }
  
  // Workout on rest day = 0 points (MVP to prevent exploits)
  return 0;
}

/**
 * Calculate penalty for missing a scheduled workout
 */
export function calculateMissedPenalty(schedule: WeeklySchedule): number {
  const trainingDaysCount = schedule.trainingDays.length;
  
  if (trainingDaysCount === 0) return 0;
  
  return getMissedWorkoutPenalty(trainingDaysCount);
}

// ============= DAILY STATUS =============

/**
 * Get member's daily status based on schedule and workout completion
 */
export function getMemberDailyStatus(
  member: ClanMember,
  trainedToday: boolean
): DailyMemberStatus {
  // Check if frozen
  if (member.status === 'frozen' && member.freezeUntil) {
    const freezeEnd = new Date(member.freezeUntil);
    const now = getSaoPauloDate();
    
    if (now < freezeEnd) {
      return 'frozen';
    }
  }
  
  // Check if today is a training day
  const schedule = member.schedule;
  if (!schedule) {
    return 'rest'; // No schedule = rest
  }
  
  const todayIndex = getSaoPauloDayIndex();
  const isTrainingDayToday = schedule.trainingDays.includes(todayIndex);
  
  if (!isTrainingDayToday) {
    return 'rest';
  }
  
  return trainedToday ? 'trained' : 'pending';
}

/**
 * Get status icon for daily status
 */
export function getDailyStatusIcon(status: DailyMemberStatus): string {
  switch (status) {
    case 'trained': return '✅';
    case 'pending': return '❌';
    case 'rest': return '💤';
    case 'frozen': return '🧊';
  }
}

/**
 * Get status label for daily status
 */
export function getDailyStatusLabel(status: DailyMemberStatus): string {
  switch (status) {
    case 'trained': return 'Treinou';
    case 'pending': return 'Não treinou';
    case 'rest': return 'Descanso';
    case 'frozen': return 'Congelado';
  }
}

// ============= WEEK INFO =============

export const DAY_NAMES_SHORT = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const DAY_NAMES_FULL = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

/**
 * Get display for training days schedule
 */
export function getScheduleDisplay(trainingDays: number[]): string {
  if (trainingDays.length === 0) return 'Nenhum dia definido';
  
  return trainingDays
    .sort((a, b) => a - b)
    .map(d => DAY_NAMES_SHORT[d])
    .join(', ');
}
