import { ArrowLeft, Award, Flame, Dumbbell, TrendingUp, Scale, Edit2, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AvatarFrame from "@/components/AvatarFrame";
import XPBar from "@/components/XPBar";
import { getProfile, getAchievements, getTotalWorkoutsCompleted, getTotalVolume } from "@/lib/storage";

const Perfil = () => {
  const profile = getProfile();
  const achievements = getAchievements();
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalWorkouts = getTotalWorkoutsCompleted();
  const totalVolume = getTotalVolume();
  
  const stats = [
    { icon: Flame, label: "Streak atual", value: `${profile.streakDias} dias`, color: "text-orange-500" },
    { icon: Dumbbell, label: "Treinos concluídos", value: String(totalWorkouts), color: "text-blue-500" },
    { icon: TrendingUp, label: "Volume total", value: `${(totalVolume / 1000).toFixed(1)}t`, color: "text-green-500" },
    { icon: Award, label: "Conquistas", value: `${unlockedCount}/${achievements.length}`, color: "text-yellow-500" },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Edit2 className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Avatar & Level */}
        <div className="flex flex-col items-center mb-6">
          <AvatarFrame level={profile.level} />
          <h2 className="mt-4 text-xl font-bold text-foreground">Nível {profile.level}</h2>
          <p className="text-sm text-muted-foreground">Atleta Dedicado</p>
        </div>

        {/* XP Bar */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground font-medium">XP para próximo nível</span>
            <span className="text-sm text-muted-foreground">{profile.xpAtual} / {profile.xpMeta}</span>
          </div>
          <XPBar current={profile.xpAtual} max={profile.xpMeta} />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card-glass p-4">
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <Link
            to="/conquistas"
            className="card-glass p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-foreground">Ver todas as conquistas</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          
          <Link
            to="/settings"
            className="card-glass p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-foreground">Histórico de peso</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Perfil;
