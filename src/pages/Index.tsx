import { Link, useNavigate } from "react-router-dom";
import { Settings, HelpCircle, Dumbbell, Apple, Footprints, Scale, Check, Award, Mountain, Hourglass, Gift } from "lucide-react";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import { getProfile, getQuests, syncQuestsStatus, getAchievements, saveTreinoHoje, getUserWorkout, getWeightHistory } from "@/lib/storage";
import { getWorkoutOfDay, isRestDay } from "@/lib/weekUtils";
import { isWorkoutCompletedThisWeek } from "@/lib/appState";
import { Progress } from "@/components/ui/progress";

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile());
  const [quests, setQuests] = useState(getQuests());
  const [achievements, setAchievements] = useState(getAchievements());

  useEffect(() => {
    syncQuestsStatus();
    setQuests(getQuests());
    setAchievements(getAchievements());
    setProfile(getProfile());
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const nextRewardIn = Math.max(1, 3 - (unlockedCount % 3));

  // Weight goal data
  const weightHistory = getWeightHistory();
  const currentWeight = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : 0;
  const goalWeight = 70; // Meta de peso
  const startWeight = 76; // Peso inicial
  const remaining = Math.max(0, currentWeight - goalWeight);
  const progressPercent = startWeight > goalWeight 
    ? Math.min(100, ((startWeight - currentWeight) / (startWeight - goalWeight)) * 100)
    : 0;

  // Workout of the day
  const workoutIdOfDay = getWorkoutOfDay();
  const isRest = isRestDay();
  const isCompletedThisWeek = workoutIdOfDay ? isWorkoutCompletedThisWeek(workoutIdOfDay) : false;
  const workout = workoutIdOfDay ? getUserWorkout(workoutIdOfDay) : null;

  const handleStartWorkout = () => {
    if (isRest) {
      navigate('/descanso');
      return;
    }
    if (workoutIdOfDay) {
      saveTreinoHoje({
        treinoId: workoutIdOfDay,
        startedAt: new Date().toISOString(),
      });
      navigate(`/treino/${workoutIdOfDay}/ativo`);
    }
  };

  const goals = [
    { 
      id: "1", 
      icon: Dumbbell, 
      label: "Fazer treino do dia", 
      xp: 150,
      completed: quests.treinoDoDiaDone,
    },
    { 
      id: "2", 
      icon: Apple, 
      label: "Registrar alimentação", 
      xp: 80,
      completed: quests.registrarAlimentacaoDone,
    },
    { 
      id: "3", 
      icon: Footprints, 
      label: "Passos ou cardio leve", 
      xp: 70,
      completed: false, // TODO: track steps
    },
    { 
      id: "4", 
      icon: Scale, 
      label: "Registrar peso (semanal)", 
      xp: 120,
      completed: quests.registrarPesoDone,
    },
  ];

  const completedGoals = goals.filter(g => g.completed).length;
  const totalGoals = goals.length;
  const goalsProgress = (completedGoals / totalGoals) * 100;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background gradient effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Seu Painel</p>
            <h1 className="text-xl font-bold text-foreground">Resumo de hoje</h1>
          </div>
          <Link 
            to="/settings"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Settings className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Goal Card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Objetivo Ativo</p>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">Perder peso</h2>
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <p className="text-3xl font-bold text-foreground mb-1">
            Faltam {remaining.toFixed(1)} kg
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Hoje o foco é consistência: treino + passos.
          </p>

          {/* Progress bar */}
          <div className="mb-2">
            <Progress value={progressPercent} className="h-2" />
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {(startWeight - currentWeight).toFixed(1)} / {(startWeight - goalWeight).toFixed(1)} kg
          </p>

          {/* Start Workout Button */}
          {isRest ? (
            <button
              onClick={handleStartWorkout}
              className="w-full py-4 rounded-xl bg-secondary text-foreground font-semibold transition-colors hover:bg-secondary/80"
            >
              Hoje é dia de descanso
            </button>
          ) : isCompletedThisWeek ? (
            <button
              onClick={handleStartWorkout}
              className="w-full py-4 rounded-xl bg-primary/20 text-primary font-semibold flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              {workout?.titulo || 'Treino'} concluído
            </button>
          ) : (
            <button
              onClick={handleStartWorkout}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold transition-colors hover:bg-primary/90"
            >
              Começar treino {workout?.titulo || 'do dia'}
            </button>
          )}
        </div>

        {/* Missions Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Missões de hoje</h2>
              <p className="text-xs text-muted-foreground">{completedGoals}/{totalGoals} concluídas</p>
            </div>
            <span className="text-xs text-muted-foreground">+XP por objetivo</span>
          </div>

          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {/* Progress indicator */}
            <div className="px-4 py-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden mr-3">
                  <div 
                    className="h-full bg-primary rounded-full transition-all duration-300"
                    style={{ width: `${goalsProgress}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{Math.round(goalsProgress)}%</span>
              </div>
            </div>

            {/* Goals list */}
            {goals.map((goal) => {
              const Icon = goal.icon;
              return (
                <div 
                  key={goal.id} 
                  className={`flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0 transition-colors ${
                    goal.completed ? "opacity-60" : "hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      goal.completed ? "bg-primary/20" : "bg-secondary"
                    }`}>
                      {goal.completed ? (
                        <Check className="w-4 h-4 text-primary" />
                      ) : (
                        <Icon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      goal.completed ? "text-muted-foreground line-through" : "text-foreground"
                    }`}>
                      {goal.label}
                    </span>
                    <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    goal.completed 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/20 text-primary"
                  }`}>
                    +{goal.xp} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Achievements Card */}
        <Link to="/conquistas" className="block mb-6">
          <div className="bg-card border border-border rounded-2xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Conquistas</h3>
                <p className="text-xs text-muted-foreground">Colete medalhas e destrave bônus</p>
              </div>
              <span className="text-sm text-muted-foreground">
                {unlockedCount} / {totalCount}
              </span>
            </div>

            {/* Achievement badges */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-600/30 flex items-center justify-center">
                <Award className="w-6 h-6 text-yellow-500" />
              </div>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-600/30 flex items-center justify-center relative">
                <Mountain className="w-6 h-6 text-purple-400" />
                <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded">5x</span>
              </div>
              <div className="w-12 h-12 rounded-full bg-secondary border border-border flex items-center justify-center">
                <Hourglass className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>

            {/* Progress to next reward */}
            <div className="flex items-center gap-3">
              <div className="flex-1 flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-2">
                <span className="text-xs text-muted-foreground">Próxima recompensa</span>
                <span className="text-xs text-muted-foreground">Faltam {nextRewardIn} conquistas</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-500" />
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Index;
