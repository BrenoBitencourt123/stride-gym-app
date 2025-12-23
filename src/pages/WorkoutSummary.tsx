import { Trophy, ArrowRight, CheckCircle, Dumbbell } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef } from "react";
import { 
  getUserWorkout,
  completeTreinoDoDia, 
  getWorkoutSummaryStats, 
  getTreinoProgresso,
  saveExerciseSnapshot,
  saveWorkoutCompleted,
  ExerciseSetSnapshot,
} from "@/lib/storage";
import { markWorkoutCompletedThisWeek } from "@/lib/appState";
import { getWorkoutOfDay } from "@/lib/weekUtils";
import BottomNav from "@/components/BottomNav";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const XP_PER_WORKOUT = 150;

const WorkoutSummary = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
  const defaultWorkoutId = getWorkoutOfDay() || 'upper-a';
  const workoutId = treinoId || defaultWorkoutId;
  const workout = getUserWorkout(workoutId);
  const snapshotSavedRef = useRef(false);
  
  const { completedSets, totalSets, totalVolume } = getWorkoutSummaryStats(workoutId);

  // Salvar snapshots de todos os exercícios ao entrar no resumo
  useEffect(() => {
    if (snapshotSavedRef.current || !workout) return;
    snapshotSavedRef.current = true;
    
    const progresso = getTreinoProgresso();
    const workoutProgress = progresso[workoutId];
    
    if (workoutProgress) {
      for (const exercise of workout.exercicios) {
        const exerciseProgress = workoutProgress[exercise.id];
        if (exerciseProgress && exerciseProgress.workSets.length > 0) {
          // Apenas séries válidas (done = true)
          const completedSetsData: ExerciseSetSnapshot[] = exerciseProgress.workSets
            .filter(s => s.done)
            .map(s => ({ kg: s.kg, reps: s.reps }));
          
          if (completedSetsData.length > 0) {
            saveExerciseSnapshot(
              exercise.id,
              workout.id,
              exercise.repsRange,
              completedSetsData
            );
          }
        }
      }
    }
    
    // Save workout completed record
    saveWorkoutCompleted(workout.id, totalVolume);
    
    // Mark workout as completed this week
    markWorkoutCompletedThisWeek(workout.id, XP_PER_WORKOUT, completedSets, totalVolume);
  }, [workout, workoutId, totalVolume, completedSets]);

  const handleConcluir = () => {
    completeTreinoDoDia(XP_PER_WORKOUT);
    triggerSync(); // Sync after completing workout
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-16 flex flex-col items-center">
        {/* Trophy Icon */}
        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-6">
          <Trophy className="w-12 h-12 text-primary" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Treino concluído!</h1>
        <p className="text-muted-foreground text-center mb-8">
          {workout?.titulo || "Treino"} finalizado com sucesso
        </p>

        {/* Stats Cards */}
        <div className="w-full space-y-4 mb-8">
          {/* XP Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">XP Ganho</p>
              <p className="text-2xl font-bold text-primary">+{XP_PER_WORKOUT} XP</p>
            </div>
          </div>

          {/* Sets Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Séries Completadas</p>
              <p className="text-2xl font-bold text-foreground">
                {completedSets} <span className="text-lg text-muted-foreground font-normal">/ {totalSets}</span>
              </p>
            </div>
          </div>

          {/* Volume Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Volume Total</p>
              <p className="text-2xl font-bold text-foreground">
                {totalVolume.toLocaleString()} <span className="text-lg text-muted-foreground font-normal">kg</span>
              </p>
            </div>
          </div>

          {/* Message Card */}
          <div className="card-glass p-5 text-center">
            <p className="text-lg font-medium text-foreground">Bom trabalho! 💪</p>
            <p className="text-muted-foreground text-sm mt-1">
              Continue assim para alcançar seus objetivos
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleConcluir}
          className="w-full cta-button flex items-center justify-center gap-3"
        >
          <span className="text-lg font-semibold">Concluir</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default WorkoutSummary;
