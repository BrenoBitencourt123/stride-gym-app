// src/components/arena/SuggestedAthletesRow.tsx
// Horizontal carousel of suggested athletes to follow - Hevy style

import { Plus, Share2 } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuggestedAthletes } from "@/hooks/useSuggestedAthletes";
import AthleteCard from "./AthleteCard";

interface SuggestedAthletesRowProps {
  className?: string;
}

const SuggestedAthletesRow = ({ className = "" }: SuggestedAthletesRowProps) => {
  const { athletes, loading, followAthlete, hideAthlete, followingStates } = useSuggestedAthletes(15);

  // Show invite fallback if no suggestions available
  const handleShare = async () => {
    const shareUrl = window.location.origin + '/arena';
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LevelUp Gym - Arena',
          text: 'Treine comigo na Arena do LevelUp Gym!',
          url: shareUrl,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  if (!loading && athletes.length === 0) {
    return (
      <div className={`bg-card border border-border rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-semibold text-foreground">
            Atletas Sugeridos
          </h3>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 text-primary text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Convidar amigos
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Ainda não encontramos atletas para sugerir. Convide seus amigos para treinar juntos!
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-card border border-border rounded-xl py-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Atletas Sugeridos
        </h3>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 text-primary text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Convidar amigos
        </button>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex gap-3 px-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[150px] bg-secondary/30 rounded-2xl p-4">
              <div className="flex justify-center mb-3">
                <Skeleton className="w-16 h-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto mb-3" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 px-4 pb-2">
            {athletes.map((athlete) => (
              <AthleteCard
                key={athlete.userId}
                athlete={athlete}
                isFollowing={followingStates[athlete.userId] || false}
                onFollow={() => followAthlete(athlete.userId)}
                onHide={() => hideAthlete(athlete.userId)}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" className="h-2" />
        </ScrollArea>
      )}
    </div>
  );
};

export default SuggestedAthletesRow;
