import { Link } from "react-router-dom";
import { Plus, Copy, HelpCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { 
  getNutritionGoals, 
  getNutritionToday, 
  hasDietSaved, 
  isTodayEmpty, 
  applyDietToToday,
  removeFoodFromToday,
  updateFoodInToday
} from "@/lib/storage";
import { getFoodById } from "@/data/foods";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import EditFoodModal from "@/components/nutrition/EditFoodModal";
import GoalsExplainModal from "@/components/nutrition/GoalsExplainModal";
const Nutricao = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    mealId: string;
    entryId: string;
    foodId: string;
    quantidade: number;
    unidade: "g" | "un" | "ml" | "scoop";
  } | null>(null);
  
  const goals = getNutritionGoals();
  const today = getNutritionToday();
  const dietExists = hasDietSaved();
  const todayEmpty = isTodayEmpty();

  // Calcula totais do dia
  const totals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, g = 0;
    
    for (const meal of today.meals) {
      for (const entry of meal.entries) {
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
  }, [today, refreshKey]);

  // Calcula gaps (faltas)
  const gaps = useMemo(() => ({
    kcal: goals.kcalTarget - totals.kcal,
    p: goals.pTarget - totals.p,
    c: goals.cTarget - totals.c,
    g: goals.gTarget - totals.g,
  }), [goals, totals]);

  // Calcula kcal por refeição
  const getMealKcal = (mealId: string) => {
    const meal = today.meals.find(m => m.id === mealId);
    if (!meal) return 0;
    
    let total = 0;
    for (const entry of meal.entries) {
      const food = getFoodById(entry.foodId);
      if (food) {
        const fator = entry.quantidade / food.porcaoBase;
        total += food.kcal * fator;
      }
    }
    return Math.round(total);
  };

  const handleApplyDiet = () => {
    applyDietToToday();
    setRefreshKey(k => k + 1);
    toast.success("Dieta aplicada ao dia!");
  };

  const handleEditItem = (mealId: string, entryId: string, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop") => {
    setEditingItem({ mealId, entryId, foodId, quantidade, unidade });
  };

  const handleSaveEdit = (newQuantity: number) => {
    if (editingItem) {
      updateFoodInToday(editingItem.mealId, editingItem.entryId, newQuantity);
      setRefreshKey(k => k + 1);
      toast.success("Quantidade atualizada");
    }
  };

  const handleRemoveFromEdit = () => {
    if (editingItem) {
      removeFoodFromToday(editingItem.mealId, editingItem.entryId);
      setRefreshKey(k => k + 1);
      toast.success("Alimento removido");
    }
  };

  // Progress percentages
  const kcalPct = Math.min((totals.kcal / goals.kcalTarget) * 100, 100);
  const pPct = Math.min((totals.p / goals.pTarget) * 100, 100);
  const cPct = Math.min((totals.c / goals.cTarget) * 100, 100);
  const gPct = Math.min((totals.g / goals.gTarget) * 100, 100);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Nutrição</h1>

        {/* Card 1: Meta diária */}
        <div className="card-glass p-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Meta diária</span>
            <button
              onClick={() => setShowGoalsModal(true)}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <HelpCircle size={14} />
            </button>
          </div>
          
          <div className="flex items-center justify-between mt-1 mb-3">
            <h2 className="text-xl font-semibold text-foreground">Calorias</h2>
            <span className="text-lg font-medium text-foreground">
              {totals.kcal} / {goals.kcalTarget} kcal
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2 rounded-full overflow-hidden bg-muted/30 mb-3">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${kcalPct}%` }} 
            />
          </div>

          {/* Macro breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-pink-500">Proteína</span>
                <span className="text-muted-foreground">{totals.p}g / {goals.pTarget}g</span>
              </div>
              <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 transition-all" style={{ width: `${pPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">Carbs</span>
                <span className="text-muted-foreground">{totals.c}g / {goals.cTarget}g</span>
              </div>
              <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${cPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-400">Gordura</span>
                <span className="text-muted-foreground">{totals.g}g / {goals.gTarget}g</span>
              </div>
              <div className="w-20 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 transition-all" style={{ width: `${gPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Apply diet button */}
        {dietExists && todayEmpty && (
          <button
            onClick={handleApplyDiet}
            className="w-full card-glass flex items-center justify-center gap-2 py-3 rounded-2xl border border-primary/30 hover:border-primary/50 transition-colors mb-4"
          >
            <Copy size={18} className="text-primary" />
            <span className="text-foreground font-medium">Aplicar dieta de hoje</span>
          </button>
        )}

        {/* Card 2: Alimentos de hoje */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Alimentos de hoje</h2>
            <Link
              to="/nutricao/adicionar-alimento"
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={16} />
              <span>Adicionar</span>
            </Link>
          </div>
          
          {todayEmpty ? (
            <div className="bg-muted/20 rounded-2xl border border-border/50 p-6 flex flex-col items-center">
              <Link
                to="/nutricao/adicionar-alimento"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/50 text-primary hover:bg-primary/10 transition-colors mb-4"
              >
                <Plus size={18} />
                <span className="font-medium">Adicionar alimento</span>
              </Link>
              
              <p className="text-muted-foreground text-center text-sm">
                Nenhum alimento registrado hoje
              </p>
              <p className="text-muted-foreground text-center text-sm">
                Toque em "Adicionar alimento" para começar
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {today.meals.map((meal) => {
                if (meal.entries.length === 0) return null;
                const mealKcal = getMealKcal(meal.id);
                
                return (
                  <div key={meal.id} className="bg-muted/20 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{meal.nome}</span>
                      <span className="text-sm text-muted-foreground">{mealKcal} kcal</span>
                    </div>
                    <div className="space-y-1">
                      {meal.entries.map((entry) => {
                        const food = getFoodById(entry.foodId);
                        if (!food) return null;
                        const fator = entry.quantidade / food.porcaoBase;
                        const entryKcal = Math.round(food.kcal * fator);
                        
                        return (
                          <button
                            key={entry.id}
                            onClick={() => handleEditItem(meal.id, entry.id, entry.foodId, entry.quantidade, entry.unidade)}
                            className="w-full flex items-center justify-between text-sm hover:bg-muted/30 rounded-lg p-1.5 -mx-1.5 transition-colors text-left"
                          >
                            <span className="text-muted-foreground">
                              {food.nome} — {entry.quantidade}{entry.unidade === "un" ? " un" : entry.unidade === "scoop" ? " scoop" : ` ${entry.unidade}`}
                            </span>
                            <span className="text-muted-foreground">{entryKcal} kcal</span>
                          </button>
                        );
                      })}
                    </div>
                    <Link
                      to={`/nutricao/adicionar-alimento?mealId=${meal.id}`}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors mt-2"
                    >
                      <Plus size={14} />
                      <span>Adicionar</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Spacer to push CTA up from bottom nav */}
        <div className="h-16" />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-28 left-0 right-0 px-4 z-20">
        <div className="max-w-md mx-auto">
          <Link
            to="/nutricao/criar-dieta"
            className="w-full card-glass flex items-center justify-center gap-2 py-4 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Plus size={20} className="text-primary" />
            <span className="text-foreground font-medium">
              {dietExists ? "Ver/editar minha dieta" : "Criar minha dieta"}
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />

      {/* Edit food modal */}
      {editingItem && (
        <EditFoodModal
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          foodId={editingItem.foodId}
          currentQuantity={editingItem.quantidade}
          currentUnidade={editingItem.unidade}
          onSave={handleSaveEdit}
          onRemove={handleRemoveFromEdit}
        />
      )}

      {/* Goals explain modal */}
      <GoalsExplainModal
        open={showGoalsModal}
        onClose={() => setShowGoalsModal(false)}
      />
    </div>
  );
};

export default Nutricao;
