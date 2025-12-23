import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useState } from "react";
import ExerciseCard from "@/components/ExerciseCard";
import BottomNav from "@/components/BottomNav";
import { getUserWorkout, saveTreinoHoje, clearTreinoProgress } from "@/lib/storage";
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
  const workout = getUserWorkout(treinoId || "");
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

  const firstExercise = workout.exercicios[0];

  const handleStartWorkout = () => {
    saveTreinoHoje({
      treinoId: workout.id,
      startedAt: new Date().toISOString(),
    });
  };

  const handleResetWorkout = () => {
    if (treinoId) {
      clearTreinoProgress(treinoId);
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <Link
              to="/treino"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">{workout.titulo}</h1>
              <p className="text-sm text-muted-foreground">{workout.exercicios.length} exercícios</p>
            </div>
          </div>
          <button
            onClick={() => setShowResetDialog(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-secondary/50 text-muted-foreground text-sm hover:bg-secondary hover:text-foreground transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>
        </div>

        {/* Exercise List */}
        <div className="space-y-3 mt-6" key={resetKey}>
          {workout.exercicios.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              name={exercise.nome}
              sets={String(exercise.workSetsDefault.length)}
              reps={exercise.repsRange}
              rest={`${Math.floor(exercise.descansoSeg / 60)} min`}
              slug={exercise.id}
              workoutSlug={treinoId || ""}
            />
          ))}
        </div>

        {/* Start Workout CTA */}
        {firstExercise && (
          <Link
            to={`/treino/${treinoId}/${firstExercise.id}`}
            onClick={handleStartWorkout}
            className="w-full mt-6 cta-button flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Iniciar treino
          </Link>
        )}
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
