import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronDown, MoreVertical, Plus, Timer, Dumbbell, CheckCircle2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import WorkoutMetrics from "@/components/workout/WorkoutMetrics";
import ExerciseSection from "@/components/workout/ExerciseSection";
import SetTypeSelector from "@/components/workout/SetTypeSelector";
import RestTimerModal from "@/components/workout/RestTimerModal";
import {
  getUserWorkout,
  getExerciseProgress,
  saveExerciseProgress,
  SetProgress,
  ExerciseProgress,
  getTreinoHoje,
  saveTreinoHoje,
  getWorkoutSummaryStats,
  clearTreinoProgress,
} from "@/lib/storage";
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
import { toast } from "sonner";

export type SetType = "warmup" | "normal" | "failed" | "drop";

export interface ActiveSet extends SetProgress {
  type: SetType;
  previous?: { kg: number; reps: number };
}

export interface ActiveExercise {
  id: string;
  name: string;
  notes: string;
  restSeconds: number;
  repsRange: string;
  sets: ActiveSet[];
}

const ActiveWorkout = () => {
  const { treinoId } = useParams();
  const navigate = useNavigate();
  
  // Memoize workout to prevent new object reference on every render
  const workout = useMemo(() => {
    if (!treinoId) return null;
    return getUserWorkout(treinoId);
  }, [treinoId]);
  
  // Track if we've already initialized for this workout
  const initializedRef = useRef<string | null>(null);
  
  const [exercises, setExercises] = useState<ActiveExercise[]>([]);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [showSetTypeSelector, setShowSetTypeSelector] = useState(false);
  const [selectedSetInfo, setSelectedSetInfo] = useState<{ exerciseIndex: number; setIndex: number } | null>(null);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(120);

  // Initialize workout - runs only ONCE per treinoId
  useEffect(() => {
    if (!workout || !treinoId) return;
    
    // Prevent re-initialization if already done for this workout
    if (initializedRef.current === treinoId) return;
    initializedRef.current = treinoId;

    const treinoHoje = getTreinoHoje();
    
    // Set start time
    if (treinoHoje?.treinoId === treinoId && treinoHoje.startedAt) {
      setStartTime(new Date(treinoHoje.startedAt));
    } else {
      const now = new Date();
      setStartTime(now);
      saveTreinoHoje({
        treinoId: workout.id,
        startedAt: now.toISOString(),
      });
    }

    // Initialize exercises from workout data and saved progress
    const initialExercises: ActiveExercise[] = workout.exercicios.map((ex) => {
      const savedProgress = getExerciseProgress(treinoId, ex.id);
      
      if (savedProgress) {
        // Convert saved progress to active sets
        const sets: ActiveSet[] = [
          ...savedProgress.feederSets.map((s, i) => ({
            ...s,
            type: "warmup" as SetType,
            previous: ex.feederSetsDefault[i] ? { kg: ex.feederSetsDefault[i].kg, reps: ex.feederSetsDefault[i].reps } : undefined,
          })),
          ...savedProgress.workSets.map((s, i) => ({
            ...s,
            type: "normal" as SetType,
            previous: ex.workSetsDefault[i] ? { kg: ex.workSetsDefault[i].kg, reps: ex.workSetsDefault[i].reps } : undefined,
          })),
        ];
        
        return {
          id: ex.id,
          name: ex.nome,
          notes: "",
          restSeconds: ex.descansoSeg,
          repsRange: ex.repsRange,
          sets: sets.length > 0 ? sets : ex.workSetsDefault.map((s) => ({
            kg: s.kg,
            reps: s.reps,
            done: false,
            type: "normal" as SetType,
          })),
        };
      }

      // Fresh workout - initialize with defaults
      const warmupSets: ActiveSet[] = ex.warmupEnabled && ex.feederSetsDefault.length > 0
        ? ex.feederSetsDefault.map((s) => ({
            kg: s.kg,
            reps: s.reps,
            done: false,
            type: "warmup" as SetType,
          }))
        : [];

      const workSets: ActiveSet[] = ex.workSetsDefault.map((s) => ({
        kg: s.kg,
        reps: s.reps,
        done: false,
        type: "normal" as SetType,
      }));

      return {
        id: ex.id,
        name: ex.nome,
        notes: "",
        restSeconds: ex.descansoSeg,
        repsRange: ex.repsRange,
        sets: [...warmupSets, ...workSets],
      };
    });

    setExercises(initialExercises);
  }, [workout, treinoId]);

  // Timer
  useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedSeconds(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  // Save progress whenever exercises change (debounced to avoid loops)
  useEffect(() => {
    if (!treinoId || exercises.length === 0) return;

    const timeoutId = setTimeout(() => {
      exercises.forEach((ex) => {
        const warmupSets = ex.sets.filter((s) => s.type === "warmup");
        const workSets = ex.sets.filter((s) => s.type !== "warmup");

        const progress: ExerciseProgress = {
          warmupDone: warmupSets.every((s) => s.done),
          feederSets: warmupSets.map((s) => ({ kg: s.kg, reps: s.reps, done: s.done })),
          workSets: workSets.map((s) => ({ kg: s.kg, reps: s.reps, done: s.done })),
          updatedAt: new Date().toISOString(),
        };

        saveExerciseProgress(treinoId, ex.id, progress);
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [treinoId, exercises]);

  // Metrics calculation
  const metrics = useMemo(() => {
    let completedSets = 0;
    let totalSets = 0;
    let totalVolume = 0;

    exercises.forEach((ex) => {
      ex.sets.forEach((set) => {
        if (set.type !== "warmup") {
          totalSets++;
          if (set.done) {
            completedSets++;
            totalVolume += set.kg * set.reps;
          }
        }
      });
    });

    return { completedSets, totalSets, totalVolume };
  }, [exercises]);

  // Handlers - memoized to prevent re-renders
  const handleSetChange = useCallback((exerciseIndex: number, setIndex: number, field: keyof ActiveSet, value: number | boolean | SetType) => {
    setExercises((prev) => {
      const updated = [...prev];
      const exercise = { ...updated[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      
      // If marking as done, start rest timer
      if (field === "done" && value === true) {
        setRestDuration(exercise.restSeconds);
        setShowRestTimer(true);
      }
      
      exercise.sets = sets;
      updated[exerciseIndex] = exercise;
      return updated;
    });
  }, []);

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const exercise = { ...updated[exerciseIndex] };
      const lastSet = exercise.sets[exercise.sets.length - 1];
      
      exercise.sets = [
        ...exercise.sets,
        {
          kg: lastSet?.kg || 0,
          reps: lastSet?.reps || 8,
          done: false,
          type: "normal",
        },
      ];
      
      updated[exerciseIndex] = exercise;
      return updated;
    });
  }, []);

  const handleRemoveSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const updated = [...prev];
      const exercise = { ...updated[exerciseIndex] };
      
      if (exercise.sets.length <= 1) {
        toast.error("Não é possível remover a última série");
        return prev;
      }
      
      exercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
      updated[exerciseIndex] = exercise;
      return updated;
    });
  }, []);

  const handleNotesChange = useCallback((exerciseIndex: number, notes: string) => {
    setExercises((prev) => {
      const updated = [...prev];
      updated[exerciseIndex] = { ...updated[exerciseIndex], notes };
      return updated;
    });
  }, []);

  const handleSetTypeClick = useCallback((exerciseIndex: number, setIndex: number) => {
    setSelectedSetInfo({ exerciseIndex, setIndex });
    setShowSetTypeSelector(true);
  }, []);

  const handleSetTypeSelect = useCallback((type: SetType) => {
    if (selectedSetInfo) {
      handleSetChange(selectedSetInfo.exerciseIndex, selectedSetInfo.setIndex, "type", type);
    }
    setSelectedSetInfo(null);
    setShowSetTypeSelector(false);
  }, [handleSetChange, selectedSetInfo]);

  const handleRemoveFromSelector = useCallback(() => {
    if (selectedSetInfo) {
      handleRemoveSet(selectedSetInfo.exerciseIndex, selectedSetInfo.setIndex);
    }
    setSelectedSetInfo(null);
    setShowSetTypeSelector(false);
  }, [handleRemoveSet, selectedSetInfo]);

  const handleFinish = () => {
    if (metrics.completedSets === 0) {
      toast.error("Complete pelo menos uma série antes de finalizar");
      return;
    }
    setShowFinishDialog(true);
  };

  const confirmFinish = () => {
    navigate(`/treino/${treinoId}/resumo`);
  };

  const handleDiscard = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    if (treinoId) {
      clearTreinoProgress(treinoId);
    }
    navigate("/treino");
  };

  if (!workout) {
    return (
      <div className="min-h-screen bg-background pb-32 flex items-center justify-center">
        <p className="text-muted-foreground">Treino não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Fixed Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={handleDiscard}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown className="w-6 h-6" />
            </button>
            
            <h1 className="text-lg font-semibold text-foreground">Treinamento</h1>
            
            <button
              onClick={handleFinish}
              className="px-4 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Concluir
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Bar */}
      <WorkoutMetrics
        duration={elapsedSeconds}
        volume={metrics.totalVolume}
        completedSets={metrics.completedSets}
        totalSets={metrics.totalSets}
      />

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {exercises.map((exercise, exerciseIndex) => (
          <ExerciseSection
            key={exercise.id}
            exercise={exercise}
            exerciseIndex={exerciseIndex}
            onSetChange={handleSetChange}
            onAddSet={handleAddSet}
            onRemoveSet={handleRemoveSet}
            onNotesChange={handleNotesChange}
            onSetTypeClick={handleSetTypeClick}
          />
        ))}
      </div>

      {/* Set Type Selector */}
      <SetTypeSelector
        open={showSetTypeSelector}
        onOpenChange={setShowSetTypeSelector}
        onSelect={handleSetTypeSelect}
        onRemove={handleRemoveFromSelector}
        currentType={
          selectedSetInfo
            ? exercises[selectedSetInfo.exerciseIndex]?.sets[selectedSetInfo.setIndex]?.type
            : "normal"
        }
        canRemove={
          selectedSetInfo
            ? exercises[selectedSetInfo.exerciseIndex]?.sets.length > 1
            : false
        }
      />

      {/* Rest Timer Modal */}
      <RestTimerModal
        open={showRestTimer}
        onOpenChange={setShowRestTimer}
        duration={restDuration}
      />

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Você completou {metrics.completedSets} de {metrics.totalSets} séries.
              Deseja finalizar o treino agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar treinando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinish}>
              Finalizar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Discard Dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar treino?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem {metrics.completedSets} séries completadas. Deseja descartar todo o progresso?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar treinando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default ActiveWorkout;
