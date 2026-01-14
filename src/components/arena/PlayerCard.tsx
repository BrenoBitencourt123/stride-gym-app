import { useNavigate } from "react-router-dom";
import { Shield, Trophy, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProgression } from "@/hooks/useProgression";
import { Skeleton } from "@/components/ui/skeleton";

const PlayerCard = () => {
  const navigate = useNavigate();
  const {
    level,
    xp,
    xpGoal,
    xpProgress,
    eloDisplayName,
    eloStyles,
    weekPoints,
    clanId,
    loading,
  } = useProgression();

  if (loading) {
    return (
      <div className="card-glass p-4 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-5 w-24 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-2 w-full rounded-full mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="card-glass p-4 rounded-xl"
      style={{
        borderColor: eloStyles.borderColor,
        borderWidth: "1px",
      }}
    >
      {/* Header with Elo */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: eloStyles.gradient }}
          >
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {eloDisplayName}
            </h3>
            <p className="text-sm text-muted-foreground">
              {weekPoints} pts esta semana
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
            Nv. {level}
          </span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="w-full px-4">
          <div className="flex-1 xp-bar">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${xpProgress}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2 font-medium">
            {xp.toLocaleString('pt-BR')} / {xpGoal.toLocaleString('pt-BR')} XP
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => navigate("/arena/clan")}
        >
          <Users className="w-4 h-4 mr-2" />
          {clanId ? "Meu Clã" : "Entrar em Clã"}
        </Button>
        
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={() => navigate("/arena?tab=ranking")}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Ranking
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => {
            // Copy profile link - TODO: use actual user ID from auth
            const url = window.location.origin + "/arena/profile";
            navigator.clipboard.writeText(url);
          }}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlayerCard;
