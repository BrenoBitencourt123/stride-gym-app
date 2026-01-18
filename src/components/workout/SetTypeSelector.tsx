import { SetType } from "@/pages/ActiveWorkout";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SetTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (type: SetType) => void;
  onRemove?: () => void;
  currentType: SetType;
  canRemove?: boolean;
}

const setTypes: { type: SetType | "remove"; label: string; description: string; badge: string; badgeClass: string }[] = [
  {
    type: "warmup",
    label: "Série de Aquecimento",
    description: "Aquecimento muscular com 30% a 40% do melhor peso",
    badge: "A",
    badgeClass: "bg-yellow-500/20 text-yellow-500",
  },
  {
    type: "failed",
    label: "Série de Preparação",
    description: "60-85% da carga com 2-6 reps para preparar o top set",
    badge: "P",
    badgeClass: "bg-blue-500/20 text-blue-400",
  },
  {
    type: "normal",
    label: "Série Normal",
    description: "Série padrão de trabalho",
    badge: "1",
    badgeClass: "bg-secondary text-foreground",
  },
  {
    type: "drop",
    label: "Série Back Off",
    description: "Redução de carga (10-30%) após série pesada",
    badge: "B",
    badgeClass: "bg-purple-500/20 text-purple-400",
  },
  {
    type: "remove",
    label: "Remover Série",
    description: "Remove esta série do exercício",
    badge: "✕",
    badgeClass: "bg-destructive/20 text-destructive",
  },
];

const SetTypeSelector = ({ open, onOpenChange, onSelect, onRemove, currentType, canRemove = true }: SetTypeSelectorProps) => {
  const handleClick = (type: SetType | "remove") => {
    if (type === "remove") {
      onRemove?.();
    } else {
      onSelect(type);
    }
    onOpenChange(false);
  };

  const visibleTypes = canRemove ? setTypes : setTypes.filter(t => t.type !== "remove");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Tipo de Série</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2">
          {visibleTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => handleClick(item.type)}
              className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${
                item.type === "remove" 
                  ? "bg-destructive/10 hover:bg-destructive/20 border border-destructive/30"
                  : currentType === item.type
                    ? "bg-primary/10 border border-primary/30"
                    : "bg-secondary/50 hover:bg-secondary"
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold ${item.badgeClass}`}>
                {item.badge}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SetTypeSelector;
