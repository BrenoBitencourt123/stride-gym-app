import { Award, Mountain, Hourglass, Package } from "lucide-react";

interface AchievementsCardProps {
  current: number;
  total: number;
  nextRewardIn: number;
}

const AchievementsCard = ({ current, total, nextRewardIn }: AchievementsCardProps) => {
  const progressPercentage = ((6 - nextRewardIn) / 6) * 100;

  return (
    <div className="card-glass p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-foreground">Conquistas</h3>
        <span className="text-sm text-muted-foreground">
          {current} / {total} Conquistas
        </span>
      </div>

      {/* Achievement badges */}
      <div className="flex items-center gap-3 mb-4">
        <div className="achievement-badge bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-600/30">
          <Award className="w-6 h-6 text-yellow-500" />
        </div>
        <div className="achievement-badge bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-600/30 relative">
          <Mountain className="w-6 h-6 text-purple-400" />
          <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-purple-600 text-white px-1 rounded">5x</span>
        </div>
        <div className="achievement-badge bg-gradient-to-br from-slate-500/20 to-slate-700/20 border-slate-500/30">
          <Hourglass className="w-6 h-6 text-slate-400" />
        </div>
      </div>

      {/* Progress to next reward */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-2">
          <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-primary" />
          </div>
          <span className="text-xs text-muted-foreground">{nextRewardIn} para próxima recompensa!</span>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-secondary border border-border flex items-center justify-center">
          <Package className="w-5 h-5 text-amber-600" />
        </div>
      </div>
    </div>
  );
};

export default AchievementsCard;
