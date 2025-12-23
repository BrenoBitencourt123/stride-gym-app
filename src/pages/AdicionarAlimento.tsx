import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Search, Minus, Plus, Trash2, X } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

interface SelectedItem {
  food: FoodItem;
  quantidade: number;
}

const AdicionarAlimento = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
  const [searchParams] = useSearchParams();
  
  const mealId = searchParams.get("mealId");
  const mode = searchParams.get("mode"); // "diet" ou null (today)
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [editingItem, setEditingItem] = useState<SelectedItem | null>(null);
  const [editQuantidade, setEditQuantidade] = useState(0);
  const [selectedMealId, setSelectedMealId] = useState(mealId || "almoco");

  const filteredFoods = useMemo(() => searchFoods(searchQuery), [searchQuery]);

  const recentSuggestions = ["Arroz", "Frango", "Whey", "Banana", "Ovo"];

  const handleSelectFood = (food: FoodItem) => {
    // Verifica se já está selecionado
    const existing = selectedItems.find(item => item.food.id === food.id);
    if (existing) {
      // Abre para editar a quantidade
      setEditingItem(existing);
      setEditQuantidade(existing.quantidade);
    } else {
      // Adiciona à lista de selecionados
      setSelectedItems(prev => [...prev, { food, quantidade: food.porcaoBase }]);
      toast.success(`${food.nome} adicionado à lista`);
    }
    setSearchQuery("");
  };

  const handleRemoveItem = (foodId: string) => {
    setSelectedItems(prev => prev.filter(item => item.food.id !== foodId));
  };

  const handleUpdateQuantity = (foodId: string, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.food.id !== foodId) return item;
      const increment = getIncrement(item.food.unidadeBase);
      const newQty = Math.max(increment, item.quantidade + delta * increment);
      return { ...item, quantidade: newQty };
    }));
  };

  const handleSaveEdit = () => {
    if (!editingItem) return;
    setSelectedItems(prev => prev.map(item => 
      item.food.id === editingItem.food.id 
        ? { ...item, quantidade: editQuantidade }
        : item
    ));
    setEditingItem(null);
  };

  const handleAddAll = () => {
    if (selectedItems.length === 0) return;
    
    const targetMeal = mealId || selectedMealId;
    
    if (mode === "diet") {
      selectedItems.forEach(item => {
        addFoodToDiet(targetMeal, item.food.id, item.quantidade, item.food.unidadeBase);
      });
      toast.success(`${selectedItems.length} ${selectedItems.length === 1 ? 'item adicionado' : 'itens adicionados'} à dieta!`);
      triggerSync();
      navigate("/nutricao/criar-dieta");
    } else {
      selectedItems.forEach(item => {
        addFoodToToday(targetMeal, item.food.id, item.quantidade, item.food.unidadeBase, "extra");
      });
      toast.success(`${selectedItems.length} ${selectedItems.length === 1 ? 'item adicionado' : 'itens adicionados'}!`);
      triggerSync();
      navigate("/nutricao");
    }
  };

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

  const formatQuantidade = (qty: number, unidade: string) => {
    switch (unidade) {
      case "un": return `${qty} un`;
      case "scoop": return `${qty} scoop`;
      case "ml": return `${qty} ml`;
      default: return `${qty} g`;
    }
  };

  const calculateMacros = (food: FoodItem, qty: number) => {
    const fator = qty / food.porcaoBase;
    return {
      kcal: Math.round(food.kcal * fator),
      p: Math.round(food.p * fator),
      c: Math.round(food.c * fator),
      g: Math.round(food.g * fator),
    };
  };

  const totalMacros = useMemo(() => {
    return selectedItems.reduce((acc, item) => {
      const macros = calculateMacros(item.food, item.quantidade);
      return {
        kcal: acc.kcal + macros.kcal,
        p: acc.p + macros.p,
        c: acc.c + macros.c,
        g: acc.g + macros.g,
      };
    }, { kcal: 0, p: 0, c: 0, g: 0 });
  }, [selectedItems]);

  const editIncrement = editingItem ? getIncrement(editingItem.food.unidadeBase) : 10;

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
            <h1 className="text-2xl font-bold text-foreground">Adicionar alimentos</h1>
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
        {!searchQuery && selectedItems.length === 0 && (
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
        {searchQuery && (
          <div className="space-y-2 mb-4">
            {filteredFoods.slice(0, 8).map((food) => {
              const isSelected = selectedItems.some(item => item.food.id === food.id);
              return (
                <button
                  key={food.id}
                  onClick={() => handleSelectFood(food)}
                  className={`w-full card-glass p-4 flex items-center justify-between transition-colors hover:border-primary/50 ${isSelected ? 'border-primary/70 bg-primary/5' : ''}`}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground">{food.nome}</p>
                      {isSelected && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">✓</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {food.porcaoBase}{food.unidadeBase === "un" ? " un" : food.unidadeBase === "scoop" ? " scoop" : ` ${food.unidadeBase}`} — {food.kcal} kcal
                    </p>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    <span className="text-pink-500">P</span> {food.p}g · <span className="text-yellow-400">C</span> {food.c}g · <span className="text-blue-400">G</span> {food.g}g
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Items List */}
        {selectedItems.length > 0 && !searchQuery && (
          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Itens selecionados ({selectedItems.length})
              </h3>
              <button 
                onClick={() => setSelectedItems([])}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Limpar tudo
              </button>
            </div>
            
            {selectedItems.map((item) => {
              const macros = calculateMacros(item.food, item.quantidade);
              return (
                <div
                  key={item.food.id}
                  className="card-glass p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-foreground">{item.food.nome}</span>
                    <button
                      onClick={() => handleRemoveItem(item.food.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 size={16} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                  
                  {/* Quantity controls */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-muted-foreground">Quantidade</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.food.id, -1)}
                        className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Minus size={14} className="text-foreground" />
                      </button>
                      <span className="text-foreground font-medium w-16 text-center text-sm">
                        {formatQuantidade(item.quantidade, item.food.unidadeBase)}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.food.id, 1)}
                        className="p-1.5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <Plus size={14} className="text-foreground" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Macros preview */}
                  <div className="flex items-center justify-between text-xs bg-muted/20 rounded-lg p-2">
                    <span className="text-foreground font-medium">{macros.kcal} kcal</span>
                    <div className="flex gap-3">
                      <span><span className="text-pink-500">P</span> {macros.p}g</span>
                      <span><span className="text-yellow-400">C</span> {macros.c}g</span>
                      <span><span className="text-blue-400">G</span> {macros.g}g</span>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Totals */}
            <div className="card-glass p-4 bg-primary/5 border-primary/30">
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">Total</span>
                <div className="text-right">
                  <span className="font-bold text-foreground">{totalMacros.kcal} kcal</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    <span className="text-pink-500">P</span> {totalMacros.p}g · <span className="text-yellow-400">C</span> {totalMacros.c}g · <span className="text-blue-400">G</span> {totalMacros.g}g
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!searchQuery && selectedItems.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Busque e selecione os alimentos que deseja adicionar</p>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      {selectedItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
          <div className="max-w-md mx-auto">
            <Button
              onClick={handleAddAll}
              className="w-full py-6 text-base font-semibold rounded-2xl"
            >
              Adicionar {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end justify-center">
          <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">{editingItem.food.nome}</h3>
              <button onClick={() => setEditingItem(null)} className="p-1">
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm text-muted-foreground">Quantidade</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEditQuantidade(Math.max(editIncrement, editQuantidade - editIncrement))}
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Minus size={16} className="text-foreground" />
                </button>
                <span className="text-foreground font-medium w-20 text-center">
                  {formatQuantidade(editQuantidade, editingItem.food.unidadeBase)}
                </span>
                <button
                  onClick={() => setEditQuantidade(editQuantidade + editIncrement)}
                  className="p-2 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Plus size={16} className="text-foreground" />
                </button>
              </div>
            </div>
            
            {/* Preview macros */}
            {(() => {
              const macros = calculateMacros(editingItem.food, editQuantidade);
              return (
                <div className="text-center py-3 bg-muted/20 rounded-xl mb-6">
                  <span className="text-2xl font-bold text-foreground">{macros.kcal}</span>
                  <span className="text-muted-foreground ml-1">kcal</span>
                  <div className="text-xs text-muted-foreground mt-1">
                    P {macros.p}g · C {macros.c}g · G {macros.g}g
                  </div>
                </div>
              );
            })()}
            
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setEditingItem(null)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSaveEdit}>
                Salvar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default AdicionarAlimento;