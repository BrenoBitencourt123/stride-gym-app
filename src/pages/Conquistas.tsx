import { ArrowLeft, Award, Flame, Dumbbell, TrendingUp, Target, Calendar, Star, Trophy, Zap, Crown, Medal, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import { getAchievements, type Achievement } from "@/lib/storage";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  flame: Flame,
  dumbbell: Dumbbell,
  trending: TrendingUp,
  target: Target,
  calendar: Calendar,
  star: Star,
  trophy: Trophy,
  zap: Zap,
  crown: Crown,
  medal: Medal,
  shield: Shield,
  award: Award,
};

const Conquistas = () => {
  const achievements = getAchievements();
  
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Conquistas</h1>
            <p className="text-sm text-muted-foreground">{unlockedCount} / {totalCount} desbloqueadas</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground font-medium">Progresso geral</span>
            <span className="text-sm text-muted-foreground">{Math.round((unlockedCount / totalCount) * 100)}%</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all"
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 gap-3">
          {achievements.map((achievement) => {
            const Icon = iconMap[achievement.icon] || Award;
            
            return (
              <div
                key={achievement.id}
                className={`card-glass p-4 flex items-center gap-4 transition-all ${
                  achievement.unlocked 
                    ? "opacity-100" 
                    : "opacity-50 grayscale"
                }`}
              >
                {/* Icon */}
                <div 
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    achievement.unlocked
                      ? `bg-gradient-to-br ${achievement.color} border border-white/10`
                      : "bg-secondary border border-border"
                  }`}
                >
                  <Icon className={`w-6 h-6 ${achievement.unlocked ? "text-white" : "text-muted-foreground"}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground truncate">{achievement.name}</h3>
                    {achievement.unlocked && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">✓</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  
                  {/* Progress bar for locked achievements */}
                  {!achievement.unlocked && achievement.progress !== undefined && achievement.target !== undefined && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="text-foreground">{achievement.progress} / {achievement.target}</span>
                      </div>
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary/50 rounded-full transition-all"
                          style={{ width: `${Math.min((achievement.progress / achievement.target) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* XP reward */}
                <div className="flex-shrink-0 text-right">
                  <span className={`text-sm font-semibold ${achievement.unlocked ? "text-primary" : "text-muted-foreground"}`}>
                    +{achievement.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Conquistas;
