import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, TrendingUp, TrendingDown, Dumbbell, Award, Calendar, Scale, CalendarCheck } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import WeightLogModal from "@/components/WeightLogModal";
import WeeklyCheckinModal from "@/components/WeeklyCheckinModal";
import HelpIcon from "@/components/HelpIcon";
import {
  getE1RMHistory,
  getWeeklyVolume,
  getWorkoutsInPeriod,
  getConsistency,
  getPRsCount,
  getExercisesWithHistory,
  getNutritionChartData,
  getNutritionGoals,
  saveNutritionLog,
  getNutritionToday,
  getWeightChartData,
  getWeightHistory,
  getWeightVariation,
} from "@/lib/storage";
import {
  getWeightStats,
  isCheckinAvailable,
  getNextCheckinDueDate,
  getWeighingFrequency,
  getPlanHistory,
} from "@/lib/progress";
import { foods, FoodItem } from "@/data/foods";
import { toast } from "sonner";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const Progresso = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "forca";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [period, setPeriod] = useState<string>("30");
  const [nutritionPeriod, setNutritionPeriod] = useState<string>("7");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerSync = useSyncTrigger();

  // Update tab when URL changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["forca", "nutricao", "peso"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // ✅ Recarrega dados quando o app volta pro foco (mobile) ou quando a aba volta a ficar visível
  useEffect(() => {
    const bump = () => setRefreshKey((k) => k + 1);

    const onVisibility = () => {
      if (!document.hidden) bump();
    };

    window.addEventListener("focus", bump);
    document.addEventListener("visibilitychange", onVisibility);

    // se em algum lugar do app você dispara evento de sync, isso também ajuda
    window.addEventListener("sync", bump as any);
    window.addEventListener("app:sync", bump as any);

    return () => {
      window.removeEventListener("focus", bump);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("sync", bump as any);
      window.removeEventListener("app:sync", bump as any);
    };
  }, []);

  // Weight progress data
  const weightStats = useMemo(() => getWeightStats(), [refreshKey]);
  const checkinAvailable = useMemo(() => isCheckinAvailable(), [refreshKey]);
  const nextCheckinDate = useMemo(() => getNextCheckinDueDate(), [refreshKey]);
  const weighingFrequency = useMemo(() => getWeighingFrequency(), [refreshKey]);
  const planHistory = useMemo(() => getPlanHistory(), [refreshKey]);

  // Trend icon
  const TrendIcon =
    weightStats.trendKg !== null
      ? weightStats.trendKg < 0
        ? TrendingDown
        : weightStats.trendKg > 0
          ? TrendingUp
          : null
      : null;

  // Exercícios disponíveis
  const exercisesWithHistory = useMemo(() => getExercisesWithHistory(), [refreshKey]);

  // Selecionar primeiro exercício se não selecionado
  const currentExercise = selectedExercise || exercisesWithHistory[0]?.id || "";

  // Dados de força
  const e1rmData = useMemo(() => {
    if (!currentExercise) return [];
    return getE1RMHistory(currentExercise);
  }, [currentExercise, refreshKey]);

  const weeklyVolumeData = useMemo(() => {
    return getWeeklyVolume(parseInt(period));
  }, [period, refreshKey]);

  const prsCount = useMemo(() => getPRsCount(), [refreshKey]);
  const workoutsLast30 = useMemo(() => getWorkoutsInPeriod(30), [refreshKey]);
  const consistency = useMemo(() => {
    const data = getConsistency(30);
    if (data.length === 0) return 0;
    // Calculate percentage based on expected 4 workouts per week
    const totalWeeks = data.length;
    const totalWorkouts = data.reduce((acc, d) => acc + d.count, 0);
    const expectedPerWeek = 4;
    return Math.min(100, Math.round((totalWorkouts / (totalWeeks * expectedPerWeek)) * 100));
  }, [refreshKey]);

  // Dados de nutrição - consolidar dados do dia atual
  const nutritionData = useMemo(() => {
    // Consolidar nutrição do dia atual antes de buscar dados
    const today = getNutritionToday();
    const goals = getNutritionGoals();

    let totalKcal = 0,
      totalProtein = 0,
      totalCarbs = 0,
      totalFat = 0;

    for (const meal of today.meals) {
      for (const entry of meal.entries) {
        if (entry.consumed) {
          const food = foods.find((f: FoodItem) => f.id === entry.foodId);
          if (food) {
            const multiplier = entry.quantidade / (food.porcaoBase || 100);
            totalKcal += food.kcal * multiplier;
            totalProtein += food.p * multiplier;
            totalCarbs += food.c * multiplier;
            totalFat += food.g * multiplier;
          }
        }
      }
    }

    // Salvar log de hoje se houver consumo
    if (totalKcal > 0) {
      const dateKey = new Date().toISOString().split("T")[0];
      saveNutritionLog({
        dateKey,
        kcal: Math.round(totalKcal),
        p: Math.round(totalProtein),
        c: Math.round(totalCarbs),
        g: Math.round(totalFat),
      });
    }

    return getNutritionChartData();
  }, [nutritionPeriod, refreshKey]);

  // Dados de peso
  const weightData = useMemo(() => getWeightChartData(), [refreshKey]);
  const weightVariation = useMemo(() => getWeightVariation(), [refreshKey]);
  const weightHistory = useMemo(() => getWeightHistory(), [refreshKey]);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Progresso</h1>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-6">
            <TabsTrigger value="forca" className="gap-2">
              <Dumbbell className="w-4 h-4" />
              Força
            </TabsTrigger>
            <TabsTrigger value="nutricao" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Nutrição
            </TabsTrigger>
            <TabsTrigger value="peso" className="gap-2">
              <Scale className="w-4 h-4" />
              Peso
            </TabsTrigger>
          </TabsList>

          {/* Força Tab */}
          <TabsContent value="forca" className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="card-glass p-3 text-center">
                <Award className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{prsCount}</p>
                <p className="text-xs text-muted-foreground">PRs</p>
              </div>
              <div className="card-glass p-3 text-center">
                <Dumbbell className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{workoutsLast30}</p>
                <p className="text-xs text-muted-foreground">Treinos (30d)</p>
              </div>
              <div className="card-glass p-3 text-center">
                <Calendar className="w-5 h-5 text-green-500 mx-auto mb-1" />
                <p className="text-xl font-bold text-foreground">{consistency}%</p>
                <p className="text-xs text-muted-foreground">Consistência</p>
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={currentExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Exercício" />
                </SelectTrigger>
                <SelectContent>
                  {exercisesWithHistory.map((ex) => (
                    <SelectItem key={ex.id} value={ex.id}>
                      {ex.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* e1RM Chart */}
            <div className="card-glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">e1RM Estimado</h3>
              {e1rmData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={e1rmData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        domain={["dataMin - 5", "dataMax + 5"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`${value} kg`, "e1RM"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="e1rm"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 0,
                          r: 4,
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados para este exercício
                </div>
              )}
            </div>

            {/* Weekly Volume Chart */}
            <div className="card-glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Volume Semanal</h3>
              {weeklyVolumeData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="weekLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}t`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value.toLocaleString()} kg`, "Volume"]}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de volume
                </div>
              )}
            </div>
          </TabsContent>

          {/* Nutrição Tab */}
          <TabsContent value="nutricao" className="space-y-4">
            {/* Period Filter */}
            <div className="flex justify-end">
              <Select value={nutritionPeriod} onValueChange={setNutritionPeriod}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Calories Chart */}
            <div className="card-glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Calorias vs Meta</h3>
              {nutritionData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={nutritionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <ReferenceLine
                        y={nutritionData[0]?.kcalMeta || 0}
                        stroke="hsl(var(--primary))"
                        strokeDasharray="3 3"
                        label={{
                          value: "Meta",
                          fill: "hsl(var(--primary))",
                          fontSize: 10,
                        }}
                      />
                      <Bar dataKey="kcal" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Calorias" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de nutrição
                </div>
              )}
            </div>

            {/* Macros Chart */}
            <div className="card-glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Macros por Dia</h3>
              {nutritionData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={nutritionData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="protein"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={false}
                        name="Proteína"
                      />
                      <Line
                        type="monotone"
                        dataKey="carbs"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        name="Carboidrato"
                      />
                      <Line type="monotone" dataKey="fat" stroke="#eab308" strokeWidth={2} dot={false} name="Gordura" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados de macros
                </div>
              )}
            </div>
          </TabsContent>

          {/* Peso Tab */}
          <TabsContent value="peso" className="space-y-4">
            {/* Progress Card - Full version from Home */}
            <div className="card-glass p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Progresso</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                    {weighingFrequency === "weekly" ? "Semanal" : "Diário"}
                  </span>
                  <HelpIcon helpKey="home.progress" size={14} />
                </div>
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  + Peso extra
                </button>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {weighingFrequency === "daily" ? (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Média 7 dias</p>
                    {weightStats.currentAvg7 !== null ? (
                      <p className="text-xl font-bold text-foreground">{weightStats.currentAvg7} kg</p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {weightStats.logsNeeded > 0 ? `Faltam ${weightStats.logsNeeded} registros` : "Sem dados"}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-1">Último check-in</p>
                    {weightStats.weeklyModeStats.currentWeight !== null ? (
                      <p className="text-xl font-bold text-foreground">
                        {weightStats.weeklyModeStats.currentWeight} kg
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">Nenhum ainda</p>
                    )}
                  </div>
                )}

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">Tendência</p>
                  {weightStats.trendKg !== null && TrendIcon ? (
                    <div
                      className={`flex items-center gap-1 text-xl font-bold ${
                        weightStats.trendKg < 0
                          ? "text-green-500"
                          : weightStats.trendKg > 0
                            ? "text-orange-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      <TrendIcon className="w-5 h-5" />
                      {weightStats.trendKg > 0 ? "+" : ""}
                      {weightStats.trendKg} kg
                    </div>
                  ) : weighingFrequency === "weekly" && weightStats.weeklyModeStats.checkinsNeeded > 0 ? (
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
                      ? "Check-in disponível!"
                      : nextCheckinDate
                        ? `Próximo: ${nextCheckinDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`
                        : "Registre seu primeiro peso"}
                  </span>
                </div>
                <button
                  onClick={() => setShowCheckinModal(true)}
                  className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    checkinAvailable
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  }`}
                >
                  {checkinAvailable ? "Fazer check-in" : "Ver detalhes"}
                </button>
              </div>
            </div>

            {/* Weight Stats Card */}
            {weightVariation && (
              <div className="card-glass p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peso atual</p>
                    <p className="text-2xl font-bold text-foreground">{weightVariation.current} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Δ 7 dias</p>
                    <p
                      className={`text-xl font-bold ${
                        weightVariation.delta > 0
                          ? "text-red-500"
                          : weightVariation.delta < 0
                            ? "text-green-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {weightVariation.delta > 0 ? "+" : ""}
                      {weightVariation.delta} kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Weight Chart */}
            <div className="card-glass p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de Peso</h3>
              {weightData.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="dateLabel" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        domain={["dataMin - 1", "dataMax + 1"]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [`${value} kg`, "Peso"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{
                          fill: "hsl(var(--primary))",
                          strokeWidth: 0,
                          r: 4,
                        }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                  Sem registros de peso
                </div>
              )}
            </div>

            {/* Plan History / Adjustments */}
            {planHistory.length > 1 && (
              <div className="card-glass p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Histórico de ajustes</h3>
                <div className="space-y-2">
                  {planHistory.slice(0, 5).map((entry, idx) => {
                    const date = new Date(entry.atISO);
                    const prevEntry = planHistory[idx + 1];
                    const calorieDelta = prevEntry ? entry.calories - prevEntry.calories : 0;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <div>
                          <span className="text-sm text-foreground">{entry.calories} kcal</span>
                          {calorieDelta !== 0 && (
                            <span className={`ml-2 text-xs ${calorieDelta > 0 ? "text-orange-500" : "text-green-500"}`}>
                              ({calorieDelta > 0 ? "+" : ""}
                              {calorieDelta})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground">
                            {date.toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                          <span className="ml-2 text-xs text-muted-foreground/70">
                            {entry.reason === "onboarding"
                              ? "Inicial"
                              : entry.reason === "auto_adjust"
                                ? "Check-in"
                                : "Manual"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Weight History List */}
            {weightHistory.length > 0 && (
              <div className="card-glass p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Últimos registros</h3>
                <div className="space-y-2">
                  {weightHistory.slice(0, 5).map((entry, idx) => {
                    const date = new Date(entry.timestamp);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-2 border-b border-border/30 last:border-0"
                      >
                        <span className="text-sm text-muted-foreground">
                          {date.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="font-medium text-foreground">{entry.weight} kg</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Register Weight CTA */}
            <Button onClick={() => setShowWeightModal(true)} className="w-full" size="lg">
              <Scale className="w-5 h-5 mr-2" />
              Registrar peso
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Weight Log Modal */}
      <WeightLogModal
        open={showWeightModal}
        onClose={() => setShowWeightModal(false)}
        onSaved={() => {
          setRefreshKey((k) => k + 1);
          triggerSync();
        }}
      />

      {/* Weekly Checkin Modal */}
      <WeeklyCheckinModal
        open={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
        onApplied={() => {
          setRefreshKey((k) => k + 1);
          triggerSync();
        }}
      />

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Progresso;
