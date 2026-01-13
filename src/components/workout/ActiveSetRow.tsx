import { useCallback } from "react";
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
      return { label: "B", className: "bg-purple-500/20 text-purple-400" };
    default:
      return { label: String(index + 1), className: "bg-secondary text-foreground" };
  }
}

const ActiveSetRow = ({ set, setIndex, canRemove, onChange, onRemove, onTypeClick }: ActiveSetRowProps) => {
  const setLabel = getSetLabel(set.type, setIndex);

  const decreaseKg = useCallback(() => {
    onChange("kg", Math.max(0, set.kg - 2.5));
  }, [onChange, set.kg]);

  const increaseKg = useCallback(() => {
    onChange("kg", set.kg + 2.5);
  }, [onChange, set.kg]);

  const decreaseReps = useCallback(() => {
    onChange("reps", Math.max(1, set.reps - 1));
  }, [onChange, set.reps]);

  const increaseReps = useCallback(() => {
    onChange("reps", set.reps + 1);
  }, [onChange, set.reps]);

  const handleKgChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("kg", Math.max(0, parseFloat(e.target.value) || 0));
  }, [onChange]);

  const handleRepsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange("reps", Math.max(1, parseInt(e.target.value) || 1));
  }, [onChange]);

  const toggleDone = useCallback(() => {
    onChange("done", !set.done);
  }, [onChange, set.done]);

  return (
    <div className={`px-4 py-2 transition-colors ${set.done ? "bg-primary/5" : ""}`}>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px_32px] gap-2 items-center">
        {/* Set number/type badge */}
        <button
          type="button"
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
              type="button"
              onClick={decreaseKg}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              inputMode="decimal"
              value={set.kg}
              onChange={handleKgChange}
              className="text-foreground text-sm w-12 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={increaseKg}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reps Input */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-secondary/50 rounded-lg px-1.5 py-1 gap-0.5">
            <button
              type="button"
              onClick={decreaseReps}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              <Minus className="w-4 h-4" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              value={set.reps}
              onChange={handleRepsChange}
              className="text-foreground text-sm w-8 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={increaseReps}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Done checkbox */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={toggleDone}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              set.done
                ? "bg-primary/20 border border-primary/40"
                : "bg-secondary/50 border border-border/40 hover:bg-secondary"
            }`}
          >
            {set.done && <Check className="w-4 h-4 text-primary" />}
          </button>
        </div>

        {/* Remove button */}
        <div className="flex items-center justify-center">
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-7 h-7" />
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveSetRow;
