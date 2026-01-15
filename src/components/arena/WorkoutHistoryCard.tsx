// src/components/arena/WorkoutHistoryCard.tsx
// Compact card for workout history display

import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dumbbell, Clock, Weight } from "lucide-react";

interface WorkoutHistoryItem {
  id: string;
  title: string;
  completedAt: string;
  duration: number; // seconds
  setsCount: number;
  volume: number; // kg
}

interface WorkoutHistoryCardProps {
  workout: WorkoutHistoryItem;
  onClick?: () => void;
}

const WorkoutHistoryCard = ({ workout, onClick }: WorkoutHistoryCardProps) => {
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  };

  const formatVolume = (kg: number): string => {
    if (kg >= 1000) {
      return `${(kg / 1000).toFixed(1)}t`;
    }
    return `${kg}kg`;
  };

  const timeAgo = formatDistanceToNow(new Date(workout.completedAt), {
    addSuffix: true,
    locale: ptBR,
  });

  return (
    <div 
      className="card-glass rounded-xl p-4 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Dumbbell className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">{workout.title}</h4>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{formatDuration(workout.duration)}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-medium">{workout.setsCount}</span>
          <span>séries</span>
        </div>
        <div className="flex items-center gap-1">
          <Weight className="w-3 h-3" />
          <span>{formatVolume(workout.volume)}</span>
        </div>
      </div>
    </div>
  );
};

export default WorkoutHistoryCard;
