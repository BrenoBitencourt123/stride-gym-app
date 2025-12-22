import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Search, ScanLine, Minus, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface FoodItem {
  id: string;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

const mockFoods: FoodItem[] = [
  { id: "arroz", name: "Arroz cozido", portion: "100 g", kcal: 130, protein: 2, carbs: 28, fat: 0 },
  { id: "frango", name: "Frango grelhado", portion: "100 g", kcal: 165, protein: 31, carbs: 0, fat: 4 },
  { id: "ovo", name: "Ovo inteiro", portion: "1 un", kcal: 70, protein: 6, carbs: 0, fat: 5 },
  { id: "whey", name: "Whey protein", portion: "1 scoop", kcal: 120, protein: 24, carbs: 3, fat: 1 },
  { id: "banana", name: "Banana", portion: "1 un", kcal: 105, protein: 1, carbs: 27, fat: 0 },
];

const recentSuggestions = ["Arroz", "Frango", "Whey", "Banana"];

const AdicionarAlimento = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [portionMultiplier, setPortionMultiplier] = useState(1);

  const filteredFoods = searchQuery
    ? mockFoods.filter((food) =>
        food.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockFoods;

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setPortionMultiplier(1);
  };

  const handleAdd = () => {
    navigate("/nutricao");
  };

  const adjustedKcal = selectedFood ? Math.round(selectedFood.kcal * portionMultiplier) : 0;
  const adjustedProtein = selectedFood ? Math.round(selectedFood.protein * portionMultiplier) : 0;
  const adjustedCarbs = selectedFood ? Math.round(selectedFood.carbs * portionMultiplier) : 0;
  const adjustedFat = selectedFood ? Math.round(selectedFood.fat * portionMultiplier) : 0;

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
            <button
              onClick={() => navigate("/nutricao")}
              className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
            >
              <ChevronLeft size={24} className="text-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">Adicionar alimento</h1>
          </div>
          <button className="p-2 rounded-xl hover:bg-card/50 transition-colors">
            <ScanLine size={20} className="text-muted-foreground" />
          </button>
        </div>

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
        {!searchQuery && (
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
        <div className="space-y-2 mb-4">
          {filteredFoods.map((food) => (
            <button
              key={food.id}
              onClick={() => handleSelectFood(food)}
              className={`w-full card-glass p-4 flex items-center justify-between transition-colors ${
                selectedFood?.id === food.id ? "border-primary/50" : ""
              }`}
            >
              <div className="text-left">
                <p className="font-medium text-foreground">{food.name}</p>
                <p className="text-sm text-muted-foreground">
                  {food.portion} — {food.kcal} kcal
                </p>
              </div>
              <ChevronRight size={18} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Selected Food Detail */}
        {selectedFood && (
          <div className="card-glass p-4 mb-24">
            <h3 className="font-semibold text-foreground mb-3">{selectedFood.name}</h3>

            {/* Portion control */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Porção</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPortionMultiplier(Math.max(0.5, portionMultiplier - 0.5))}
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Minus size={16} className="text-foreground" />
                </button>
                <span className="text-foreground font-medium w-16 text-center">
                  {portionMultiplier === 1 ? selectedFood.portion : `${Math.round(portionMultiplier * 100)}%`}
                </span>
                <button
                  onClick={() => setPortionMultiplier(portionMultiplier + 0.5)}
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
