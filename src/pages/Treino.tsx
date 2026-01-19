import { useState } from "react";
import { ChevronDown, Settings, Play, ChevronRight, CheckCircle, BarChart3, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import WorkoutInProgressBar from "@/components/workout/WorkoutInProgressBar";
import { useWorkoutPlan, useAppStateContext } from "@/contexts/AppStateContext";
import { getWeekStart, getWorkoutOfDay } from "@/lib/weekUtils";

const Treino = () => {
  const navigate = useNavigate();
  const { loading } = useAppStateContext();
  const { 
    plan: userPlan, 
    treinoHoje, 
    getWeeklyCompletions,
    updateTreinoHoje 
  } = useWorkoutPlan();
  
  const todayWorkoutId = getWorkoutOfDay(new Date(), userPlan || undefined);
  const weekStart = getWeekStart();
  const weeklyCompletions = getWeeklyCompletions(weekStart) || {};
  
  // Count completed workouts this week
  const completedCount = Object.keys(weeklyCompletions).length;
  const weeklyGoal = 4; // Could be configurable
  const progressPercent = Math.min(100, (completedCount / weeklyGoal) * 100);

  const handleStartWorkout = async (workoutId: string) => {
    await updateTreinoHoje({
      treinoId: workoutId,
      startedAt: new Date().toISOString(),
    });
    navigate(`/treino/${workoutId}/ativo`);
  };

  const handleResumeWorkout = () => {
    if (treinoHoje?.treinoId && !treinoHoje.completedAt) {
      navigate(`/treino/${treinoHoje.treinoId}/ativo`);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Default empty plan if none exists
  const workouts = userPlan?.workouts || [];

  // Find next workout (today's or first uncompleted)
  const nextWorkout = workouts.find((w) => {
    if (w.id === todayWorkoutId && !weeklyCompletions[w.id]) return true;
    return false;
  }) || workouts.find((w) => !weeklyCompletions[w.id]);

  const hasActiveWorkout = treinoHoje && !treinoHoje.completedAt;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button className="flex items-center gap-2 text-foreground">
            <h1 className="text-2xl font-bold">Trainer</h1>
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          </button>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Weekly Goal Card */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Objetivo dos treinos semanais</p>
              <p className="text-2xl font-bold text-foreground">{completedCount}/{weeklyGoal}</p>
            </div>
            <Link
              to="/progresso"
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Relatório</span>
            </Link>
          </div>
          
          {/* Progress bar segmented */}
          <div className="flex gap-1">
            {Array.from({ length: weeklyGoal }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < completedCount ? "bg-primary" : "bg-secondary"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Next Workout Section */}
        {nextWorkout && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">PRÓXIMO TREINO</h2>
            
            <div className="card-glass p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{nextWorkout.titulo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {nextWorkout.exercicios.length} exercícios • ~{nextWorkout.duracaoEstimada} min
                  </p>
                </div>
                {nextWorkout.id === todayWorkoutId && (
                  <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                    Hoje
                  </span>
                )}
              </div>

              {/* Exercise list preview */}
              <div className="space-y-2 mb-4">
                {nextWorkout.exercicios.slice(0, 4).map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">{i + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{ex.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {ex.workSetsDefault.length} séries • {ex.repsRange} reps
                      </p>
                    </div>
                  </div>
                ))}
                {nextWorkout.exercicios.length > 4 && (
                  <p className="text-xs text-muted-foreground pl-11">
                    +{nextWorkout.exercicios.length - 4} exercícios
                  </p>
                )}
              </div>

              {/* Start/Resume button */}
              {hasActiveWorkout && treinoHoje?.treinoId === nextWorkout.id ? (
                <button
                  onClick={handleResumeWorkout}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Retomar treino
                </button>
              ) : (
                <button
                  onClick={() => handleStartWorkout(nextWorkout.id)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Iniciar treino
                </button>
              )}
            </div>
          </div>
        )}

        {/* Workout Plan Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-muted-foreground">PLANO DE TREINO</h2>
            <Link
              to="/treino/ajustar"
              className="text-sm text-primary font-medium hover:underline"
            >
              Editar plano
            </Link>
          </div>

          <div className="space-y-3">
            {workouts.map((workout) => {
              const isCompleted = !!weeklyCompletions[workout.id];
              const isToday = workout.id === todayWorkoutId;
              const isActiveNow = hasActiveWorkout && treinoHoje?.treinoId === workout.id;

              return (
                <Link
                  key={workout.id}
                  to={`/treino/${workout.id}`}
                  className={`card-glass p-4 flex items-center gap-4 transition-colors hover:bg-card/80 ${
                    isActiveNow ? "ring-2 ring-primary" : ""
                  }`}
                >
                  {/* Status indicator */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted
                      ? "bg-green-500/20"
                      : isToday
                      ? "bg-primary/20"
                      : "bg-secondary"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">
                        {workout.exercicios.length}
                      </span>
                    )}
                  </div>

                  {/* Workout info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{workout.titulo}</h3>
                      {isToday && !isCompleted && (
                        <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-xs font-medium">
                          Hoje
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {workout.exercicios.map((e) => e.nome).join(", ")}
                    </p>
                  </div>

                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Empty state if no workouts */}
        {workouts.length === 0 && (
          <div className="card-glass p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum treino configurado</p>
            <Link
              to="/treino/ajustar"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Criar plano de treino
            </Link>
          </div>
        )}
      </div>

      {/* Workout in progress bar */}
      <WorkoutInProgressBar />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Treino;
