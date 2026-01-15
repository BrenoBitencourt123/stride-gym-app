// src/components/arena/ProgressionStats.tsx
// Grid of progression stat cards (Level, Elo, Streak, PRs)

import { Trophy, Flame, Target, TrendingUp } from "lucide-react";
import { EloTier, getEloFrameStyles, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";

interface ProgressionStatsProps {
  level: number;
  xp: number;
  xpGoal?: number;
  eloTier: EloTier;
  eloDivision: number;
  streak: number;
  prsCount: number;
}

const ProgressionStats = ({
  level,
  xp,
  xpGoal = 500,
  eloTier,
  eloDivision,
  streak,
  prsCount,
}: ProgressionStatsProps) => {
  const eloStyles = getEloFrameStyles(eloTier);
  const tierName = ELO_TIER_NAMES[eloTier] || eloTier;
  const xpProgress = Math.min((xp / xpGoal) * 100, 100);

  return (
    <div className="grid grid-cols-4 gap-2">
      {/* Level Card */}
      <div className="card-glass rounded-xl p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <p className="text-lg font-bold text-foreground">Lv.{level}</p>
        <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">
          {xp}/{xpGoal} XP
        </p>
      </div>

      {/* Elo Card */}
      <div className="card-glass rounded-xl p-3 text-center">
        <div 
          className="w-8 h-8 mx-auto mb-1 rounded-full flex items-center justify-center"
          style={{ background: eloStyles.gradient }}
        >
          <Trophy className="w-4 h-4 text-white" />
        </div>
        <p 
          className="text-sm font-bold"
          style={{ color: eloStyles.borderColor }}
        >
          {tierName}
        </p>
        <p className="text-[10px] text-muted-foreground">{eloDivision}</p>
      </div>

      {/* Streak Card */}
      <div className="card-glass rounded-xl p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-orange-500/20 flex items-center justify-center">
          <Flame className="w-4 h-4 text-orange-500" />
        </div>
        <p className="text-lg font-bold text-foreground">{streak}</p>
        <p className="text-[10px] text-muted-foreground">dias</p>
      </div>

      {/* PRs Card */}
      <div className="card-glass rounded-xl p-3 text-center">
        <div className="w-8 h-8 mx-auto mb-1 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Target className="w-4 h-4 text-yellow-500" />
        </div>
        <p className="text-lg font-bold text-foreground">{prsCount}</p>
        <p className="text-[10px] text-muted-foreground">PRs</p>
      </div>
    </div>
  );
};

export default ProgressionStats;
