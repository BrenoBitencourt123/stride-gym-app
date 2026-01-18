// src/components/arena/AthleteCard.tsx
// Card component for suggested athlete in horizontal carousel - Hevy style

import { X } from "lucide-react";
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

  const handleHideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHide?.();
  };

  // Get username from athlete data (fallback to displayName slug)
  const username = (athlete as any).username || 
    (athlete as any).usernameLower || 
    athlete.displayName?.toLowerCase().replace(/\s+/g, '_') || 
    'atleta';

  return (
    <div 
      className="relative flex-shrink-0 w-[150px] bg-card border border-border rounded-2xl p-4 cursor-pointer hover:bg-secondary/40 transition-colors"
      onClick={handleCardClick}
    >
      {/* X button to hide */}
      {onHide && (
        <button
          type="button"
          onClick={handleHideClick}
          className="absolute top-2 right-2 p-1 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Avatar - Large circular photo */}
      <div className="flex justify-center mb-3">
        <UserAvatar
          photoURL={athlete.photoURL}
          avatarId={athlete.avatarId}
          displayName={athlete.displayName}
          eloTier={eloTier}
          size="xl"
        />
      </div>

      {/* Username */}
      <p className="text-sm font-semibold text-foreground text-center truncate">
        {username}
      </p>

      {/* Match Reason / Label */}
      <p className="text-xs text-muted-foreground text-center mb-3 truncate">
        {getMatchReasonText(athlete.matchReason)}
      </p>

      {/* Follow Button - Blue style like Hevy */}
      <Button
        size="sm"
        variant={isFollowing ? "secondary" : "default"}
        className={`w-full h-8 text-sm font-medium rounded-lg ${
          isFollowing ? '' : 'bg-primary hover:bg-primary/90'
        }`}
        onClick={handleFollowClick}
        disabled={isFollowing}
      >
        {isFollowing ? 'Seguindo' : 'Seguir'}
      </Button>
    </div>
  );
};

export default AthleteCard;
