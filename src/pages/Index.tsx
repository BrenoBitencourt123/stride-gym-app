import { Link, useNavigate } from "react-router-dom";
import { Settings, Dumbbell, Apple, Scale, Check, Award, Mountain, Hourglass, Gift, ChevronRight, TrendingDown, TrendingUp, Minus, CalendarCheck } from "lucide-react";
import { useEffect, useState } from "react";
import HelpIcon from "@/components/HelpIcon";
import BottomNav from "@/components/BottomNav";
import { getProfile, getQuests, syncQuestsStatus, getAchievements, saveTreinoHoje, getUserWorkout, getWeightHistory } from "@/lib/storage";
import { getWorkoutOfDay, isRestDay } from "@/lib/weekUtils";
import { isWorkoutCompletedThisWeek } from "@/lib/appState";
import { Progress } from "@/components/ui/progress";
import { getOnboardingData, getObjectiveLabel } from "@/lib/onboarding";
import { 
  getWeightStats, 
  isCheckinAvailable, 
  getNextCheckinDueDate,
  initializePlanHistoryFromOnboarding,
  getLatestWeight,
  getWeighingFrequency
} from "@/lib/progress";
import WeightLogModal from "@/components/WeightLogModal";
import WeeklyCheckinModal from "@/components/WeeklyCheckinModal";

