import { Trophy, ArrowRight, CheckCircle, Dumbbell, Share2 } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useRef, useState, useMemo } from "react";
import type { ExerciseSetSnapshot } from "@/lib/appState";
import { getWeekStart, getWorkoutOfDay } from "@/lib/weekUtils";
import BottomNav from "@/components/BottomNav";
import WorkoutCompleteShareModal from "@/components/arena/WorkoutCompleteShareModal";
import { WorkoutSnapshot } from "@/lib/arena/types";
import { useProgression } from "@/hooks/useProgression";
import { useAppStateContext, useWorkoutPlan } from "@/contexts/AppStateContext";

const XP_PER_WORKOUT = 150;

const WorkoutSummary = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  const { completeWorkout } = useProgression();
  const { state, updateState } = useAppStateContext();
  const { plan, treinoProgresso } = useWorkoutPlan();
  
  const defaultWorkoutId = getWorkoutOfDay(new Date(), plan || undefined) || 'upper-a';
  const workoutId = treinoId || defaultWorkoutId;
  
  // Get workout from Firebase plan
  const workout = useMemo(() => {
    if (!plan?.workouts) return null;
    return plan.workouts.find(w => w.id === workoutId) || null;
  }, [plan, workoutId]);
  
  const rewardsAppliedRef = useRef(false);
  const snapshotSavedRef = useRef(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [workoutSnapshotData, setWorkoutSnapshotData] = useState<WorkoutSnapshot | null>(null);
  const [rewardsResult, setRewardsResult] = useState<{ xpGained: number; eloGained: number } | null>(null);
  
  // Calculate stats from Firebase treinoProgresso
  const { totalPlannedSets, completedSets, totalVolume, exercisesDone } = useMemo(() => {
    if (!workout || !treinoProgresso) {
      return { totalPlannedSets: 0, completedSets: 0, totalVolume: 0, exercisesDone: 0 };
    }
    
    const workoutProgress = treinoProgresso[workoutId] || {};
    let planned = 0;
    let completed = 0;
    let volume = 0;
    let exDone = 0;
    
    for (const ex of workout.exercicios) {
      // Séries planejadas = padrão do exercício (workSetsDefault.length) ou 3 como fallback
      planned += ex.workSetsDefault?.length || 3;
      
      const exProgress = workoutProgress[ex.id];
      if (!exProgress) continue;
      
      const doneSets = exProgress.workSets.filter(s => s.done);
      completed += doneSets.length;
      
      for (const set of doneSets) {
        volume += set.kg * set.reps;
      }
      
      if (doneSets.length > 0) exDone++;
    }
    
    return { totalPlannedSets: planned, completedSets: completed, totalVolume: volume, exercisesDone: exDone };
  }, [workout, treinoProgresso, workoutId]);

  // Apply Firestore-based rewards (idempotent)
  useEffect(() => {
    if (rewardsAppliedRef.current) return;
    rewardsAppliedRef.current = true;
    
    const applyRewards = async () => {
      try {
        const result = await completeWorkout();
        if (result) {
          setRewardsResult({
            xpGained: result.xpGained,
            eloGained: result.eloGained,
          });
          console.log('[WorkoutSummary] Rewards applied:', result);
        }
      } catch (error) {
        console.error('[WorkoutSummary] Error applying rewards:', error);
        // Fallback to showing default XP
        setRewardsResult({ xpGained: XP_PER_WORKOUT, eloGained: 0 });
      }
    };
    
    applyRewards();
  }, [completeWorkout]);

  // Salvar snapshots de todos os exercícios ao entrar no resumo
  // Only run when we have actual data (completedSets > 0 or after a small delay)
  useEffect(() => {
    if (snapshotSavedRef.current || !workout || !state) return;
    
    const workoutProgress = treinoProgresso?.[workoutId] || {};
    
    // Check if we actually have progress data
    const hasProgress = Object.keys(workoutProgress).length > 0;
    
    // If no progress yet, wait for Firebase sync
    if (!hasProgress && !treinoProgresso) {
      console.log('[WorkoutSummary] Waiting for progress data...');
      return;
    }
    
    snapshotSavedRef.current = true;
    
    const exerciseSnapshots: WorkoutSnapshot['exercises'] = [];
    let snapshotTotalSets = 0;
    let snapshotTotalVolume = 0;
    let totalReps = 0;
    
    const updatedExerciseHistory = { ...(state.exerciseHistory || {}) };
    
    for (const exercise of workout.exercicios) {
      const exerciseProgress = workoutProgress[exercise.id];
      if (exerciseProgress) {
        // Salvar séries de aquecimento/preparação (feederSets) - mesmo que não estejam "done"
        const warmupSetsData: ExerciseSetSnapshot[] = exerciseProgress.feederSets
          .map(s => ({ kg: s.kg, reps: s.reps }));
        
        // Salvar séries de trabalho válidas (done = true)
        const completedSetsData: ExerciseSetSnapshot[] = exerciseProgress.workSets
          .filter(s => s.done)
          .map(s => ({ kg: s.kg, reps: s.reps }));
        
        // Salvar snapshot com todos os tipos de séries
        if (completedSetsData.length > 0 || warmupSetsData.length > 0) {
          const snapshotEntry = {
            exerciseId: exercise.id,
            workoutId: workout.id,
            repsRange: exercise.repsRange,
            workSets: completedSetsData.length > 0
              ? completedSetsData
              : exerciseProgress.workSets.map(s => ({ kg: s.kg, reps: s.reps })),
            warmupSets: warmupSetsData.length > 0 ? warmupSetsData : undefined,
            feederSets: undefined as ExerciseSetSnapshot[] | undefined,
            timestamp: new Date().toISOString(),
          };
          
          const existing = updatedExerciseHistory[exercise.id] || [];
          const nextHistory = [...existing, snapshotEntry].slice(-100);
          updatedExerciseHistory[exercise.id] = nextHistory;
          
          if (completedSetsData.length > 0) {
            exerciseSnapshots.push({
              exerciseId: exercise.id,
              exerciseName: exercise.nome,
              sets: completedSetsData.map(s => ({ kg: s.kg, reps: s.reps })),
            });
            
            snapshotTotalSets += completedSetsData.length;
            snapshotTotalVolume += completedSetsData.reduce((sum, s) => sum + (s.kg * s.reps), 0);
            totalReps += completedSetsData.reduce((sum, s) => sum + s.reps, 0);
          }
        }
      }
    }
    
    console.log('[WorkoutSummary] Creating snapshot with', snapshotTotalSets, 'sets,', snapshotTotalVolume, 'kg');
    
    // Create workout snapshot for sharing
    const snapshot: WorkoutSnapshot = {
      workoutId: workout.id,
      workoutTitle: workout.titulo,
      duration: 45 * 60, // Default 45 min in seconds
      totalSets: snapshotTotalSets,
      totalReps,
      totalVolume: snapshotTotalVolume,
      prsCount: 0,
      exercises: exerciseSnapshots,
    };
    setWorkoutSnapshotData(snapshot);
    
    const nowIso = new Date().toISOString();
    const updatedWorkoutHistory = [
      ...(state.workoutHistory || []),
      { workoutId: workout.id, timestamp: nowIso, totalVolume: snapshotTotalVolume },
    ];
    
    const weekStart = getWeekStart(new Date());
    const completion = {
      completedAt: nowIso,
      xpGained: XP_PER_WORKOUT,
      setsCompleted: snapshotTotalSets,
      totalVolume: snapshotTotalVolume,
    };
    
    const updatedWeeklyCompletions = {
      ...(state.weeklyCompletions || {}),
      [weekStart]: {
        ...(state.weeklyCompletions?.[weekStart] || {}),
        [workout.id]: completion,
      },
    };
    
    updateState({
      exerciseHistory: updatedExerciseHistory,
      workoutHistory: updatedWorkoutHistory,
      weeklyCompletions: updatedWeeklyCompletions,
      treinoHoje: state.treinoHoje ? { ...state.treinoHoje, completedAt: completion.completedAt } : null,
    });
    
    // Show share modal automatically
    setTimeout(() => setShowShareModal(true), 500);
  }, [workout, workoutId, treinoProgresso, state, updateState]);

  const handleConcluir = async () => {
    if (state) {
      const todayKey = new Date().toISOString().split('T')[0];
      const quests = {
        ...state.quests,
        treinoDoDiaDone: true,
        questsDate: state.quests?.questsDate || todayKey,
      };
      await updateState({ quests, treinoHoje: null });
    }
    navigate("/");
  };

  // Determine XP to show (from Firestore result or default)
  const displayXp = rewardsResult?.xpGained ?? XP_PER_WORKOUT;
  const displayElo = rewardsResult?.eloGained ?? 0;

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
              <p className="text-2xl font-bold text-primary">+{displayXp} XP</p>
            </div>
          </div>

          {/* Elo Card (only show if gained) */}
          {displayElo > 0 && (
            <div className="card-glass p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-muted-foreground text-sm">Elo Arena</p>
                <p className="text-2xl font-bold text-amber-500">+{displayElo} pts</p>
              </div>
            </div>
          )}

          {/* Sets Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Séries Completadas</p>
              <p className="text-2xl font-bold text-foreground">
                {completedSets}/{totalPlannedSets}
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
                {Math.round(totalVolume)} kg
              </p>
            </div>
          </div>

          {/* Exercises Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Exercícios Feitos</p>
              <p className="text-2xl font-bold text-foreground">
                {exercisesDone}/{workout?.exercicios.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Encouragement */}
        <div className="text-center mb-8">
          <p className="text-muted-foreground">
            Continue assim para alcançar seus objetivos
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          <button
            onClick={() => setShowShareModal(true)}
            className="w-full py-4 bg-secondary/50 text-foreground rounded-xl font-medium hover:bg-secondary transition-colors flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Compartilhar conquista
          </button>
          <button
            onClick={handleConcluir}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            Concluir
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {workoutSnapshotData && (
        <WorkoutCompleteShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          workoutSnapshot={workoutSnapshotData}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default WorkoutSummary;
