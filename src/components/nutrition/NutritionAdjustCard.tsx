import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb, Plus } from "lucide-react";
import { getFoodById, foods, type FoodItem } from "@/data/foods";
import { addFoodToToday } from "@/lib/storage";
import { toast } from "sonner";

interface MacroGaps {
  kcal: number;
  p: number;
  c: number;
  g: number;
}

interface NutritionAdjustCardProps {
  gaps: MacroGaps;
  onFoodAdded: () => void;
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

function getSuggestions(gaps: MacroGaps): { food: FoodItem; qty: number; kcal: number; p: number; c: number; g: number }[] {
  // Determinar qual macro tem maior falta
  const priorities: ("p" | "c" | "g")[] = [];
  
  if (gaps.p > 10) priorities.push("p");
  if (gaps.c > 20) priorities.push("c");
  if (gaps.g > 5) priorities.push("g");
  
  // Se não há faltas significativas, sugerir baseado em kcal
  if (priorities.length === 0 && gaps.kcal > 100) {
    priorities.push("p", "c");
  }
  
  const suggestions: { food: FoodItem; qty: number; kcal: number; p: number; c: number; g: number }[] = [];
  
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

const NutritionAdjustCard = ({ gaps, onFoodAdded }: NutritionAdjustCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasDeficit = gaps.kcal > 50 || gaps.p > 5 || gaps.c > 10 || gaps.g > 5;
  const hasExcess = gaps.kcal < -100 || gaps.p < -20 || gaps.c < -30 || gaps.g < -15;
  
  if (!hasDeficit && !hasExcess) return null;
  
  const suggestions = getSuggestions(gaps);
  
  const handleAddSuggestion = (foodId: string, qty: number, unidade: "g" | "un" | "ml" | "scoop") => {
    addFoodToToday("lanche", foodId, qty, unidade, "extra");
    toast.success("Adicionado ao Lanche!");
    onFoodAdded();
  };
  
  const formatGap = (value: number, suffix: string) => {
    if (value > 0) return `+${value}${suffix}`;
    return `${value}${suffix}`;
  };
  
  return (
    <div className="card-glass p-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Lightbulb size={18} className="text-yellow-400" />
          <span className="font-medium text-foreground">Ajuste necessário</span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-muted-foreground" />
        ) : (
          <ChevronDown size={18} className="text-muted-foreground" />
        )}
      </button>
      
      {/* Gap summary */}
      <div className="flex flex-wrap gap-2 mt-2 text-xs">
        {hasDeficit ? (
          <>
            {gaps.kcal > 50 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                Faltam {gaps.kcal} kcal
              </span>
            )}
            {gaps.p > 5 && (
              <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">
                P {formatGap(gaps.p, "g")}
              </span>
            )}
            {gaps.c > 10 && (
              <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400">
                C {formatGap(gaps.c, "g")}
              </span>
            )}
            {gaps.g > 5 && (
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                G {formatGap(gaps.g, "g")}
              </span>
            )}
          </>
        ) : hasExcess ? (
          <>
            {gaps.kcal < -100 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                Excesso {Math.abs(gaps.kcal)} kcal
              </span>
            )}
            {gaps.p < -20 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                P {formatGap(gaps.p, "g")}
              </span>
            )}
            {gaps.c < -30 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                C {formatGap(gaps.c, "g")}
              </span>
            )}
            {gaps.g < -15 && (
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">
                G {formatGap(gaps.g, "g")}
              </span>
            )}
          </>
        ) : null}
      </div>
      
      {/* Suggestions */}
      {isOpen && hasDeficit && suggestions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/30">
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
                    +{s.kcal} kcal • P {s.p}g • C {s.c}g • G {s.g}g
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
  );
};

export default NutritionAdjustCard;
