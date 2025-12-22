import { Dumbbell, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface ExerciseCardProps {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  slug: string;
  workoutSlug: string;
}

const ExerciseCard = ({ name, sets, reps, rest, slug, workoutSlug }: ExerciseCardProps) => {
  return (
    <div className="card-glass p-4 flex items-center gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-2xl bg-secondary/50 flex items-center justify-center flex-shrink-0">
        <Dumbbell className="w-6 h-6 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base">{name}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">
          {sets} séries × {reps} reps • {rest} descanso
        </p>
      </div>

      {/* Start Button */}
      <Link
        to={`/treino/${workoutSlug}/${slug}`}
        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-colors flex-shrink-0"
      >
        Iniciar
        <Play className="w-3.5 h-3.5 fill-current" />
      </Link>
    </div>
  );
};

export default ExerciseCard;
