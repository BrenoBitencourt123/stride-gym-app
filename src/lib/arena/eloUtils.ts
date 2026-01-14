// src/lib/arena/eloUtils.ts
// Elo calculation and display utilities

import { 
  EloInfo, 
  EloTier, 
  ELO_TIERS, 
  ELO_TIER_NAMES,
  ArenaProfile,
  ClanMember 
} from './types';

// ============= ELO CONSTANTS =============

export const WEEKLY_TARGET_POINTS = 100;
export const PENALTY_FACTOR = 0.4; // 40% of workout value

// Points required to advance to each tier (cumulative)
const TIER_THRESHOLDS: Record<EloTier, number> = {
  iron: 0,
  bronze: 400,
  silver: 800,
  gold: 1400,
  platinum: 2200,
  emerald: 3200,
  diamond: 4400,
  master: 5800,
  grandmaster: 7400,
  challenger: 9200,
};

// ============= ELO CALCULATIONS =============

/**
 * Calculate points per workout based on training days
 */
export function getPointsPerWorkout(trainingDaysCount: number): number {
  if (trainingDaysCount <= 0) return 0;
  return Math.round(WEEKLY_TARGET_POINTS / trainingDaysCount);
}

/**
 * Calculate penalty for missed workout
 */
export function getMissedWorkoutPenalty(trainingDaysCount: number): number {
  const pointsPerWorkout = getPointsPerWorkout(trainingDaysCount);
  return Math.round(pointsPerWorkout * PENALTY_FACTOR);
}

/**
 * Get EloInfo from total points
 */
export function getEloFromPoints(totalPoints: number): EloInfo {
  let tier: EloTier = 'iron';
  let tierStartPoints = 0;
  
  // Find the highest tier that the points qualify for
  for (const t of ELO_TIERS) {
    if (totalPoints >= TIER_THRESHOLDS[t]) {
      tier = t;
      tierStartPoints = TIER_THRESHOLDS[t];
    }
  }
  
  // Calculate division within tier (4 divisions, each 100 points)
  const tierIndex = ELO_TIERS.indexOf(tier);
  const nextTier = ELO_TIERS[tierIndex + 1];
  const nextThreshold = nextTier ? TIER_THRESHOLDS[nextTier] : TIER_THRESHOLDS[tier] + 2000;
  
  const tierRange = nextThreshold - tierStartPoints;
  const pointsInTier = totalPoints - tierStartPoints;
  const divisionSize = tierRange / 4;
  
  // Division 4 = lowest, 1 = highest within tier
  let division = 4 - Math.floor(pointsInTier / divisionSize);
  division = Math.max(1, Math.min(4, division));
  
  // Points within current division (0-100 range for display)
  const divisionProgress = (pointsInTier % divisionSize) / divisionSize * 100;
  
  return {
    tier,
    division,
    points: Math.round(divisionProgress),
    totalPoints,
  };
}

/**
 * Calculate median elo from list of members
 */
export function calculateMedianElo(members: ClanMember[]): EloInfo | undefined {
  const activeMembers = members.filter(m => m.status === 'active');
  
  if (activeMembers.length < 3) {
    return undefined; // Not enough members for ranking
  }
  
  const sortedPoints = activeMembers
    .map(m => m.elo.totalPoints)
    .sort((a, b) => a - b);
  
  const mid = Math.floor(sortedPoints.length / 2);
  const medianPoints = sortedPoints.length % 2 !== 0
    ? sortedPoints[mid]
    : Math.round((sortedPoints[mid - 1] + sortedPoints[mid]) / 2);
  
  return getEloFromPoints(medianPoints);
}

// ============= DISPLAY UTILITIES =============

/**
 * Get display name for elo tier
 */
export function getEloTierName(tier: EloTier): string {
  return ELO_TIER_NAMES[tier];
}

/**
 * Get full elo display string (e.g., "Ouro II")
 */
export function getEloDisplayString(elo: EloInfo): string {
  const tierName = getEloTierName(elo.tier);
  const divisionRoman = ['I', 'II', 'III', 'IV'][elo.division - 1];
  
  // Top tiers don't show division
  if (['master', 'grandmaster', 'challenger'].includes(elo.tier)) {
    return tierName;
  }
  
  return `${tierName} ${divisionRoman}`;
}

/**
 * Compare two elos (returns negative if a < b, positive if a > b)
 */
export function compareElo(a: EloInfo, b: EloInfo): number {
  return a.totalPoints - b.totalPoints;
}

// ============= CSS UTILITIES FOR ELO FRAMES =============

export const ELO_FRAME_STYLES: Record<EloTier, {
  borderColor: string;
  glowColor: string;
  gradientFrom: string;
  gradientTo: string;
}> = {
  iron: {
    borderColor: 'border-zinc-500',
    glowColor: 'shadow-zinc-500/20',
    gradientFrom: 'from-zinc-600',
    gradientTo: 'to-zinc-400',
  },
  bronze: {
    borderColor: 'border-amber-700',
    glowColor: 'shadow-amber-700/30',
    gradientFrom: 'from-amber-800',
    gradientTo: 'to-amber-600',
  },
  silver: {
    borderColor: 'border-slate-300',
    glowColor: 'shadow-slate-300/40',
    gradientFrom: 'from-slate-400',
    gradientTo: 'to-slate-200',
  },
  gold: {
    borderColor: 'border-yellow-500',
    glowColor: 'shadow-yellow-500/40',
    gradientFrom: 'from-yellow-600',
    gradientTo: 'to-yellow-400',
  },
  platinum: {
    borderColor: 'border-cyan-400',
    glowColor: 'shadow-cyan-400/40',
    gradientFrom: 'from-cyan-500',
    gradientTo: 'to-cyan-300',
  },
  emerald: {
    borderColor: 'border-emerald-500',
    glowColor: 'shadow-emerald-500/40',
    gradientFrom: 'from-emerald-600',
    gradientTo: 'to-emerald-400',
  },
  diamond: {
    borderColor: 'border-blue-400',
    glowColor: 'shadow-blue-400/50',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-blue-300',
  },
  master: {
    borderColor: 'border-purple-500',
    glowColor: 'shadow-purple-500/50',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-purple-400',
  },
  grandmaster: {
    borderColor: 'border-red-500',
    glowColor: 'shadow-red-500/50',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-400',
  },
  challenger: {
    borderColor: 'border-amber-400',
    glowColor: 'shadow-amber-400/60',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-yellow-300',
  },
};

export function getEloFrameClasses(tier: EloTier): string {
  const style = ELO_FRAME_STYLES[tier];
  return `${style.borderColor} ${style.glowColor}`;
}

export function getEloGradientClasses(tier: EloTier): string {
  const style = ELO_FRAME_STYLES[tier];
  return `bg-gradient-to-br ${style.gradientFrom} ${style.gradientTo}`;
}

// ============= ELO ICONS =============

export const ELO_ICONS: Record<EloTier, string> = {
  iron: '🪨',
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  platinum: '💎',
  emerald: '💚',
  diamond: '🔷',
  master: '👑',
  grandmaster: '🏆',
  challenger: '⚡',
};

export function getEloIcon(tier: EloTier): string {
  return ELO_ICONS[tier];
}
