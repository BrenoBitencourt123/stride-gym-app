import { Link } from "react-router-dom";
import { Settings, User } from "lucide-react";
import AvatarFrame from "@/components/AvatarFrame";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import GoalsSection from "@/components/GoalsSection";
import StartWorkoutButton from "@/components/StartWorkoutButton";
import AchievementsCard from "@/components/AchievementsCard";
import BottomNav from "@/components/BottomNav";
import { getProfile, getQuests, syncQuestsStatus, getAchievements } from "@/lib/storage";
import { useEffect, useState } from "react";

const Index = () => {
  const [profile, setProfile] = useState(getProfile());
  const [quests, setQuests] = useState(getQuests());
  const [achievements, setAchievements] = useState(getAchievements());

  useEffect(() => {
    // Sync quests status on mount
    syncQuestsStatus();
    setQuests(getQuests());
    setAchievements(getAchievements());
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const nextRewardIn = Math.max(1, 3 - (unlockedCount % 3)); // Every 3 achievements

  const goals = [
    { 
      id: "1", 
      icon: "workout" as const, 
      label: "Fazer treino do dia", 
      xp: 150,
      completed: quests.treinoDoDiaDone,
    },
    { 
      id: "2", 
      icon: "nutrition" as const, 
      label: "Registrar alimentação", 
      xp: 80,
      completed: quests.registrarAlimentacaoDone,
    },
    { 
      id: "3", 
      icon: "weight" as const, 
      label: "Registrar peso (semanal)", 
      xp: 120,
      completed: quests.registrarPesoDone,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Starfield background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-foreground/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Top buttons */}
        <div className="absolute top-6 right-4 flex items-center gap-2">
          <Link 
            to="/perfil"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <User className="w-5 h-5 text-muted-foreground" />
          </Link>
          <Link 
            to="/settings"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Avatar section */}
        <div className="flex flex-col items-center pt-4 pb-6">
          <Link to="/perfil">
            <AvatarFrame level={profile.level} />
          </Link>
          
          {/* Title */}
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            LevelUp <span className="text-muted-foreground font-normal">GYM</span>
          </h1>
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <XPBar current={profile.xpAtual} max={profile.xpMeta} />
        </div>

        {/* Stats Row */}
        <div className="mb-6">
          <StatsRow 
            streak={profile.streakDias} 
            multiplier={profile.multiplier} 
            shields={profile.shields} 
          />
        </div>

        {/* Goals Section */}
        <div className="mb-4">
          <GoalsSection goals={goals} />
        </div>

        {/* Start Workout CTA */}
        <div className="mb-4">
          <StartWorkoutButton />
        </div>

        {/* Achievements Card - now clickable */}
        <Link to="/conquistas" className="block mb-6">
          <AchievementsCard current={unlockedCount} total={totalCount} nextRewardIn={nextRewardIn} />
        </Link>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
