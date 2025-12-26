import { Timer, Dumbbell, CheckCircle2 } from "lucide-react";

interface WorkoutMetricsProps {
  duration: number;
  volume: number;
  completedSets: number;
  totalSets: number;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatVolume(kg: number): string {
  if (kg >= 1000) {
    return `${(kg / 1000).toFixed(1)}t`;
  }
  return `${kg} kg`;
}

const WorkoutMetrics = ({ duration, volume, completedSets, totalSets }: WorkoutMetricsProps) => {
  return (
    <div className="bg-card/50 border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Duration */}
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{formatDuration(duration)}</span>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{formatVolume(volume)}</span>
          </div>

          {/* Sets */}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {completedSets}/{totalSets}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutMetrics;
