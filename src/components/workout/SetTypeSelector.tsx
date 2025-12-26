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
  currentType: SetType;
}

const setTypes: { type: SetType; label: string; description: string; badge: string; badgeClass: string }[] = [
  {
    type: "warmup",
    label: "Série de Aquecimento",
    description: "Preparação muscular com carga leve",
    badge: "W",
    badgeClass: "bg-yellow-500/20 text-yellow-500",
  },
  {
    type: "normal",
    label: "Série Normal",
    description: "Série padrão de trabalho",
    badge: "1",
    badgeClass: "bg-secondary text-foreground",
  },
  {
    type: "failed",
    label: "Série Falhada",
    description: "Não conseguiu completar as reps",
    badge: "F",
    badgeClass: "bg-destructive/20 text-destructive",
  },
  {
    type: "drop",
    label: "Série Drop",
    description: "Redução de carga sem descanso",
    badge: "D",
    badgeClass: "bg-purple-500/20 text-purple-400",
  },
];

const SetTypeSelector = ({ open, onOpenChange, onSelect, currentType }: SetTypeSelectorProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader className="mb-4">
          <SheetTitle>Tipo de Série</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-2">
          {setTypes.map((item) => (
            <button
              key={item.type}
              onClick={() => onSelect(item.type)}
              className={`w-full p-4 flex items-center gap-4 rounded-xl transition-colors ${
                currentType === item.type
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
