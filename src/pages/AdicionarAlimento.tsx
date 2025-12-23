import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Search, Minus, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { foods, searchFoods, type FoodItem } from "@/data/foods";
import { addFoodToToday, addFoodToDiet, DEFAULT_MEALS } from "@/lib/storage";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const AdicionarAlimento = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const mealId = searchParams.get("mealId");
  const mode = searchParams.get("mode"); // "diet" ou null (today)
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantidade, setQuantidade] = useState(0);
  const [selectedMealId, setSelectedMealId] = useState(mealId || "almoco");

  const filteredFoods = useMemo(() => searchFoods(searchQuery), [searchQuery]);

  const recentSuggestions = ["Arroz", "Frango", "Whey", "Banana", "Ovo"];

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setQuantidade(food.porcaoBase);
  };

  const handleAdd = () => {
    if (!selectedFood) return;
    
    if (mode === "diet") {
      addFoodToDiet(
        mealId || selectedMealId, 
        selectedFood.id, 
        quantidade, 
        selectedFood.unidadeBase
      );
      toast.success(`${selectedFood.nome} adicionado à dieta!`);
      navigate("/nutricao/criar-dieta");
    } else {
      addFoodToToday(
        mealId || selectedMealId, 
        selectedFood.id, 
        quantidade, 
        selectedFood.unidadeBase, 
        "extra"
      );
      toast.success(`${selectedFood.nome} adicionado!`);
      navigate("/nutricao");
    }
  };

  // Calcular macros ajustados
  const fator = selectedFood ? quantidade / selectedFood.porcaoBase : 0;
  const adjustedKcal = selectedFood ? Math.round(selectedFood.kcal * fator) : 0;
  const adjustedProtein = selectedFood ? Math.round(selectedFood.p * fator) : 0;
  const adjustedCarbs = selectedFood ? Math.round(selectedFood.c * fator) : 0;
  const adjustedFat = selectedFood ? Math.round(selectedFood.g * fator) : 0;

  // Incremento baseado na unidade
  const getIncrement = (unidade: string) => {
    switch (unidade) {
      case "g": return 10;
      case "ml": return 50;
      case "un": return 1;
      case "scoop": return 1;
      default: return 10;
    }
  };

  const increment = selectedFood ? getIncrement(selectedFood.unidadeBase) : 10;

  const formatQuantidade = () => {
    if (!selectedFood) return "";
    switch (selectedFood.unidadeBase) {
      case "un": return `${quantidade} un`;
      case "scoop": return `${quantidade} scoop`;
      case "ml": return `${quantidade} ml`;
      default: return `${quantidade} g`;
    }
  };

  const backUrl = mode === "diet" ? "/nutricao/criar-dieta" : "/nutricao";

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              to={backUrl}
              className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Adicionar alimento</h1>
          </div>
        </div>

        {/* Meal selector (quando não vem da query) */}
        {!mealId && (
          <div className="mb-4">
            <label className="text-sm text-muted-foreground mb-2 block">Adicionar em:</label>
            <Select value={selectedMealId} onValueChange={setSelectedMealId}>
              <SelectTrigger className="w-full bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MEALS.map(meal => (
                  <SelectItem key={meal.id} value={meal.id}>
                    {meal.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Search Input */}
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar alimento (ex: arroz, frango, whey)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-card border border-border rounded-2xl py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
          />
        </div>

        {/* Recent Suggestions */}
        {!searchQuery && !selectedFood && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recentSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setSearchQuery(suggestion)}
                className="px-3 py-1.5 text-sm bg-card border border-border rounded-full text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {/* Results List */}
        {!selectedFood && (
          <div className="space-y-2 mb-4">
            {filteredFoods.slice(0, 10).map((food) => (
              <button
                key={food.id}
                onClick={() => handleSelectFood(food)}
                className="w-full card-glass p-4 flex items-center justify-between transition-colors hover:border-primary/50"
              >
                <div className="text-left">
                  <p className="font-medium text-foreground">{food.nome}</p>
                  <p className="text-sm text-muted-foreground">
                    {food.porcaoBase}{food.unidadeBase === "un" ? " un" : food.unidadeBase === "scoop" ? " scoop" : ` ${food.unidadeBase}`} — {food.kcal} kcal
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <span className="text-pink-500">P</span> {food.p}g · <span className="text-yellow-400">C</span> {food.c}g · <span className="text-blue-400">G</span> {food.g}g
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Selected Food Detail */}
        {selectedFood && (
          <div className="card-glass p-4 mb-24">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{selectedFood.nome}</h3>
              <button
                onClick={() => setSelectedFood(null)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Trocar
              </button>
            </div>

            {/* Portion control */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantidade(Math.max(increment, quantidade - increment))}
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Minus size={16} className="text-foreground" />
                </button>
                <span className="text-foreground font-medium w-20 text-center">
                  {formatQuantidade()}
                </span>
                <button
                  onClick={() => setQuantidade(quantidade + increment)}
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Plus size={16} className="text-foreground" />
                </button>
              </div>
            </div>

            {/* Macros */}
            <div className="flex items-center justify-between text-sm mb-4">
              <div className="flex items-center gap-1">
                <span className="text-pink-500">P</span>
                <span className="text-muted-foreground">{adjustedProtein}g</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-400">C</span>
                <span className="text-muted-foreground">{adjustedCarbs}g</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">G</span>
                <span className="text-muted-foreground">{adjustedFat}g</span>
              </div>
            </div>

            {/* Calories highlight */}
            <div className="text-center py-3 bg-muted/20 rounded-xl">
              <span className="text-2xl font-bold text-foreground">{adjustedKcal}</span>
              <span className="text-muted-foreground ml-1">kcal</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {selectedFood && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleAdd}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default AdicionarAlimento;
