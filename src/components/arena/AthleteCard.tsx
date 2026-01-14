// src/components/arena/AthleteCard.tsx
// Card component for suggested athlete in horizontal carousel

import { UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SuggestedAthlete } from "@/lib/arena/followRepo";
import { getEloFrameStyles, EloTier } from "@/lib/arena/eloUtils";
import UserAvatar from "./UserAvatar";
import { useNavigate } from "react-router-dom";

interface AthleteCardProps {
  athlete: SuggestedAthlete;
  isFollowing: boolean;
  onFollow: () => void;
  onHide?: () => void;
}

const AthleteCard = ({ athlete, isFollowing, onFollow, onHide }: AthleteCardProps) => {
  const navigate = useNavigate();
  const eloTier = (athlete.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);

  const getMatchReasonText = (reason: string): string => {
    switch (reason) {
      case 'same_elo':
        return 'Mesmo nível';
      case 'schedule_overlap':
        return 'Treina nos mesmos dias';
      case 'active':
      default:
        return 'Em destaque';
    }
  };

  const handleCardClick = () => {
    navigate(`/arena/profile/${athlete.userId}`);
  };

  const handleFollowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFollow();
  };

  return (
    <div 
      className="flex-shrink-0 w-[140px] card-glass rounded-xl p-3 cursor-pointer hover:bg-secondary/60 transition-colors"
      onClick={handleCardClick}
    >
      {/* Avatar */}
      <div className="flex justify-center mb-2">
        <UserAvatar
          photoURL={athlete.photoURL}
          avatarId={athlete.avatarId}
          displayName={athlete.displayName}
          eloTier={eloTier}
          size="lg"
        />
      </div>

      {/* Name */}
      <p className="text-sm font-semibold text-foreground text-center truncate mb-1">
        {athlete.displayName}
      </p>

      {/* Elo Badge */}
      <div className="flex justify-center mb-2">
        <span 
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ 
            background: eloStyles.gradient,
            color: 'white',
          }}
        >
          {eloTier.charAt(0).toUpperCase() + eloTier.slice(1)}
        </span>
      </div>

      {/* Match Reason */}
      <p className="text-[10px] text-muted-foreground text-center mb-3 truncate">
        {getMatchReasonText(athlete.matchReason)}
      </p>

      {/* Follow Button */}
      <Button
        size="sm"
        variant={isFollowing ? "secondary" : "default"}
        className="w-full h-7 text-xs"
        onClick={handleFollowClick}
        disabled={isFollowing}
      >
        {isFollowing ? (
          <>
            <Check className="w-3 h-3 mr-1" />
            Seguindo
          </>
        ) : (
          <>
            <UserPlus className="w-3 h-3 mr-1" />
            Seguir
          </>
        )}
      </Button>
    </div>
  );
};

export default AthleteCard;
