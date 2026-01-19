import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Plus, Wand2, Sparkles } from "lucide-react";
import { getFoodById, foods, type FoodItem } from "@/data/foods";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import HelpIcon from "@/components/HelpIcon";
import { useNutrition } from "@/contexts/AppStateContext";
import type { NutritionDiet, NutritionToday, TodayEntry } from "@/lib/appState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MacroGaps {
  kcal: number;
  p: number;
  c: number;
  g: number;
}

interface NutritionAdjustCardProps {
  gaps: MacroGaps;
  onFoodAdded: () => void;
  mode?: "diet" | "today"; // "diet" = adiciona na dieta, "today" = adiciona no consumo do dia
}

// Alimentos "curinga" para sugestões
const SUGGESTION_FOODS: { foodId: string; suggestedQty: number; priority: "p" | "c" | "g" | "kcal" }[] = [
  { foodId: "whey-protein", suggestedQty: 1, priority: "p" },
  { foodId: "frango-grelhado", suggestedQty: 150, priority: "p" },
  { foodId: "ovo-inteiro", suggestedQty: 2, priority: "p" },
  { foodId: "iogurte-grego", suggestedQty: 170, priority: "p" },
  { foodId: "arroz-cozido", suggestedQty: 150, priority: "c" },
  { foodId: "banana", suggestedQty: 1, priority: "c" },
  { foodId: "aveia-flocos", suggestedQty: 40, priority: "c" },
  { foodId: "pao-integral", suggestedQty: 2, priority: "c" },
  { foodId: "azeite-oliva", suggestedQty: 15, priority: "g" },
  { foodId: "castanha-caju", suggestedQty: 30, priority: "g" },
  { foodId: "pasta-amendoim", suggestedQty: 30, priority: "g" },
  { foodId: "abacate", suggestedQty: 100, priority: "g" },
];

type MealId = "cafe" | "almoco" | "lanche" | "jantar";

const MEAL_LABELS: Record<MealId, string> = {
  cafe: "Café",
  almoco: "Almoço",
  lanche: "Lanche",
  jantar: "Jantar",
};

const DEFAULT_MEALS = [
  { id: "cafe", nome: "Café da Manhã" },
  { id: "almoco", nome: "Almoço" },
  { id: "lanche", nome: "Lanche" },
  { id: "jantar", nome: "Jantar" },
] as const;

function createEmptyToday(dateKey: string): NutritionToday {
  return {
    dateKey,
    meals: DEFAULT_MEALS.map((m) => ({ id: m.id, nome: m.nome, entries: [] })),
  };
}

function createEmptyDiet(): NutritionDiet {
  return {
    meals: DEFAULT_MEALS.map((m) => ({ id: m.id, nome: m.nome, items: [] })),
  };
}

interface ComboItem {
  food: FoodItem;
  qty: number;
  kcal: number;
  p: number;
  c: number;
  g: number;
}

function getSuggestions(gaps: MacroGaps): ComboItem[] {
  // Determinar qual macro tem maior falta
  const priorities: ("p" | "c" | "g")[] = [];
  
  if (gaps.p > 10) priorities.push("p");
  if (gaps.c > 20) priorities.push("c");
  if (gaps.g > 5) priorities.push("g");
  
  // Se não há faltas significativas, sugerir baseado em kcal
  if (priorities.length === 0 && gaps.kcal > 100) {
    priorities.push("p", "c");
  }
  
  const suggestions: ComboItem[] = [];
  
  for (const sf of SUGGESTION_FOODS) {
    if (suggestions.length >= 4) break;
    if (priorities.length > 0 && !priorities.includes(sf.priority as "p" | "c" | "g")) continue;
    
    const food = getFoodById(sf.foodId);
    if (!food) continue;
    
    const factor = sf.suggestedQty / food.porcaoBase;
    const kcal = Math.round(food.kcal * factor);
    const p = Math.round(food.p * factor);
    const c = Math.round(food.c * factor);
    const g = Math.round(food.g * factor);
    
    suggestions.push({ food, qty: sf.suggestedQty, kcal, p, c, g });
  }
  
  return suggestions;
}

