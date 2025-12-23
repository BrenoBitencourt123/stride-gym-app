import { useState, useMemo } from "react";
import { ArrowLeft, TrendingUp, Dumbbell, Award, Calendar, Scale, Plus, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
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
  saveWeight,
} from "@/lib/storage";
import { foods, FoodItem } from "@/data/foods";
import { toast } from "sonner";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const Progresso = () => {
  const [activeTab, setActiveTab] = useState("forca");
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [period, setPeriod] = useState<string>("30");
  const [nutritionPeriod, setNutritionPeriod] = useState<string>("7");
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const triggerSync = useSyncTrigger();

  // Exercícios disponíveis
  const exercisesWithHistory = useMemo(() => getExercisesWithHistory(), []);
  
  // Selecionar primeiro exercício se não selecionado
  const currentExercise = selectedExercise || exercisesWithHistory[0]?.id || "";

  // Dados de força
  const e1rmData = useMemo(() => {
    if (!currentExercise) return [];
    return getE1RMHistory(currentExercise);
  }, [currentExercise]);

  const weeklyVolumeData = useMemo(() => getWeeklyVolume(parseInt(period)), [period]);
  const prsCount = useMemo(() => getPRsCount(), []);
  const workoutsLast30 = useMemo(() => getWorkoutsInPeriod(30), []);
  const consistency = useMemo(() => getConsistency(30), []);

  // Dados de nutrição - consolidar dados do dia atual
  const nutritionData = useMemo(() => {
    // Consolidar nutrição do dia atual antes de buscar dados
    const today = getNutritionToday();
    const goals = getNutritionGoals();
    
    let totalKcal = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
    
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
        protein: Math.round(totalProtein),
        carbs: Math.round(totalCarbs),
        fat: Math.round(totalFat),
      });
    }
    
    return getNutritionChartData(parseInt(nutritionPeriod));
  }, [nutritionPeriod]);

  // Dados de peso
  const weightData = useMemo(() => getWeightChartData(), []);
  const weightVariation = useMemo(() => getWeightVariation(), []);
  const weightHistory = useMemo(() => getWeightHistory(), []);

  const handleSaveWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error("Digite um peso válido");
      return;
    }
    saveWeight(weight);
    setShowWeightModal(false);
    setNewWeight("");
    toast.success("Peso registrado!");
    triggerSync(); // Sync after saving weight
  };

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
                  {exercisesWithHistory.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
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
                      <XAxis 
                        dataKey="dateLabel" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        domain={['dataMin - 5', 'dataMax + 5']}
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
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
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
                      <XAxis 
                        dataKey="weekLabel" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
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
                      <Bar 
                        dataKey="volume" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
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
                      <XAxis 
                        dataKey="dateLabel" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
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
                        label={{ value: "Meta", fill: "hsl(var(--primary))", fontSize: 10 }}
                      />
                      <Bar 
                        dataKey="kcal" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                        name="Calorias"
                      />
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
                      <XAxis 
                        dataKey="dateLabel" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
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
                      <Line 
                        type="monotone" 
                        dataKey="fat" 
                        stroke="#eab308" 
                        strokeWidth={2}
                        dot={false}
                        name="Gordura"
                      />
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
            {/* Weight Stats */}
            {weightVariation && (
              <div className="card-glass p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Peso atual</p>
                    <p className="text-2xl font-bold text-foreground">{weightVariation.current} kg</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Δ 7 dias</p>
                    <p className={`text-xl font-bold ${weightVariation.delta > 0 ? "text-red-500" : weightVariation.delta < 0 ? "text-green-500" : "text-muted-foreground"}`}>
                      {weightVariation.delta > 0 ? "+" : ""}{weightVariation.delta} kg
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
                      <XAxis 
                        dataKey="dateLabel" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={10}
                        tickLine={false}
                        domain={['dataMin - 1', 'dataMax + 1']}
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
                        dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
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

            {/* Weight History List */}
            {weightHistory.length > 0 && (
              <div className="card-glass p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Últimos registros</h3>
                <div className="space-y-2">
                  {weightHistory.slice(0, 5).map((entry, idx) => {
                    const date = new Date(entry.timestamp);
                    return (
                      <div key={idx} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                        <span className="text-sm text-muted-foreground">
                          {date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                        <span className="font-medium text-foreground">{entry.weight} kg</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Register Weight CTA */}
            <Button 
              onClick={() => setShowWeightModal(true)}
              className="w-full"
              size="lg"
            >
              <Scale className="w-5 h-5 mr-2" />
              Registrar peso
            </Button>
          </TabsContent>
        </Tabs>
      </div>

      {/* Weight Modal */}
      <Dialog open={showWeightModal} onOpenChange={setShowWeightModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar peso</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const current = parseFloat(newWeight) || (weightVariation?.current || 70);
                  setNewWeight(String(Math.max(0, current - 0.5)));
                }}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <div className="text-center">
                <Input
                  type="number"
                  step="0.1"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder={String(weightVariation?.current || 70)}
                  className="w-24 text-center text-2xl font-bold"
                />
                <Label className="text-sm text-muted-foreground">kg</Label>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const current = parseFloat(newWeight) || (weightVariation?.current || 70);
                  setNewWeight(String(current + 0.5));
                }}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowWeightModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveWeight}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Progresso;
