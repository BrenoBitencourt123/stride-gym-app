import { ArrowLeft, Play, RotateCcw, Clock, Dumbbell } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import BottomNav from "@/components/BottomNav";
import { useWorkoutPlan } from "@/contexts/AppStateContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const WorkoutDetail = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const { plan, treinoHoje, treinoProgresso, updateTreinoHoje, updateTreinoProgresso } = useWorkoutPlan();
  const workout = plan?.workouts.find(w => w.id === (treinoId || "")) || null;
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  
  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  const hasActiveWorkout = treinoHoje && !treinoHoje.completedAt && treinoHoje.treinoId === treinoId;

  const handleStartWorkout = () => {
    updateTreinoHoje({
      treinoId: workout.id,
      startedAt: new Date().toISOString(),
    });
    navigate(`/treino/${treinoId}/ativo`);
  };

  const handleResumeWorkout = () => {
    navigate(`/treino/${treinoId}/ativo`);
  };

  const handleResetWorkout = () => {
    if (treinoId) {
      const updated = { ...(treinoProgresso || {}) };
      if (updated[treinoId]) {
        delete updated[treinoId];
      }
      updateTreinoProgresso(updated);
      setResetKey(prev => prev + 1);
    }
    setShowResetDialog(false);
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/treino"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workout.titulo}</h1>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Dumbbell className="w-4 h-4" />
                  {workout.exercicios.length} exercícios
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  ~{workout.duracaoEstimada} min
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowResetDialog(true)}
            className="p-2 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* Exercise List */}
        <div className="space-y-2" key={resetKey}>
          {workout.exercicios.map((exercise, index) => (
            <div
              key={exercise.id}
              className="card-glass p-4 flex items-center gap-4"
            >
              {/* Index number */}
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-foreground">{index + 1}</span>
              </div>

              {/* Exercise info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">{exercise.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  {exercise.workSetsDefault.length} séries • {exercise.repsRange} reps
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {exercise.tags.slice(0, 1).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Start/Resume Workout CTA */}
        <div className="mt-6">
          {hasActiveWorkout ? (
            <button
              onClick={handleResumeWorkout}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              Retomar treino
            </button>
          ) : (
            <button
              onClick={handleStartWorkout}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
            >
              <Play className="w-5 h-5 fill-current" />
              Iniciar treino
            </button>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reiniciar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza? Isso apagará todas as séries registradas deste treino. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetWorkout}>
              Reiniciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default WorkoutDetail;
