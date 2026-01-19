import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAppStateContext, useWorkoutPlan } from "@/contexts/AppStateContext";
import { formatRelativeDate } from "@/lib/storage";

interface WorkoutCardProps {
  title: string;
  exercises: string[];
  slug: string;
}

const WorkoutCard = ({ title, exercises, slug }: WorkoutCardProps) => {
  const { state } = useAppStateContext();
  const { plan } = useWorkoutPlan();
  const workout = plan?.workouts.find(w => w.id === slug) || null;
  const mainExercise = workout?.exercicios[0];
  const exerciseHistory = state?.exerciseHistory || {};
  const workoutHistory = state?.workoutHistory || [];

  // Dados do último treino
  const lastWorkoutDate = (() => {
    const entries = workoutHistory.filter((w) => w.workoutId === slug);
    if (entries.length === 0) return null;
    const latest = entries.reduce((best, current) => {
      return new Date(current.timestamp) > new Date(best.timestamp) ? current : best;
    }, entries[0]);
    return latest.timestamp;
  })();

  const lastPerformance = (() => {
    if (!mainExercise) return null;
    const history = exerciseHistory[mainExercise.id];
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  })();

  const progression = (() => {
    if (!mainExercise || !lastPerformance || !lastPerformance.workSets?.length) return null;
    const firstSet = lastPerformance.workSets[0];
    const [minReps, maxReps] = mainExercise.repsRange
      .split(/[^0-9]+/)
      .filter(Boolean)
      .map((s) => parseInt(s.trim(), 10));

    if (firstSet.reps >= maxReps) {
      const nextKg = firstSet.kg + 2.5;
      return {
        status: "ready" as const,
        statusIcon: "🔥",
        statusLabel: "Pronto para subir",
        metaHoje: `${nextKg} kg × ${minReps}+`,
      };
    }

    return {
      status: "maintain" as const,
      statusIcon: "💪",
      statusLabel: "Manter carga",
      metaHoje: `${firstSet.kg} kg × ${firstSet.reps + 1}+`,
    };
  })();

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
                {lastPerformance && lastPerformance.workSets?.[0] && (
                  <span className="text-muted-foreground">
                    {" — "}{lastPerformance.workSets[0].kg} kg × {lastPerformance.workSets[0].reps}
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
