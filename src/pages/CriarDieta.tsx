import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Info, HelpCircle } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { 
  getNutritionGoals, 
  getNutritionDiet, 
  saveNutritionDiet, 
  removeFoodFromDiet,
  updateFoodInDiet,
  DEFAULT_MEALS,
  type NutritionDiet,
  type DietMeal
} from "@/lib/storage";
import { getFoodById } from "@/data/foods";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import NutritionAdjustCard from "@/components/nutrition/NutritionAdjustCard";
import EditFoodModal from "@/components/nutrition/EditFoodModal";
import GoalsExplainModal from "@/components/nutrition/GoalsExplainModal";

const CriarDieta = () => {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    mealId: string;
    index: number;
    foodId: string;
    quantidade: number;
    unidade: "g" | "un" | "ml" | "scoop";
  } | null>(null);
  
  const goals = getNutritionGoals();
  const existingDiet = getNutritionDiet();
  
  // Inicializa dieta se não existir
  const diet: NutritionDiet = existingDiet || {
    meals: DEFAULT_MEALS.map(m => ({ id: m.id, nome: m.nome, items: [] })),
  };

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

  // Calcula kcal por refeição
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

  const handleSave = () => {
    saveNutritionDiet(diet);
    toast.success("Dieta salva com sucesso!");
    navigate("/nutricao");
  };

  const handleRemoveItem = (mealId: string, index: number) => {
    removeFoodFromDiet(mealId, index);
    setRefreshKey(k => k + 1);
    toast.success("Alimento removido");
  };

  const handleEditItem = (mealId: string, index: number, foodId: string, quantidade: number, unidade: "g" | "un" | "ml" | "scoop") => {
    setEditingItem({ mealId, index, foodId, quantidade, unidade });
  };

  const handleSaveEdit = (newQuantity: number) => {
    if (editingItem) {
      updateFoodInDiet(editingItem.mealId, editingItem.index, newQuantity);
      setRefreshKey(k => k + 1);
      toast.success("Quantidade atualizada");
    }
  };

  const handleRemoveFromEdit = () => {
    if (editingItem) {
      removeFoodFromDiet(editingItem.mealId, editingItem.index);
      setRefreshKey(k => k + 1);
      toast.success("Alimento removido");
    }
  };

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
            <p className="text-sm text-muted-foreground">Monte um padrão para seus dias</p>
          </div>
        </div>

        {/* Card: Meta diária */}
        <div className="card-glass p-4 mt-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Meta diária</h2>
              <button
                onClick={() => setShowGoalsModal(true)}
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                <HelpCircle size={16} />
              </button>
            </div>
            {totals.kcal > 0 && (
              <span className={`px-2 py-1 text-xs font-medium rounded-lg ${
                Math.abs(totals.kcal - goals.kcalTarget) <= 200 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-yellow-500/20 text-yellow-400"
              }`}>
                {Math.abs(totals.kcal - goals.kcalTarget) <= 200 ? "Meta segura" : "Ajuste necessário"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.kcal || goals.kcalTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.kcalTarget} kcal</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">{totals.p || goals.pTarget}</span>
              <span className="text-sm text-muted-foreground">/ {goals.pTarget}g proteína</span>
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

        {/* Ajuste necessário card */}
        <NutritionAdjustCard 
          gaps={gaps} 
          onFoodAdded={() => setRefreshKey(k => k + 1)}
          mode="diet"
        />

        {/* Seção: Refeições */}
        <h2 className="text-lg font-semibold text-foreground mb-3">Refeições</h2>

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
                          <span className="text-muted-foreground">—</span>
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
            Você pode seguir esta dieta como base e registrar extras no dia.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors mt-6"
        >
          Salvar minha dieta
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