// Gera um combo de 2-4 itens para preencher as faltas
function generateAutoAdjustCombo(gaps: MacroGaps): ComboItem[] {
  const combo: ComboItem[] = [];
  let remainingKcal = gaps.kcal;
  let remainingP = gaps.p;
  let remainingC = gaps.c;
  let remainingG = gaps.g;
  
  const usedFoods = new Set<string>();
  
  // Função auxiliar para adicionar item ao combo
  const addToCombo = (foodId: string, qty: number) => {
    if (usedFoods.has(foodId)) return false;
    const food = getFoodById(foodId);
    if (!food) return false;
    
    const factor = qty / food.porcaoBase;
    const item: ComboItem = {
      food,
      qty,
      kcal: Math.round(food.kcal * factor),
      p: Math.round(food.p * factor),
      c: Math.round(food.c * factor),
      g: Math.round(food.g * factor),
    };
    
    combo.push(item);
    usedFoods.add(foodId);
    remainingKcal -= item.kcal;
    remainingP -= item.p;
    remainingC -= item.c;
    remainingG -= item.g;
    return true;
  };
  
  // 1. Se falta proteína significativa, adicionar proteico
  if (remainingP > 10 && combo.length < 4) {
    if (remainingP > 25) {
      addToCombo("whey-protein", 1); // 1 scoop
    } else if (remainingP > 15) {
      addToCombo("frango-grelhado", 150);
    } else {
      addToCombo("iogurte-grego", 170);
    }
  }
  
  // 2. Se falta carbo, adicionar carboidrato
  if (remainingC > 20 && combo.length < 4) {
    if (remainingC > 40) {
      addToCombo("arroz-cozido", 200);
    } else if (remainingC > 25) {
      addToCombo("banana", 1);
    } else {
      addToCombo("aveia-flocos", 40);
    }
  }
  
  // 3. Se falta gordura, adicionar fonte de gordura
  if (remainingG > 5 && combo.length < 4) {
    if (remainingG > 15) {
      addToCombo("pasta-amendoim", 30);
    } else if (remainingG > 8) {
      addToCombo("castanha-caju", 20);
    } else {
      addToCombo("azeite-oliva", 10);
    }
  }
  
  // 4. Se ainda falta kcal (>100) ap??s os macros, completar
  if (remainingKcal > 100 && combo.length < 4) {
    if (remainingKcal > 200) {
      addToCombo("pao-integral", 2) || addToCombo("aveia-flocos", 50);
    } else {
      addToCombo("banana", 1) || addToCombo("pao-integral", 1);
    }
  }
  
  return combo;
}

