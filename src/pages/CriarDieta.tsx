import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Info, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import HelpIcon from "@/components/HelpIcon";
import { getFoodById } from "@/data/foods";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import NutritionAdjustCard from "@/components/nutrition/NutritionAdjustCard";
import EditFoodModal from "@/components/nutrition/EditFoodModal";
import GoalsExplainModal from "@/components/nutrition/GoalsExplainModal";
import { useNutrition, useAppStateContext } from "@/contexts/AppStateContext";
import type { NutritionDiet, DietMeal, TodayEntry, NutritionToday } from "@/lib/appState";

// Default meals template
const DEFAULT_MEALS: DietMeal[] = [
  { id: "cafe", nome: "Caf\u00e9 da Manh\u00e3", items: [] },
  { id: "almoco", nome: "Almo\u00e7o", items: [] },
  { id: "lanche", nome: "Lanche", items: [] },
  { id: "jantar", nome: "Jantar", items: [] },
];

function applyDietToTodayData(dietPlan: NutritionDiet, dateKey: string): NutritionToday {
  const today: NutritionToday = {
    dateKey,
    meals: DEFAULT_MEALS.map(m => ({ id: m.id, nome: m.nome, entries: [] })),
  };
  
  for (const dietMeal of dietPlan.meals) {
    const todayMeal = today.meals.find(m => m.id === dietMeal.id);
    if (!todayMeal) continue;
    
    for (const item of dietMeal.items) {
      const entry: TodayEntry = {
        id: `${item.foodId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        foodId: item.foodId,
        quantidade: item.quantidade,
        unidade: item.unidade,
        source: "diet",
        createdAt: Date.now(),
        planned: true,
        consumed: false,
      };
      todayMeal.entries.push(entry);
    }
  }
  
  return today;
}

const CriarDieta = () => {
  const navigate = useNavigate();
  const { loading } = useAppStateContext();
  const { targets, dietPlan, updateDietPlan, updateToday } = useNutrition();
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    mealId: string;
    index: number;
    foodId: string;
    quantidade: number;
    unidade: "g" | "un" | "ml" | "scoop";
  } | null>(null);
  
  // Local diet state for editing
  const [localDiet, setLocalDiet] = useState<NutritionDiet | null>(null);
  
  // Initialize local diet from context
  const diet: NutritionDiet = useMemo(() => {
    if (localDiet) return localDiet;
    if (dietPlan) return dietPlan;
    return { meals: DEFAULT_MEALS.map(m => ({ id: m.id, nome: m.nome, items: [] })) };
  }, [localDiet, dietPlan]);
  
  // Goals from targets or defaults
  const goals = useMemo(() => ({
    kcalTarget: targets?.kcal || 2050,
    pTarget: targets?.protein || 160,
    cTarget: targets?.carbs || 200,
    gTarget: targets?.fats || 65,
  }), [targets]);

  // Calcula totais da dieta
  const totals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, g = 0;
    
    for (const meal of diet.meals) {
      for (const item of meal.items) {
        const food = getFoodById(item.foodId);
        if (food) {
          const fator = item.quantidade / food.porcaoBase;
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
  }, [diet, refreshKey]);

  // Calcula gaps (faltas)
  const gaps = useMemo(() => ({
    kcal: goals.kcalTarget - totals.kcal,
    p: goals.pTarget - totals.p,
    c: goals.cTarget - totals.c,
    g: goals.gTarget - totals.g,
  }), [goals, totals]);

  // Calcula kcal por refeicao
  const getMealKcal = (meal: DietMeal) => {
    let total = 0;
    for (const item of meal.items) {
      const food = getFoodById(item.foodId);
      if (food) {
        const fator = item.quantidade / food.porcaoBase;
        total += food.kcal * fator;
      }
    }
    return Math.round(total);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save diet plan to Firebase
      await updateDietPlan(diet);
      
      // Reset today and apply the new diet template
      const todayDateKey = new Date().toISOString().split("T")[0];
      const newToday = applyDietToTodayData(diet, todayDateKey);
      await updateToday(newToday);
      
      toast.success("Dieta salva com sucesso!");
      navigate("/nutricao");
    } catch (error) {
      console.error('[CriarDieta] Error saving diet:', error);
      toast.error("Erro ao salvar dieta");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveItem = (mealId: string, index: number) => {
    const newDiet = {
      ...diet,
      meals: diet.meals.map(meal => {
        if (meal.id !== mealId) return meal;
        return {
          ...meal,
          items: meal.items.filter((_, i) => i !== index)
        };
      })
    };
    setLocalDiet(newDiet);
    setRefreshKey(k => k + 1);
    toast.success("Alimento removido");
  };

  const handleEditItem = (mealId: string, index: number, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop") => {
    setEditingItem({ mealId, index, foodId, quantidade, unidade });
  };

  const handleSaveEdit = (newQuantity: number, newUnidade?: "g" | "un" | "ml" | "scoop") => {
    if (!editingItem) return;
    
    const newDiet = {
      ...diet,
      meals: diet.meals.map(meal => {
        if (meal.id !== editingItem.mealId) return meal;
        return {
          ...meal,
          items: meal.items.map((item, i) => {
            if (i !== editingItem.index) return item;
            return { ...item, quantidade: newQuantity, unidade: newUnidade || editingItem.unidade };
          })
        };
      })
    };
    setLocalDiet(newDiet);
    setRefreshKey(k => k + 1);
    toast.success("Quantidade atualizada");
  };

  const handleRemoveFromEdit = () => {
    if (!editingItem) return;
    handleRemoveItem(editingItem.mealId, editingItem.index);
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const existingDiet = dietPlan && dietPlan.meals.some(m => m.items.length > 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/nutricao"
            className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {existingDiet ? "Minha dieta" : "Criar minha dieta"}
            </h1>
            <p className="text-sm text-muted-foreground">Monte um padr\u00e3o para seus dias</p>
          </div>
        </div>

        {/* Card: Meta diaria */}
        <div className="card-glass p-4 mt-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Meta di\u00e1ria</h2>
              <HelpIcon helpKey="nutri.goals" size={16} />
            </div>
            {totals.kcal > 0 && (
              <div className="flex items-center gap-1.5">
                <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                  Math.abs(totals.kcal - goals.kcalTarget) <= 200 
                    ? "bg-green-500/20 text-green-400" 
                    : "bg-yellow-500/20 text-yellow-400"
                }`}>
                  {Math.abs(totals.kcal - goals.kcalTarget) <= 200 ? "Meta segura" : "Ajuste necess\u00e1rio"}
                </span>
                <HelpIcon helpKey={Math.abs(totals.kcal - goals.kcalTarget) <= 200 ? "nutri.metaSegura" : "nutri.ajuste"} size={14} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.kcal || goals.kcalTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.kcalTarget} kcal</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.p || goals.pTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.pTarget}g prote\u00edna</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.c || goals.cTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.cTarget}g carbo</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.g || goals.gTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.gTarget}g gorduras</span>
            </div>
          </div>
        </div>

        {/* Ajuste necessario card */}
        <NutritionAdjustCard 
          gaps={gaps} 
          onFoodAdded={() => setRefreshKey(k => k + 1)}
          mode="diet"
        />

        {/* Secao: Refeicoes */}
        <h2 className="text-lg font-semibold text-foreground mb-3">Refei\u00e7\u00f5es</h2>

        <div className="space-y-3">
          {diet.meals.map((meal) => (
            <div key={meal.id} className="card-glass p-4">
              {/* Meal header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{meal.nome}</h3>
                <span className="text-sm text-muted-foreground">{getMealKcal(meal)} kcal</span>
              </div>

              {/* Food items */}
              {meal.items.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {meal.items.map((item, idx) => {
                    const food = getFoodById(item.foodId);
                    if (!food) return null;
                    const fator = item.quantidade / food.porcaoBase;
                    const itemKcal = Math.round(food.kcal * fator);
                    
                    return (
                      <button
                        key={idx}
                        onClick={() => handleEditItem(meal.id, idx, item.foodId, item.quantidade, item.unidade)}
                        className="w-full flex items-center justify-between text-sm hover:bg-muted/20 rounded-lg p-1.5 -mx-1.5 transition-colors text-left"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-foreground">{food.nome}</span>
                          <span className="text-muted-foreground">\u2014</span>
                          <span className="text-muted-foreground">
                            {item.quantidade}{item.unidade === "un" ? " un" : item.unidade === "scoop" ? " scoop" : ` ${item.unidade}`}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{itemKcal} kcal</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-3">Nenhum alimento adicionado</p>
              )}

              {/* Add food button */}
              <Link 
                to={`/nutricao/adicionar-alimento?mealId=${meal.id}&mode=diet`}
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar alimento</span>
              </Link>
            </div>
          ))}
        </div>

        {/* Card: Como funciona */}
        <div className="card-glass p-4 mt-4 flex items-start gap-3">
          <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Voc\u00ea pode seguir esta dieta como base e registrar extras no dia.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors mt-6 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Salvando...
            </>
          ) : (
            "Salvar minha dieta"
          )}
        </button>
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

export default CriarDieta;
