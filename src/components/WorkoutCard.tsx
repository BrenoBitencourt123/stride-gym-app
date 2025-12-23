import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { 
  getUserWorkout,
  getLastExercisePerformance, 
  getProgressionSuggestion, 
  getLastWorkoutDate,
  formatRelativeDate 
} from "@/lib/storage";

interface WorkoutCardProps {
  title: string;
  exercises: string[];
  slug: string;
}

const WorkoutCard = ({ title, exercises, slug }: WorkoutCardProps) => {
  const workout = getUserWorkout(slug);
  const mainExercise = workout?.exercicios[0];
  
  // Dados do último treino
  const lastWorkoutDate = getLastWorkoutDate(slug);
  const lastPerformance = mainExercise ? getLastExercisePerformance(mainExercise.id) : null;
  const progression = mainExercise ? getProgressionSuggestion(mainExercise.id, mainExercise.repsRange) : null;

  return (
    <Link
      to={`/treino/${slug}`}
      className="w-full card-glass p-5 flex flex-col gap-3 text-left hover:bg-card/80 transition-colors group block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-1">{title}</h3>
          
          {/* Último treino */}
          {lastWorkoutDate && (
            <p className="text-sm text-muted-foreground mb-2">
              Último treino: {formatRelativeDate(lastWorkoutDate)}
            </p>
          )}
          
          {/* Exercício principal com resultado */}
          {mainExercise && (
            <div className="mb-3">
              <p className="text-sm text-foreground">
                {mainExercise.nome}
                {lastPerformance && (
                  <span className="text-muted-foreground">
                    {" — "}{lastPerformance.kg} kg × {lastPerformance.reps}
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Chip de status */}
          {progression && (
            <div className="mb-3">
              <span 
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  progression.status === "ready" 
                    ? "bg-primary/20 text-primary" 
                    : progression.status === "maintain"
                    ? "bg-secondary text-muted-foreground"
                    : "bg-secondary/50 text-muted-foreground"
                }`}
              >
                <span>{progression.statusIcon}</span>
                <span>{progression.statusLabel}</span>
              </span>
            </div>
          )}

          {/* Meta hoje */}
          {progression && (
            <p className="text-xs text-muted-foreground">
              Meta hoje: {progression.metaHoje}
            </p>
          )}
        </div>
        <ChevronRight className="w-6 h-6 text-muted-foreground mt-1 group-hover:text-foreground transition-colors flex-shrink-0" />
      </div>

      {/* Tags de exercícios */}
      <div className="flex flex-wrap gap-2">
        {exercises.map((exercise, index) => (
          <span
            key={index}
            className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium border border-border/50"
          >
            {exercise}
          </span>
        ))}
      </div>
    </Link>
  );
};

export default WorkoutCard;