const NutritionAdjustCard = ({ gaps, onFoodAdded, mode = "today" }: NutritionAdjustCardProps) => {
  const navigate = useNavigate();
  const { dietPlan, today, updateDietPlan, updateToday } = useNutrition();
  const [isOpen, setIsOpen] = useState(false);
  const [showAutoModal, setShowAutoModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealId>("lanche");
  
  const hasDeficit = gaps.kcal > 50 || gaps.p > 5 || gaps.c > 10 || gaps.g > 5;
  const hasExcess = gaps.kcal < -100 || gaps.p < -20 || gaps.c < -30 || gaps.g < -15;
  
  if (!hasDeficit && !hasExcess) return null;
  
  const suggestions = getSuggestions(gaps);
  const autoCombo = generateAutoAdjustCombo(gaps);
  
  const comboTotals = autoCombo.reduce(
    (acc, item) => ({
      kcal: acc.kcal + item.kcal,
      p: acc.p + item.p,
      c: acc.c + item.c,
      g: acc.g + item.g,
    }),
    { kcal: 0, p: 0, c: 0, g: 0 }
  );

  // Determina o que falta mais para mostrar recomendações simples
  const getActionableRecommendations = () => {
    const recs: { text: string; macro: "p" | "c" | "g" | "kcal"; value: number }[] = [];
    
    if (gaps.kcal > 100) {
      recs.push({ text: `Falta energia: +${gaps.kcal} kcal`, macro: "kcal", value: gaps.kcal });
    }
    if (gaps.p > 10) {
      recs.push({ text: `Falta proteína: +${gaps.p}g`, macro: "p", value: gaps.p });
    }
    if (gaps.c > 20) {
      recs.push({ text: `Falta carbo: +${gaps.c}g`, macro: "c", value: gaps.c });
    }
    if (gaps.g > 8) {
      recs.push({ text: `Falta gordura: +${gaps.g}g`, macro: "g", value: gaps.g });
    }
    
    return recs.slice(0, 3);
  };

  const recommendations = getActionableRecommendations();

  const todayKey = new Date().toISOString().split("T")[0];

  const getDietData = (): NutritionDiet => {
    if (!dietPlan) return createEmptyDiet();
    return {
      meals: dietPlan.meals.map((m) => ({
        ...m,
        items: [...m.items],
      })),
    };
  };

  const getTodayData = (): NutritionToday => {
    if (today && today.dateKey === todayKey) {
      return {
        ...today,
        meals: today.meals.map((m) => ({
          ...m,
          entries: [...m.entries],
        })),
      };
    }
    return createEmptyToday(todayKey);
  };

  const addFoodToDiet = async (
    mealId: MealId,
    foodId: string,
    quantidade: number,
    unidade: "g" | "un" | "ml" | "scoop"
  ) => {
    const diet = getDietData();
    const meal = diet.meals.find((m) => m.id === mealId);
    if (!meal) return;
    meal.items.push({ foodId, quantidade, unidade });
    await updateDietPlan(diet);
  };

  const addFoodToToday = async (
    mealId: MealId,
    foodId: string,
    quantidade: number,
    unidade: "g" | "un" | "ml" | "scoop",
    source: "diet" | "extra" | "auto"
  ) => {
    const current = getTodayData();
    const meal = current.meals.find((m) => m.id === mealId);
    if (!meal) return;
    const entry: TodayEntry = {
      id: `${foodId}-${Date.now()}`,
      foodId,
      quantidade,
      unidade,
      source,
      createdAt: Date.now(),
      planned: source === "diet",
      consumed: true,
    };
    meal.entries.push(entry);
    await updateToday(current);
  };

  const handleNavigateToAdd = (macroFilter?: "p" | "c" | "g") => {
    const params = new URLSearchParams();
    params.set("mode", mode);
    if (macroFilter) {
      params.set("filter", macroFilter);
    }
    navigate(`/nutricao/adicionar-alimento?${params.toString()}`);
  };
  
  const handleAddSuggestion = async (foodId: string, qty: number, unidade: "g" | "un" | "ml" | "scoop") => {
    if (mode === "diet") {
      await addFoodToDiet(selectedMeal, foodId, qty, unidade);
      toast.success(`Adicionado à dieta (${MEAL_LABELS[selectedMeal]})!`);
    } else {
      await addFoodToToday(selectedMeal, foodId, qty, unidade, "extra");
      toast.success(`Adicionado ao ${MEAL_LABELS[selectedMeal]}!`);
    }
    onFoodAdded();
  };
  
  const handleApplyAutoAdjust = async () => {
    for (const item of autoCombo) {
      await addFoodToToday(selectedMeal, item.food.id, item.qty, item.food.unidadeBase, "auto");
    }
    setShowAutoModal(false);
    toast.success(`${autoCombo.length} itens adicionados ao ${MEAL_LABELS[selectedMeal]}!`, {
      icon: <Sparkles size={16} className="text-primary" />,
    });
    onFoodAdded();
  };

  const formatGap = (value: number, suffix: string) => {
    if (value > 0) return `+${value}${suffix}`;
    return `${value}${suffix}`;
  };
  
  return (
    <>
      <div className="card-glass p-4 mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <Lightbulb size={18} className="text-yellow-400" />
            <span className="font-medium text-foreground">Ajuste necessário</span>
            <HelpIcon helpKey="nutri.ajuste" size={14} />
          </div>
          {isOpen ? (
            <ChevronUp size={18} className="text-muted-foreground" />
          ) : (
            <ChevronDown size={18} className="text-muted-foreground" />
          )}
        </button>
        
        {/* Recomendações simples e acionáveis (sempre visíveis) */}
        {hasDeficit && recommendations.length > 0 && (
          <div className="mt-3 space-y-2">
            {recommendations.map((rec, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between bg-muted/20 rounded-lg px-3 py-2"
              >
                <span className="text-sm text-foreground">{rec.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Botões de ação rápida (sempre visíveis quando há déficit) */}
        {hasDeficit && (
          <div className="flex flex-wrap gap-2 mt-3">
            {gaps.p > 10 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 text-pink-400 border-pink-400/30 hover:bg-pink-400/10"
                onClick={() => handleNavigateToAdd("p")}
              >
                <Plus size={14} />
                Proteína
              </Button>
            )}
            {gaps.c > 20 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                onClick={() => handleNavigateToAdd("c")}
              >
                <Plus size={14} />
                Carbo
              </Button>
            )}
            {gaps.g > 8 && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1 text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                onClick={() => handleNavigateToAdd("g")}
              >
                <Plus size={14} />
                Gordura
              </Button>
            )}
            {autoCombo.length > 0 && (
              <Button
                size="sm"
                className="text-xs gap-1.5 ml-auto"
                onClick={() => setShowAutoModal(true)}
              >
                <Wand2 size={14} />
                Ajustar auto
              </Button>
            )}
          </div>
        )}

        {hasExcess && (
          <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            <p className="text-sm text-red-400">
              Você está acima da meta. Considere reduzir porções ou remover itens.
            </p>
          </div>
        )}
        
        {/* Suggestions */}
        {isOpen && hasDeficit && suggestions.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/30">
            {/* Meal selector for suggestions */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-2">Adicionar em:</p>
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(MEAL_LABELS) as MealId[]).map((mealId) => (
                  <button
                    key={mealId}
                    onClick={() => setSelectedMeal(mealId)}
                    className={`py-1.5 px-1 text-xs rounded-lg transition-colors ${
                      selectedMeal === mealId
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {MEAL_LABELS[mealId]}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-xs text-muted-foreground mb-3">Sugestões para completar:</p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div
                  key={s.food.id}
                  className="flex items-center justify-between bg-muted/20 rounded-xl p-3"
                >
                  <div>
                    <span className="text-sm text-foreground font-medium">
                      {s.food.nome}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {s.qty}{s.food.unidadeBase === "un" ? " un" : s.food.unidadeBase === "scoop" ? " scoop" : ` ${s.food.unidadeBase}`}
                    </span>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      +{s.kcal} kcal . P {s.p}g . C {s.c}g . G {s.g}g
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSuggestion(s.food.id, s.qty, s.food.unidadeBase)}
                    className="p-2 rounded-lg bg-primary/20 hover:bg-primary/30 transition-colors"
                  >
                    <Plus size={16} className="text-primary" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {isOpen && hasExcess && (
          <div className="mt-4 pt-3 border-t border-border/30">
            <p className="text-xs text-muted-foreground">
              Você está acima da meta. Considere reduzir porções ou remover itens.
            </p>
          </div>
        )}
      </div>

      {/* Auto Adjust Modal */}
      <Dialog open={showAutoModal} onOpenChange={setShowAutoModal}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Wand2 size={20} className="text-primary" />
              Aplicar ajuste
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Gap summary */}
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Faltam para sua meta:</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {gaps.kcal > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                    {gaps.kcal} kcal
                  </span>
                )}
                {gaps.p > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">
                    P +{gaps.p}g
                  </span>
                )}
                {gaps.c > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                    C +{gaps.c}g
                  </span>
                )}
                {gaps.g > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    G +{gaps.g}g
                  </span>
                )}
              </div>
            </div>
            
            {/* Combo items */}
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Combo sugerido ({autoCombo.length} itens):
              </p>
              <div className="space-y-2">
                {autoCombo.map((item, index) => (
                  <div
                    key={`${item.food.id}-${index}`}
                    className="flex items-center justify-between bg-muted/20 rounded-xl p-3"
                  >
                    <div>
                      <span className="text-sm text-foreground font-medium">
                        {item.food.nome}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {item.qty}
                        {item.food.unidadeBase === "un" ? " un" : item.food.unidadeBase === "scoop" ? " scoop" : ` ${item.food.unidadeBase}`}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      +{item.kcal} kcal
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Combo totals */}
            <div className="bg-primary/10 rounded-xl p-3">
              <p className="text-xs text-muted-foreground mb-1">Total do combo:</p>
              <p className="text-sm font-medium text-foreground">
                +{comboTotals.kcal} kcal . P {comboTotals.p}g . C {comboTotals.c}g . G {comboTotals.g}g
              </p>
            </div>
            
            {/* Meal selector */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Adicionar em:</p>
              <div className="grid grid-cols-4 gap-1">
                {(Object.keys(MEAL_LABELS) as MealId[]).map((mealId) => (
                  <button
                    key={mealId}
                    onClick={() => setSelectedMeal(mealId)}
                    className={`py-2 px-1 text-xs rounded-lg transition-colors ${
                      selectedMeal === mealId
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    {MEAL_LABELS[mealId]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowAutoModal(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-1.5"
                onClick={handleApplyAutoAdjust}
              >
                <Sparkles size={14} />
                Aplicar ajuste
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NutritionAdjustCard;






