import { useState, useEffect } from "react";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import { getFoodById, type FoodItem } from "@/data/foods";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface EditFoodModalProps {
  open: boolean;
  onClose: () => void;
  foodId: string;
  currentQuantity: number;
  currentUnidade: "g" | "un" | "ml" | "scoop";
  onSave: (quantity: number) => void;
  onRemove?: () => void;
}

const EditFoodModal = ({
  open,
  onClose,
  foodId,
  currentQuantity,
  currentUnidade,
  onSave,
  onRemove,
}: EditFoodModalProps) => {
  const [quantity, setQuantity] = useState(currentQuantity);
  const food = getFoodById(foodId);

  useEffect(() => {
    setQuantity(currentQuantity);
  }, [currentQuantity, open]);

  if (!food) return null;

  const factor = quantity / food.porcaoBase;
  const kcal = Math.round(food.kcal * factor);
  const p = Math.round(food.p * factor);
  const c = Math.round(food.c * factor);
  const g = Math.round(food.g * factor);

  const step = food.unidadeBase === "g" || food.unidadeBase === "ml" ? 10 : 1;

  const handleIncrement = () => setQuantity((q) => q + step);
  const handleDecrement = () => setQuantity((q) => Math.max(step, q - step));

  const handleSave = () => {
    onSave(quantity);
    onClose();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
      onClose();
    }
  };

  const formatUnit = (unit: string) => {
    if (unit === "un") return "un";
    if (unit === "scoop") return "scoop";
    return unit;
  };

  return (
    <Drawer open={open} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent className="bg-card border-border/50">
        <DrawerHeader className="border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-foreground">Editar alimento</DrawerTitle>
            <DrawerClose asChild>
              <button className="p-2 hover:bg-muted/30 rounded-lg transition-colors">
                <X size={20} className="text-muted-foreground" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="p-4 space-y-6">
          {/* Food name */}
          <div>
            <label className="text-xs text-muted-foreground">Alimento</label>
            <p className="text-lg font-medium text-foreground">{food.nome}</p>
          </div>

          {/* Quantity controls */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">
              Quantidade ({formatUnit(currentUnidade)})
            </label>
            <div className="flex items-center gap-4">
              <button
                onClick={handleDecrement}
                className="w-12 h-12 rounded-xl bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <Minus size={20} className="text-foreground" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 h-12 bg-muted/20 border border-border/50 rounded-xl text-center text-xl font-semibold text-foreground focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleIncrement}
                className="w-12 h-12 rounded-xl bg-muted/30 hover:bg-muted/50 flex items-center justify-center transition-colors"
              >
                <Plus size={20} className="text-foreground" />
              </button>
            </div>
          </div>

          {/* Real-time macros preview */}
          <div className="card-glass p-4">
            <p className="text-xs text-muted-foreground mb-3">Valores nutricionais</p>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{kcal}</p>
                <p className="text-xs text-muted-foreground">kcal</p>
              </div>
              <div>
                <p className="text-lg font-bold text-pink-400">{p}g</p>
                <p className="text-xs text-muted-foreground">Proteína</p>
              </div>
              <div>
                <p className="text-lg font-bold text-yellow-400">{c}g</p>
                <p className="text-xs text-muted-foreground">Carbo</p>
              </div>
              <div>
                <p className="text-lg font-bold text-blue-400">{g}g</p>
                <p className="text-xs text-muted-foreground">Gordura</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleSave}
              className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors"
            >
              Salvar alterações
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-muted/30 text-foreground font-medium py-3 rounded-xl hover:bg-muted/50 transition-colors"
              >
                Cancelar
              </button>
              {onRemove && (
                <button
                  onClick={handleRemove}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Remover</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default EditFoodModal;
