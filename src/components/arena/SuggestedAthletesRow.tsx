// src/components/arena/SuggestedAthletesRow.tsx
// Horizontal carousel of suggested athletes to follow

import { ChevronRight, Users } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useSuggestedAthletes } from "@/hooks/useSuggestedAthletes";
import AthleteCard from "./AthleteCard";

interface SuggestedAthletesRowProps {
  className?: string;
}

const SuggestedAthletesRow = ({ className = "" }: SuggestedAthletesRowProps) => {
  const { athletes, loading, followAthlete, hideAthlete, followingStates } = useSuggestedAthletes(15);

  // Don't show if no suggestions
  if (!loading && athletes.length === 0) {
    return null;
  }

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">
            Atletas Sugeridos
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Deslize para ver mais
        </span>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] card-glass rounded-xl p-3">
              <div className="flex justify-center mb-2">
                <Skeleton className="w-12 h-12 rounded-full" />
              </div>
              <Skeleton className="h-4 w-20 mx-auto mb-2" />
              <Skeleton className="h-3 w-16 mx-auto mb-2" />
              <Skeleton className="h-7 w-full" />
            </div>
          ))}
        </div>
      ) : (
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-3 pb-3">
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
