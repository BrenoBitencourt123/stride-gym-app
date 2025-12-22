import { Dumbbell, Play, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { isExerciseComplete, getExerciseSetProgress } from "@/lib/storage";

interface ExerciseCardProps {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  slug: string;
  workoutSlug: string;
}

const ExerciseCard = ({ name, sets, reps, rest, slug, workoutSlug }: ExerciseCardProps) => {
  const isComplete = isExerciseComplete(workoutSlug, slug);
  const { done, total } = getExerciseSetProgress(workoutSlug, slug);
  const hasProgress = total > 0 && done > 0;

  return (
    <div className="card-glass p-4 flex items-center gap-4">
      {/* Icon */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
        isComplete ? "bg-primary/20" : "bg-secondary/50"
      }`}>
        {isComplete ? (
          <CheckCircle className="w-6 h-6 text-primary" />
        ) : (
          <Dumbbell className="w-6 h-6 text-muted-foreground" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className={`font-semibold text-base ${isComplete ? "text-primary" : "text-foreground"}`}>{name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sets} séries × {reps} reps • {rest} descanso
          {hasProgress && !isComplete && (
            <span className="ml-2 text-primary">({done}/{total})</span>
          )}
        </p>
      </div>

      {/* Start Button */}
      <Link
        to={`/treino/${workoutSlug}/${slug}`}
        className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${
          isComplete 
            ? "bg-primary/10 text-primary/70 hover:bg-primary/20" 
            : "bg-primary/20 text-primary hover:bg-primary/30"
        }`}
      >
        {isComplete ? "Editar" : "Iniciar"}
        <Play className="w-3.5 h-3.5 fill-current" />
      </Link>
    </div>
  );
};

export default ExerciseCard;
