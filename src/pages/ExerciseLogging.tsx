import { ArrowLeft, Check, Play, Plus, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SetRow from "@/components/SetRow";
import { 
  getUserWorkout,
  getUserExercise,
  getUserNextExercise,
  isUserLastExercise,
  getExerciseProgress, 
  saveExerciseProgress, 
  SetProgress,
  ExerciseProgress,
  getLastExercisePerformance,
  getProgressionSuggestion,
  getProgressionSuggestions,
  saveProgressionSuggestion,
  ProgressionSuggestion,
} from "@/lib/storage";
import { toast } from "sonner";

const ExerciseLogging = () => {
  const { treinoId, exercicioId } = useParams();
  const navigate = useNavigate();
  
  const workout = getUserWorkout(treinoId || "");
  const exercise = getUserExercise(treinoId || "", exercicioId || "");
  
  // State
  const [warmupDone, setWarmupDone] = useState(false);
  const [feederSets, setFeederSets] = useState<SetProgress[]>([]);
  const [workSets, setWorkSets] = useState<SetProgress[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Initialize from storage or defaults, with suggested load support
  useEffect(() => {
    if (!exercise) return;
    
    const savedProgress = getExerciseProgress(treinoId || "", exercicioId || "");
    
    if (savedProgress) {
      setWarmupDone(savedProgress.warmupDone);
      setFeederSets(savedProgress.feederSets);
      setWorkSets(savedProgress.workSets);
    } else {
      // Check for suggested load from previous session
      const suggestions = getProgressionSuggestions();
      const suggestion = suggestions[exercicioId || ""];
      const suggestedLoad = suggestion?.suggestedNextLoad;
      
      // Use defaults from workout data, applying suggested load if available
      setWarmupDone(false);
      setFeederSets(
        exercise.feederSetsDefault.map(s => ({ ...s, done: false }))
      );
      setWorkSets(
        exercise.workSetsDefault.map(s => ({
          ...s,
          kg: suggestedLoad || s.kg, // Apply suggested load if available
          done: false,
        }))
      );
    }
  }, [treinoId, exercicioId, exercise]);

  // Save progress whenever state changes
  const saveProgress = useCallback(() => {
    if (!treinoId || !exercicioId) return;
    
    const progress: ExerciseProgress = {
      warmupDone,
      feederSets,
      workSets,
      updatedAt: new Date().toISOString(),
    };
    
    saveExerciseProgress(treinoId, exercicioId, progress);
  }, [treinoId, exercicioId, warmupDone, feederSets, workSets]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Check for suggestion banner
  useEffect(() => {
    if (!exercise) return;
    
    // Parse reps range to get upper limit
    const repsRangeMatch = exercise.repsRange.match(/(\d+)–(\d+)/);
    if (!repsRangeMatch) return;
    
    const upperLimit = parseInt(repsRangeMatch[2]);
    
    // Check if all work sets are done and at or above upper limit
    const allDoneAtLimit = workSets.length > 0 && 
      workSets.every(s => s.done && s.reps >= upperLimit);
    
    setShowSuggestion(allDoneAtLimit);
  }, [workSets, exercise]);

  // Handlers for feeder sets
  const updateFeederSet = (index: number, field: keyof SetProgress, value: number | boolean) => {
    setFeederSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Handlers for work sets
  const updateWorkSet = (index: number, field: keyof SetProgress, value: number | boolean) => {
    setWorkSets(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddSet = () => {
    const lastSet = workSets[workSets.length - 1];
    const newSet: SetProgress = {
      kg: lastSet?.kg || 0,
      reps: lastSet?.reps || 8,
      done: false,
    };
    setWorkSets(prev => [...prev, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    if (workSets.length <= 1) {
      toast.error("Não é possível remover a última série");
      return;
    }
    
    const removedSet = workSets[index];
    setWorkSets(prev => prev.filter((_, i) => i !== index));
    
    toast("Série removida", {
      action: {
        label: "Desfazer",
        onClick: () => {
          setWorkSets(prev => {
            const newSets = [...prev];
            newSets.splice(index, 0, removedSet);
            return newSets;
          });
        },
      },
      duration: 3000,
    });
  };

  // Navigation
  const handleNextExercise = () => {
    if (!treinoId || !exercicioId) return;
    
    if (isUserLastExercise(treinoId, exercicioId)) {
      navigate(`/treino/${treinoId}/resumo`);
    } else {
      const nextExercise = getUserNextExercise(treinoId, exercicioId);
      if (nextExercise) {
        navigate(`/treino/${treinoId}/${nextExercise.id}`);
      }
    }
  };

  const isLast = isUserLastExercise(treinoId || "", exercicioId || "");
  const restTime = exercise ? `${Math.floor(exercise.descansoSeg / 60)} min` : "2 min";

  if (!exercise || !workout) {
    return (
      <div className="min-h-screen bg-background pb-40 flex items-center justify-center">
        <p className="text-muted-foreground">Exercício não encontrado</p>
        <BottomNav />
      </div>
    );
  }

  // Dados de progressão
  const lastPerformance = getLastExercisePerformance(exercicioId || "");
  const progression = getProgressionSuggestion(exercicioId || "", exercise.repsRange);

  const handleApplySuggestion = () => {
    if (progression.suggestedNextLoad) {
      saveProgressionSuggestion(exercicioId || "", progression.suggestedNextLoad);
      toast.success(`Sugestão salva: ${progression.suggestedNextLoad} kg`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/treino/${treinoId}`}
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{exercise.nome}</h1>
          </div>
          <button className="text-primary text-sm font-medium hover:underline">
            Por quê?
          </button>
        </div>

        {/* Progression Card */}
        <div className="card-glass p-4 mb-4">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              {/* Último treino */}
              <p className="text-sm text-muted-foreground mb-1">
                Último treino:{" "}
                {lastPerformance ? (
                  <span className="text-foreground font-medium">
                    {lastPerformance.kg} kg × {lastPerformance.reps}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </p>
              
              {/* Meta hoje */}
              <p className="text-sm text-muted-foreground">
                Meta hoje: <span className="text-foreground">{progression.metaHoje}</span>
              </p>
            </div>
            
            {/* Status chip */}
            <span 
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
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
          
          {/* Sugestão dinâmica */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
            <p className="text-xs text-muted-foreground">{progression.message}</p>
            {progression.status === "ready" && progression.suggestedNextLoad && (
              <button
                onClick={handleApplySuggestion}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
              >
                <Sparkles className="w-3 h-3" />
                Aplicar
              </button>
            )}
          </div>
        </div>

        {/* Warmup Card */}
        {exercise.warmupEnabled && (
          <div className="card-glass p-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">
              Série de Aquecimento
            </h2>
            <button
              onClick={() => setWarmupDone(!warmupDone)}
              className="flex items-center gap-2"
            >
              <div
                className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                  warmupDone
                    ? "bg-primary/20 border border-primary/40"
                    : "bg-secondary/50 border border-border/40"
                }`}
              >
                {warmupDone && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
              <span className="text-muted-foreground text-sm">
                <span className={warmupDone ? "text-foreground" : ""}>Aquecimento</span>{" "}
                Finalizado
              </span>
            </button>
          </div>
        )}

        {/* Feeder Set Card */}
        {feederSets.length > 0 && (
          <div className="card-glass p-4 mb-4">
            <h2 className="text-lg font-semibold text-foreground mb-3">Série Feeder</h2>

            {/* Table Header */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
              <div className="w-8">Conj.</div>
              <div className="w-8"></div>
              <div className="w-16 text-center">Kg</div>
              <div className="w-14 text-center">Reps</div>
              <div className="flex-1">Descanso</div>
            </div>

            {/* Feeder Rows */}
            {feederSets.map((set, index) => (
              <SetRow
                key={index}
                setNumber={index + 1}
                kg={set.kg}
                reps={set.reps}
                rest={restTime}
                done={set.done}
                onKgChange={(kg) => updateFeederSet(index, "kg", kg)}
                onRepsChange={(reps) => updateFeederSet(index, "reps", reps)}
                onDoneChange={(done) => updateFeederSet(index, "done", done)}
              />
            ))}
          </div>
        )}

        {/* Valid Sets Card */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Séries Válidas
          </h2>

          {/* Table Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
            <div className="w-8">Conj.</div>
            <div className="w-8"></div>
            <div className="w-16 text-center">Kg</div>
            <div className="w-14 text-center">Reps</div>
            <div className="flex-1">Descanso</div>
          </div>

          {/* Valid Set Rows */}
          {workSets.map((set, index) => (
            <SetRow
              key={index}
              setNumber={index + 1}
              kg={set.kg}
              reps={set.reps}
              rest={restTime}
              done={set.done}
              showDoneLabel={true}
              canRemove={workSets.length > 1}
              onKgChange={(kg) => updateWorkSet(index, "kg", kg)}
              onRepsChange={(reps) => updateWorkSet(index, "reps", reps)}
              onDoneChange={(done) => updateWorkSet(index, "done", done)}
              onRemove={() => handleRemoveSet(index)}
            />
          ))}

          {/* Add Set Button */}
          <button
            onClick={handleAddSet}
            className="w-full mt-4 bg-secondary/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Adicionar série</span>
          </button>

          {/* Suggestion Banner */}
          {showSuggestion && (
            <div className="mt-4 bg-secondary/30 rounded-xl px-4 py-3 text-center">
              <span className="text-muted-foreground text-sm">
                Sugerimos{" "}
                <span className="text-primary font-medium">+2,5%</span> no próximo
                treino
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNextExercise}
            className="w-full cta-button flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-primary-foreground" />
            <span className="text-lg font-semibold">
              {isLast ? "Finalizar treino" : "Próximo exercício"}
            </span>
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default ExerciseLogging;
