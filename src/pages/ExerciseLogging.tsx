import { ArrowLeft, Check, Play, Plus, Sparkles } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SetRow from "@/components/SetRow";
import { useAppStateContext, useWorkoutPlan } from "@/contexts/AppStateContext";
import type { ExerciseProgress, SetProgress } from "@/lib/appState";
import { toast } from "sonner";

const ExerciseLogging = () => {
  const { treinoId, exercicioId } = useParams();
  const navigate = useNavigate();
  const { plan, treinoProgresso, updateTreinoProgresso } = useWorkoutPlan();
  const { state, updateState } = useAppStateContext();
  
  const workout = plan?.workouts.find(w => w.id === (treinoId || "")) || null;
  const exercise = workout?.exercicios.find(e => e.id === (exercicioId || "")) || null;
  const exerciseHistory = state?.exerciseHistory || {};
  const progressionSuggestions = state?.progressionSuggestions || {};
  
  // State
  const [warmupDone, setWarmupDone] = useState(false);
  const [feederSets, setFeederSets] = useState<SetProgress[]>([]);
  const [workSets, setWorkSets] = useState<SetProgress[]>([]);
  const [showSuggestion, setShowSuggestion] = useState(false);

  // Initialize from state or defaults, with suggested load support
  useEffect(() => {
    if (!exercise) return;
    
    const savedProgress = treinoProgresso?.[treinoId || ""]?.[exercicioId || ""] || null;
    
    if (savedProgress) {
      setWarmupDone(savedProgress.warmupDone);
      setFeederSets(savedProgress.feederSets);
      setWorkSets(savedProgress.workSets);
    } else {
      // Check for suggested load from previous session
      const suggestion = progressionSuggestions[exercicioId || ""];
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
  }, [treinoId, exercicioId, exercise, treinoProgresso, progressionSuggestions]);

  // Save progress whenever state changes
  const saveProgress = useCallback(async () => {
    if (!treinoId || !exercicioId) return;
    
    const progress: ExerciseProgress = {
      warmupDone,
      feederSets,
      workSets,
      updatedAt: new Date().toISOString(),
    };
    
    const updated = { ...(treinoProgresso || {}) };
    if (!updated[treinoId]) {
      updated[treinoId] = {};
    }
    updated[treinoId][exercicioId] = progress;
    await updateTreinoProgresso(updated);
  }, [treinoId, exercicioId, warmupDone, feederSets, workSets, treinoProgresso, updateTreinoProgresso]);

  useEffect(() => {
    saveProgress();
  }, [saveProgress]);

  // Check for suggestion banner
  useEffect(() => {
    if (!exercise) return;
    
    // Parse reps range to get upper limit
    const repsRangeMatch = exercise.repsRange.match(/(\d+)\D+(\d+)/);
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
    if (!treinoId || !exercicioId || !workout) return;
    
    const idx = workout.exercicios.findIndex((e) => e.id === exercicioId);
    if (idx === -1) return;
    
    if (idx >= workout.exercicios.length - 1) {
      navigate(`/treino/${treinoId}/resumo`);
    } else {
      const nextExercise = workout.exercicios[idx + 1];
      navigate(`/treino/${treinoId}/${nextExercise.id}`);
    }
  };

  const isLast = !!workout && workout.exercicios[workout.exercicios.length - 1]?.id === (exercicioId || "");
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
  const lastPerformance = (() => {
    const history = exerciseHistory[exercicioId || ""];
    if (!history || history.length === 0) return null;
    return history[history.length - 1];
  })();

  const progression = (() => {
    if (!lastPerformance || !exercise?.repsRange || !lastPerformance.workSets?.length) return null;
    const firstSet = lastPerformance.workSets[0];
    const [minReps, maxReps] = exercise.repsRange
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

  const handleApplySuggestion = async () => {
    if (!progression || progression.status !== "ready" || !state) return;
    const suggestedLoad = parseFloat(progression.metaHoje.split(" ")[0]) || 0;
    if (suggestedLoad > 0) {
      const updated = { ...(state.progressionSuggestions || {}) };
      updated[exercicioId || ""] = {
        suggestedNextLoad: suggestedLoad,
        appliedAt: new Date().toISOString(),
      };
      await updateState({ progressionSuggestions: updated });
      toast.success(`Sugestão salva: ${suggestedLoad} kg`);
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
                {lastPerformance && lastPerformance.workSets?.[0] ? (
                  <span className="text-foreground font-medium">
                    {lastPerformance.workSets[0].kg} kg × {lastPerformance.workSets[0].reps}
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
          {progression && (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30">
              <p className="text-xs text-muted-foreground">
                {progression.status === "ready" ? "Você está pronto para progredir!" : "Continue trabalhando na carga atual."}
              </p>
              {progression.status === "ready" && (
                <button
                  onClick={handleApplySuggestion}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="w-3 h-3" />
                  Aplicar
                </button>
              )}
            </div>
          )}
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
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <Plus size={16} />
            <span className="text-sm">Adicionar série</span>
          </button>
        </div>

        {/* Suggestion Banner */}
        {showSuggestion && (
          <div className="card-glass p-4 mb-6 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground font-medium mb-1">Hora de progredir!</p>
                <p className="text-xs text-muted-foreground">
                  Você completou todas as séries no limite superior de repetições.
                </p>
              </div>
              <span className="text-primary font-medium">+2,5%</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNextExercise}
            className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            {isLast ? "Finalizar treino" : "Próximo exercício"}
            <Play className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default ExerciseLogging;