const Index = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(getProfile());
  const [quests, setQuests] = useState(getQuests());
  const [achievements, setAchievements] = useState(getAchievements());
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    syncQuestsStatus();
    setQuests(getQuests());
    setAchievements(getAchievements());
    setProfile(getProfile());
    
    // Initialize plan history from onboarding if needed
    initializePlanHistoryFromOnboarding();
  }, []);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const nextRewardIn = Math.max(1, 3 - (unlockedCount % 3));

  // Onboarding data
  const onboardingData = getOnboardingData();
  const hasOnboarding = !!onboardingData?.plan;

  // Weight progress data
  const weightStats = getWeightStats();
  const latestWeight = getLatestWeight();
  const checkinAvailable = isCheckinAvailable();
  const nextCheckinDate = getNextCheckinDueDate();
  const weighingFrequency = getWeighingFrequency();

  // Weight goal data - use onboarding target if available
  const weightHistory = getWeightHistory();
  const currentWeight = latestWeight?.weightKg || 
    (weightHistory.length > 0 
      ? weightHistory[weightHistory.length - 1].weight 
      : (onboardingData?.profile?.weightKg || 0));
  const goalWeight = onboardingData?.objective?.targetWeightKg || 70;
  const startWeight = onboardingData?.profile?.weightKg || 76;
  const remaining = Math.abs(currentWeight - goalWeight);
  const progressPercent = startWeight !== goalWeight 
    ? Math.min(100, Math.abs((startWeight - currentWeight) / (startWeight - goalWeight)) * 100)
    : 100;

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

  const handleWeightSaved = () => {
    setRefreshKey(k => k + 1);
    setQuests(getQuests());
  };

  const handleCheckinApplied = () => {
    setRefreshKey(k => k + 1);
  };

  // Trend icon
  const TrendIcon = weightStats.trendKg !== null 
    ? weightStats.trendKg < 0 ? TrendingDown 
    : weightStats.trendKg > 0 ? TrendingUp 
    : Minus
    : null;

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
      icon: Scale, 
      label: "Registrar peso", 
      xp: 50,
      completed: quests.registrarPesoDone,
      onClick: () => setShowWeightModal(true),
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
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Objetivo Ativo</p>
            <Link 
              to="/settings/objetivo" 
              className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              Ajustar
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {hasOnboarding ? getObjectiveLabel(onboardingData.objective.objective) : 'Perder peso'}
            </h2>
            <HelpIcon helpKey="home.plan" size={16} />
          </div>
          
          <p className="text-3xl font-bold text-foreground mb-1">
            {onboardingData?.objective?.objective === 'maintain' 
              ? 'Manter peso atual'
              : `Faltam ${remaining.toFixed(1)} kg`
            }
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            {hasOnboarding 
              ? `Meta: ${onboardingData.plan.targetKcal} kcal/dia`
              : 'Hoje o foco é consistência: treino + passos.'
            }
          </p>

          {/* Progress bar */}
          {onboardingData?.objective?.objective !== 'maintain' && (
            <>
              <div className="mb-2">
                <Progress value={progressPercent} className="h-2" />
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                {Math.abs(startWeight - currentWeight).toFixed(1)} / {Math.abs(startWeight - goalWeight).toFixed(1)} kg
              </p>
            </>
          )}

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

        {/* Progress Card */}
        {hasOnboarding && (
          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Progresso</h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {weighingFrequency === 'weekly' ? 'Semanal' : 'Diário'}
                </span>
              </div>
              {weighingFrequency === 'weekly' ? (
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  + Peso extra
                </button>
              ) : (
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  Registrar peso
                </button>
              )}
            </div>

            {/* Stats grid - adapts to mode */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {weighingFrequency === 'daily' ? (
                <>
                  {/* Daily mode: 7-day average */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Média 7 dias</p>
                    {weightStats.currentAvg7 !== null ? (
                      <p className="text-xl font-bold text-foreground">{weightStats.currentAvg7} kg</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {weightStats.logsNeeded > 0 
                          ? `Faltam ${weightStats.logsNeeded} registros` 
                          : 'Sem dados'
                        }
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Weekly mode: last check-in weight */}
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Último check-in</p>
                    {weightStats.weeklyModeStats.currentWeight !== null ? (
                      <p className="text-xl font-bold text-foreground">{weightStats.weeklyModeStats.currentWeight} kg</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum ainda</p>
                    )}
                  </div>
                </>
              )}
              
              {/* Trend - same for both modes */}
              <div className="bg-muted/30 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                {weightStats.trendKg !== null && TrendIcon ? (
                  <div className={`flex items-center gap-1 text-xl font-bold ${
                    weightStats.trendKg < 0 ? "text-green-500" : 
                    weightStats.trendKg > 0 ? "text-orange-500" : 
                    "text-muted-foreground"
                  }`}>
                    <TrendIcon className="w-5 h-5" />
                    {weightStats.trendKg > 0 ? "+" : ""}{weightStats.trendKg} kg
                  </div>
                ) : weighingFrequency === 'weekly' && weightStats.weeklyModeStats.checkinsNeeded > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    +{weightStats.weeklyModeStats.checkinsNeeded} check-in(s)
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">Aguardando dados</p>
                )}
              </div>
            </div>

            {/* Check-in status */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {checkinAvailable 
                    ? 'Check-in disponível!' 
                    : nextCheckinDate 
                      ? `Próximo: ${nextCheckinDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                      : 'Registre seu primeiro peso'
                  }
                </span>
              </div>
              <button
                onClick={() => setShowCheckinModal(true)}
                className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                  checkinAvailable 
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                    : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                }`}
              >
                {checkinAvailable ? 'Fazer check-in' : 'Ver detalhes'}
              </button>
            </div>
          </div>
        )}

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
                <button 
                  key={goal.id} 
                  onClick={goal.onClick}
                  className={`w-full flex items-center justify-between px-4 py-3.5 border-b border-border/50 last:border-0 transition-colors ${
                    goal.completed ? "opacity-60" : "hover:bg-muted/30"
                  }`}
                  disabled={goal.completed}
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
                    <HelpIcon helpKey="home.goals" size={14} />
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    goal.completed 
                      ? "bg-muted text-muted-foreground" 
                      : "bg-primary/20 text-primary"
                  }`}>
                    +{goal.xp} XP
                  </span>
                </button>
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

      {/* Modals */}
      <WeightLogModal 
        open={showWeightModal} 
        onClose={() => setShowWeightModal(false)} 
        onSaved={handleWeightSaved}
      />
      <WeeklyCheckinModal
        open={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        onApplied={handleCheckinApplied}
      />
    </div>
  );
};

export default Index;
