import { Link } from "react-router-dom";
import { Settings } from "lucide-react";
import AvatarFrame from "@/components/AvatarFrame";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import GoalsSection from "@/components/GoalsSection";
import StartWorkoutButton from "@/components/StartWorkoutButton";
import AchievementsCard from "@/components/AchievementsCard";
import BottomNav from "@/components/BottomNav";

const mockGoals = [
  { id: "1", icon: "workout" as const, label: "Fazer treino do dia", xp: 150 },
  { id: "2", icon: "nutrition" as const, label: "Registrar alimentação", xp: 80 },
  { id: "3", icon: "weight" as const, label: "Registrar peso (semanal)", xp: 120 },
];

const Index = () => {
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
        {/* Settings button */}
        <Link 
          to="/settings"
          className="absolute top-6 right-4 w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Link>

        {/* Avatar section */}
        <div className="flex flex-col items-center pt-4 pb-6">
          <AvatarFrame level={12} />
          
          {/* Title */}
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            LevelUp <span className="text-muted-foreground font-normal">GYM</span>
          </h1>
        </div>

        {/* XP Bar */}
        <div className="mb-6">
          <XPBar current={1240} max={1500} />
        </div>

        {/* Stats Row */}
        <div className="mb-6">
          <StatsRow streak={6} multiplier={1.2} shields={2} />
        </div>

        {/* Goals Section */}
        <div className="mb-4">
          <GoalsSection goals={mockGoals} />
        </div>

        {/* Start Workout CTA */}
        <div className="mb-4">
          <StartWorkoutButton />
        </div>

        {/* Achievements Card */}
        <div className="mb-6">
          <AchievementsCard current={103} total={134} nextRewardIn={6} />
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
