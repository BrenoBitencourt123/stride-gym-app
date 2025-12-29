import { Link, useNavigate } from "react-router-dom";
import { Plus, CheckCircle2, RotateCcw, Check } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import HelpIcon from "@/components/HelpIcon";
import { 
  getNutritionGoals, 
  getNutritionToday, 
  hasDietSaved, 
  removeFoodFromToday,
  updateFoodInToday,
  toggleFoodConsumed,
  resetNutritionToday,
  isNutritionCompletedToday
} from "@/lib/storage";
import { getFoodById } from "@/data/foods";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import EditFoodModal from "@/components/nutrition/EditFoodModal";
import GoalsExplainModal from "@/components/nutrition/GoalsExplainModal";
import { Checkbox } from "@/components/ui/checkbox";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const Nutricao = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
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
  const nutritionCompleted = isNutritionCompletedToday();

  // Calcula totais CONSUMIDOS do dia
  const consumedTotals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, g = 0;
    
    for (const meal of today.meals) {
      for (const entry of meal.entries) {
        if (!entry.consumed) continue; // Só conta os consumidos
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

  // Calcula totais PLANEJADOS do dia (dieta)
  const plannedTotals = useMemo(() => {
    let kcal = 0, p = 0, c = 0, g = 0;
    
    for (const meal of today.meals) {
      for (const entry of meal.entries) {
        if (!entry.planned) continue; // Só conta os planejados
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

  // Calcula kcal por refeição
  const getMealKcal = (mealId: string, onlyConsumed: boolean = false) => {
    const meal = today.meals.find(m => m.id === mealId);
    if (!meal) return 0;
    
    let total = 0;
    for (const entry of meal.entries) {
      if (onlyConsumed && !entry.consumed) continue;
      const food = getFoodById(entry.foodId);
      if (food) {
        const fator = entry.quantidade / food.porcaoBase;
        total += food.kcal * fator;
      }
    }
    return Math.round(total);
  };

  // Refeição completa quando todos os itens PLANEJADOS foram consumidos
  const isMealComplete = (mealId: string) => {
    const meal = today.meals.find(m => m.id === mealId);
    if (!meal) return false;
    
    const plannedItems = meal.entries.filter(e => e.planned);
    if (plannedItems.length === 0) return false;
    
    return plannedItems.every(e => e.consumed === true);
  };

  const handleToggleConsumed = (mealId: string, entryId: string) => {
    toggleFoodConsumed(mealId, entryId);
    setRefreshKey(k => k + 1);
    triggerSync(); // Sync when food is consumed
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

  // Verifica se tem algum item no dia
  const hasAnyItems = today.meals.some(m => m.entries.length > 0);

  // Resetar checklist do dia
  const handleResetDay = () => {
    resetNutritionToday();
    setRefreshKey(k => k + 1);
    toast.success("Checklist do dia resetado");
  };

  // Critério para permitir concluir a nutrição:
  // Jantar (última refeição) deve estar com "Check!" (todos planejados consumidos)
  const jantarComplete = isMealComplete("jantar");
  const canComplete = jantarComplete && hasAnyItems && !nutritionCompleted;

  // Progress percentages - agora baseados no PLANO DO DIA como referência
  const planHasValues = plannedTotals.kcal > 0;
  const kcalPct = planHasValues 
    ? Math.min((consumedTotals.kcal / plannedTotals.kcal) * 100, 100) 
    : 0;
  const pPct = plannedTotals.p > 0 
    ? Math.min((consumedTotals.p / plannedTotals.p) * 100, 100) 
    : 0;
  const cPct = plannedTotals.c > 0 
    ? Math.min((consumedTotals.c / plannedTotals.c) * 100, 100) 
    : 0;
  const gPct = plannedTotals.g > 0 
    ? Math.min((consumedTotals.g / plannedTotals.g) * 100, 100) 
    : 0;

  // Cálculo de divergência entre Meta e Plano
  const metaPlanDiff = goals.kcalTarget - plannedTotals.kcal;
  const showDivergenceWarning = planHasValues && Math.abs(metaPlanDiff) > 100;

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

        {/* Card 1: Resumo simplificado - Consumido / Plano */}
        <div className="card-glass p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Resumo do dia</h2>
            <Link 
              to="/settings/objetivo" 
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Ver metas calculadas →
            </Link>
          </div>
          
          {/* Consumido / Plano do dia */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Consumido hoje</span>
            <span className="text-sm font-bold text-primary">
              {consumedTotals.kcal} / {planHasValues ? plannedTotals.kcal : goals.kcalTarget} kcal
            </span>
          </div>

          {/* Progress bar principal */}
          <div className="h-2.5 rounded-full overflow-hidden bg-muted/30 mb-4">
            <div 
              className="h-full bg-primary transition-all duration-300" 
              style={{ width: `${kcalPct}%` }} 
            />
          </div>

          {/* Macro breakdown com progress bars - referência é o PLANO */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-pink-500 font-medium">Proteína</span>
                <span className="text-muted-foreground">
                  {consumedTotals.p}g / {planHasValues ? plannedTotals.p : goals.pTarget}g
                </span>
              </div>
              <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-pink-500 transition-all" style={{ width: `${pPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 font-medium">Carbs</span>
                <span className="text-muted-foreground">
                  {consumedTotals.c}g / {planHasValues ? plannedTotals.c : goals.cTarget}g
                </span>
              </div>
              <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 transition-all" style={{ width: `${cPct}%` }} />
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-blue-400 font-medium">Gordura</span>
                <span className="text-muted-foreground">
                  {consumedTotals.g}g / {planHasValues ? plannedTotals.g : goals.gTarget}g
                </span>
              </div>
              <div className="w-24 h-1.5 bg-muted/30 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 transition-all" style={{ width: `${gPct}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Aviso de divergência Meta vs Plano */}
        {showDivergenceWarning && (
          <div className={`rounded-xl p-3 mb-4 flex items-start gap-3 ${
            metaPlanDiff > 0 
              ? 'bg-yellow-500/10 border border-yellow-500/30' 
              : 'bg-orange-500/10 border border-orange-500/30'
          }`}>
            <span className="text-lg mt-0.5">{metaPlanDiff > 0 ? '📉' : '📈'}</span>
            <div className="flex-1">
              <p className="text-sm text-foreground mb-2">
                {metaPlanDiff > 0 
                  ? `Seu plano está ~${Math.abs(metaPlanDiff)} kcal abaixo da meta. Quer completar?`
                  : `Seu plano está ~${Math.abs(metaPlanDiff)} kcal acima da meta. Quer ajustar?`
                }
              </p>
              <Link
                to={metaPlanDiff > 0 
                  ? "/nutricao/adicionar-alimento?mealId=lanche" 
                  : "/nutricao/criar-dieta"
                }
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {metaPlanDiff > 0 ? (
                  <>
                    <Plus size={14} />
                    Adicionar lanche
                  </>
                ) : (
                  <>
                    Ajustar refeições
                  </>
                )}
              </Link>
            </div>
          </div>
        )}

        {/* Card 2: Refeições de hoje */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Refeições de hoje</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleResetDay}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                title="Resetar checklist do dia"
              >
                <RotateCcw size={14} />
              </button>
              <Link
                to="/nutricao/adicionar-alimento"
                className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={16} />
                <span>Adicionar</span>
              </Link>
            </div>
          </div>
          
          {!hasAnyItems ? (
            <div className="bg-muted/20 rounded-2xl border border-border/50 p-6 flex flex-col items-center">
              <p className="text-muted-foreground text-center text-sm mb-2">
                Nenhuma dieta cadastrada ainda.
              </p>
              <Link
                to="/nutricao/criar-dieta"
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/50 text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus size={18} />
                <span className="font-medium">Criar minha dieta</span>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Hint quando consumido = 0 */}
              {consumedTotals.kcal === 0 && hasAnyItems && (
                <div className="bg-primary/10 border border-primary/30 rounded-xl p-3 flex items-start gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-primary text-xs">💡</span>
                  </div>
                  <p className="text-sm text-foreground/80">
                    Toque nos itens para marcar como consumido. O total atualiza automaticamente.
                  </p>
                </div>
              )}
              {today.meals.map((meal) => {
                if (meal.entries.length === 0) return null;
                const mealKcal = getMealKcal(meal.id);
                const mealComplete = isMealComplete(meal.id);
                
                return (
                  <div 
                    key={meal.id} 
                    className={`rounded-xl p-3 transition-all ${
                      mealComplete 
                        ? 'bg-primary/10 border border-primary/30' 
                        : 'bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{meal.nome}</span>
                        {mealComplete && (
                          <span className="flex items-center gap-1 text-xs text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={12} />
                            Check!
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">{mealKcal} kcal</span>
                    </div>
                    <div className="space-y-1">
                      {meal.entries.map((entry) => {
                        const food = getFoodById(entry.foodId);
                        if (!food) return null;
                        const fator = entry.quantidade / food.porcaoBase;
                        const entryKcal = Math.round(food.kcal * fator);
                        
                        return (
                          <div
                            key={entry.id}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={entry.consumed || false}
                              onCheckedChange={() => handleToggleConsumed(meal.id, entry.id)}
                              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <button
                              onClick={() => handleEditItem(meal.id, entry.id, entry.foodId, entry.quantidade, entry.unidade)}
                              className={`flex-1 flex items-center justify-between hover:bg-muted/30 rounded-lg p-1.5 -my-0.5 transition-colors text-left ${
                                entry.consumed ? 'line-through opacity-60' : ''
                              }`}
                            >
                              <span className="text-muted-foreground">
                                {food.nome} — {entry.quantidade}{entry.unidade === "un" ? " un" : entry.unidade === "scoop" ? " scoop" : ` ${entry.unidade}`}
                                {!entry.planned && (
                                  <span className="ml-1 text-xs text-primary/70">(extra)</span>
                                )}
                              </span>
                              <span className="text-muted-foreground">{entryKcal} kcal</span>
                            </button>
                          </div>
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

        {/* Botão Finalizar nutrição ou badge de concluído */}
        {nutritionCompleted ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/20 border border-primary/50 mb-4">
            <Check size={18} className="text-primary" />
            <span className="text-primary font-medium">Nutrição de hoje concluída ✓</span>
          </div>
        ) : canComplete ? (
          <button
            onClick={() => navigate("/nutricao/resumo")}
            className="w-full cta-button flex items-center justify-center gap-2 mb-4"
          >
            <span className="font-semibold">Finalizar nutrição de hoje</span>
          </button>
        ) : null}

        {/* Bottom CTA - In content flow */}
        <Link
          to="/nutricao/criar-dieta"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors mb-6"
        >
          <Plus size={18} className="text-primary" />
          <span className="text-foreground font-medium">
            {dietExists ? "Ver/editar minha dieta" : "Criar minha dieta"}
          </span>
        </Link>
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
