import { useNavigate } from "react-router-dom";
import { Shield, Trophy, Users, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProfile } from "@/lib/storage";
import { getArenaProfile, getUserClan } from "@/lib/arena/arenaStorage";
import { getEloDisplayName, getEloFrameStyles, EloTier } from "@/lib/arena/eloUtils";

const PlayerCard = () => {
  const navigate = useNavigate();
  const profile = getProfile();
  const arenaProfile = getArenaProfile();
  const userClan = getUserClan();
  
  const eloTier = arenaProfile?.elo?.tier || "iron";
  const eloDivision = arenaProfile?.elo?.division || 4;
  const weeklyPoints = arenaProfile?.weeklyPoints || 0;
  const eloStyles = getEloFrameStyles(eloTier as EloTier);

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
              {getEloDisplayName(eloTier as EloTier, eloDivision)}
            </h3>
            <p className="text-sm text-muted-foreground">
              {weeklyPoints} pts esta semana
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground px-2 py-1 bg-secondary rounded-full">
            Nv. {profile.level}
          </span>
        </div>
      </div>

      {/* XP Bar */}
      <div className="mb-4">
        <div className="w-full px-4">
          <div className="flex-1 xp-bar">
            <div 
              className="xp-bar-fill" 
              style={{ width: `${(profile.xpAtual / profile.xpMeta) * 100}%` }}
            />
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2 font-medium">
            {profile.xpAtual.toLocaleString('pt-BR')} / {profile.xpMeta.toLocaleString('pt-BR')} XP
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
          {userClan ? "Meu Clã" : "Entrar em Clã"}
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
            navigator.clipboard.writeText(window.location.origin + "/arena/profile/" + arenaProfile?.userId);
          }}
        >
          <Share2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default PlayerCard;
