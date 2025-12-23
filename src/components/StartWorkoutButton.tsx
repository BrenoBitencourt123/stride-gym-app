import { Play, CheckCircle, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { getWorkoutOfDay, isRestDay } from "@/lib/weekUtils";
import { isWorkoutCompletedThisWeek } from "@/lib/appState";
import { saveTreinoHoje, getUserWorkout } from "@/lib/storage";

const StartWorkoutButton = () => {
  const navigate = useNavigate();
  const workoutIdOfDay = getWorkoutOfDay();
  const isRest = isRestDay();
  const isCompletedThisWeek = workoutIdOfDay ? isWorkoutCompletedThisWeek(workoutIdOfDay) : false;
  const workout = workoutIdOfDay ? getUserWorkout(workoutIdOfDay) : null;

  const handleClick = () => {
    if (isRest) {
      navigate('/descanso');
      return;
    }

    if (workoutIdOfDay) {
      // Registra início do treino
      saveTreinoHoje({
        treinoId: workoutIdOfDay,
        startedAt: new Date().toISOString(),
      });
      navigate(`/treino/${workoutIdOfDay}`);
    }
  };

  // Dia de descanso
  if (isRest) {
    return (
      <button
        onClick={handleClick}
        className="cta-button group bg-secondary hover:bg-secondary/80"
      >
        <div className="w-8 h-8 rounded-lg bg-muted/20 flex items-center justify-center group-hover:bg-muted/30 transition-colors">
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <span className="text-foreground">Hoje é dia de descanso</span>
      </button>
    );
  }

  // Treino concluído
  if (isCompletedThisWeek) {
    return (
      <div className="space-y-2">
        <div className="cta-button group bg-primary/20 cursor-default">
          <div className="w-8 h-8 rounded-lg bg-primary/30 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-primary" />
          </div>
          <span className="text-foreground">
            {workout?.titulo || 'Treino'} concluído ✅
          </span>
        </div>
        <div className="flex gap-2">
          <Link
            to="/treino"
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 text-center text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Ver plano
          </Link>
          <button
            onClick={handleClick}
            className="flex-1 px-4 py-3 rounded-xl bg-secondary/50 text-center text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors"
          >
            Treinar novamente
          </button>
        </div>
      </div>
    );
  }

  // Treino normal
  return (
    <button
      onClick={handleClick}
      className="cta-button group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
        <Play className="w-4 h-4 text-primary fill-primary" />
      </div>
      <span className="text-foreground">
        Iniciar {workout?.titulo || 'treino de hoje'}
      </span>
    </button>
  );
};

export default StartWorkoutButton;
