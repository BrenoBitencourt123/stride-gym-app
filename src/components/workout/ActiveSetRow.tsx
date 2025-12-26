import { Check, Minus, Plus, Trash2 } from "lucide-react";
import { ActiveSet, SetType } from "@/pages/ActiveWorkout";

interface ActiveSetRowProps {
  set: ActiveSet;
  setIndex: number;
  canRemove: boolean;
  onChange: (field: keyof ActiveSet, value: number | boolean | SetType) => void;
  onRemove: () => void;
  onTypeClick: () => void;
}

function getSetLabel(type: SetType, index: number): { label: string; className: string } {
  switch (type) {
    case "warmup":
      return { label: "W", className: "bg-yellow-500/20 text-yellow-500" };
    case "failed":
      return { label: "F", className: "bg-destructive/20 text-destructive" };
    case "drop":
      return { label: "D", className: "bg-purple-500/20 text-purple-400" };
    default:
      return { label: String(index + 1), className: "bg-secondary text-foreground" };
  }
}

const ActiveSetRow = ({ set, setIndex, canRemove, onChange, onRemove, onTypeClick }: ActiveSetRowProps) => {
  const setLabel = getSetLabel(set.type, setIndex);

  return (
    <div className={`px-4 py-2 transition-colors ${set.done ? "bg-primary/5" : ""}`}>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 items-center">
        {/* Set number/type badge */}
        <button
          onClick={onTypeClick}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-colors ${setLabel.className}`}
        >
          {setLabel.label}
        </button>

        {/* Previous */}
        <div className="text-center text-sm text-muted-foreground">
          {set.previous ? `${set.previous.kg} × ${set.previous.reps}` : "—"}
        </div>

        {/* KG Input */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-secondary/50 rounded-lg px-1.5 py-1 gap-0.5">
            <button
              onClick={() => onChange("kg", Math.max(0, set.kg - 2.5))}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={set.kg}
              onChange={(e) => onChange("kg", Math.max(0, parseFloat(e.target.value) || 0))}
              className="text-foreground text-sm w-10 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onChange("kg", set.kg + 2.5)}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-secondary/50 rounded-lg px-1.5 py-1 gap-0.5">
            <button
              onClick={() => onChange("reps", Math.max(1, set.reps - 1))}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <input
              type="number"
              value={set.reps}
              onChange={(e) => onChange("reps", Math.max(1, parseInt(e.target.value) || 1))}
              className="text-foreground text-sm w-6 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              onClick={() => onChange("reps", set.reps + 1)}
              className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Done checkbox */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => onChange("done", !set.done)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              set.done
                ? "bg-primary/20 border border-primary/40"
                : "bg-secondary/50 border border-border/40 hover:bg-secondary"
            }`}
          >
            {set.done && <Check className="w-4 h-4 text-primary" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActiveSetRow;
