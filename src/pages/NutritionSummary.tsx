import { Trophy, ArrowRight, CheckCircle, Apple, Flame, Utensils } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { 
  getNutritionGoals, 
  getNutritionToday, 
  completeNutritionToday,
  isNutritionCompletedToday,
  getCompletedMealsCount 
} from "@/lib/storage";
import { getFoodById } from "@/data/foods";
import { useMemo } from "react";
import BottomNav from "@/components/BottomNav";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const XP_BASE = 80;
const XP_BONUS = 20; // Extra se bater proteína e calorias

const NutritionSummary = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
  const goals = getNutritionGoals();
  const today = getNutritionToday();
  const alreadyCompleted = isNutritionCompletedToday();
  
  // Calcula totais consumidos
  const consumedTotals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, g = 0;
    
    for (const meal of today.meals) {
      for (const entry of meal.entries) {
        if (!entry.consumed) continue;
        const food = getFoodById(entry.foodId);
        if (food) {
          const fator = entry.quantidade / food.porcaoBase;
          kcal += food.kcal * fator;
          p += food.p * fator;
          c += food.c * fator;
          g += food.g * fator;
        }
      }
    }
    
    return {
      kcal: Math.round(kcal),
      p: Math.round(p),
      c: Math.round(c),
      g: Math.round(g),
    };
  }, [today]);

  // Verifica se bateu proteína e calorias
  const hitProtein = consumedTotals.p >= goals.pTarget;
  const hitKcal = consumedTotals.kcal >= goals.kcalTarget * 0.9 && 
                  consumedTotals.kcal <= goals.kcalTarget * 1.1;
  const hitBoth = hitProtein && hitKcal;
  
  const xpGained = hitBoth ? XP_BASE + XP_BONUS : XP_BASE;
  
  const completedMeals = getCompletedMealsCount();
  const totalMeals = 4;

  const handleConcluir = () => {
    if (!alreadyCompleted) {
      completeNutritionToday(xpGained);
    }
    triggerSync(); // Sync after completing nutrition
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
        <h1 className="text-3xl font-bold text-foreground mb-2">Nutrição concluída!</h1>
        <p className="text-muted-foreground text-center mb-8">
          Você bateu suas metas de hoje
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
              <p className="text-2xl font-bold text-primary">
                +{xpGained} XP
                {hitBoth && <span className="text-sm ml-2 text-muted-foreground">(bônus!)</span>}
              </p>
            </div>
          </div>

          {/* Calorias Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Flame className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Calorias</p>
              <p className="text-2xl font-bold text-foreground">
                {consumedTotals.kcal} <span className="text-lg text-muted-foreground font-normal">/ {goals.kcalTarget} kcal</span>
              </p>
            </div>
          </div>

          {/* Proteína Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Apple className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Proteína</p>
              <p className="text-2xl font-bold text-foreground">
                {consumedTotals.p}g <span className="text-lg text-muted-foreground font-normal">/ {goals.pTarget}g</span>
              </p>
            </div>
          </div>

          {/* Refeições Completas Card */}
          <div className="card-glass p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-secondary/50 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-muted-foreground text-sm">Refeições Completas</p>
              <p className="text-2xl font-bold text-foreground">
                {completedMeals} <span className="text-lg text-muted-foreground font-normal">/ {totalMeals}</span>
              </p>
            </div>
          </div>

          {/* Message Card */}
          <div className="card-glass p-5 text-center">
            <p className="text-lg font-medium text-foreground">Bom trabalho! 🍎</p>
            <p className="text-muted-foreground text-sm mt-1">
              Continue consistente para alcançar seus objetivos
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

export default NutritionSummary;
