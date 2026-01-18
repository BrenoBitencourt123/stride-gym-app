import { useCallback, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { ActiveSet, SetType } from "@/pages/ActiveWorkout";

interface ActiveSetRowProps {
  set: ActiveSet;
  setIndex: number;
  onChange: (field: keyof ActiveSet, value: number | boolean | SetType) => void;
  onTypeClick: () => void;
}

function getSetLabel(type: SetType, index: number): { label: string; className: string } {
  switch (type) {
    case "warmup":
      return { label: "A", className: "bg-yellow-500/20 text-yellow-500" };
    case "failed":
      // "failed" type is repurposed as "Preparação" (P)
      return { label: "P", className: "bg-blue-500/20 text-blue-400" };
    case "drop":
      return { label: "B", className: "bg-purple-500/20 text-purple-400" };
    default:
      return { label: String(index + 1), className: "bg-secondary text-foreground" };
  }
}

const ActiveSetRow = ({ set, setIndex, onChange, onTypeClick }: ActiveSetRowProps) => {
  const setLabel = getSetLabel(set.type, setIndex);
  const [kgInputValue, setKgInputValue] = useState<string>(String(set.kg));
  const [repsInputValue, setRepsInputValue] = useState<string>(String(set.reps));
  const [isKgFocused, setIsKgFocused] = useState(false);
  const [isRepsFocused, setIsRepsFocused] = useState(false);

  const decreaseKg = useCallback(() => {
    const newValue = Math.max(0, set.kg - 2.5);
    onChange("kg", newValue);
    setKgInputValue(String(newValue));
  }, [onChange, set.kg]);

  const increaseKg = useCallback(() => {
    const newValue = set.kg + 2.5;
    onChange("kg", newValue);
    setKgInputValue(String(newValue));
  }, [onChange, set.kg]);

  const decreaseReps = useCallback(() => {
    const newValue = Math.max(1, set.reps - 1);
    onChange("reps", newValue);
    setRepsInputValue(String(newValue));
  }, [onChange, set.reps]);

  const increaseReps = useCallback(() => {
    const newValue = set.reps + 1;
    onChange("reps", newValue);
    setRepsInputValue(String(newValue));
  }, [onChange, set.reps]);

  const handleKgFocus = useCallback(() => {
    setIsKgFocused(true);
    setKgInputValue(""); // Clear on focus for easy typing
  }, []);

  const handleKgBlur = useCallback(() => {
    setIsKgFocused(false);
    const parsed = parseFloat(kgInputValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange("kg", parsed);
      setKgInputValue(String(parsed));
    } else {
      // Restore previous value if invalid
      setKgInputValue(String(set.kg));
    }
  }, [kgInputValue, onChange, set.kg]);

  const handleKgChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setKgInputValue(e.target.value);
  }, []);

  const handleRepsFocus = useCallback(() => {
    setIsRepsFocused(true);
    setRepsInputValue(""); // Clear on focus for easy typing
  }, []);

  const handleRepsBlur = useCallback(() => {
    setIsRepsFocused(false);
    const parsed = parseInt(repsInputValue);
    if (!isNaN(parsed) && parsed >= 1) {
      onChange("reps", parsed);
      setRepsInputValue(String(parsed));
    } else {
      // Restore previous value if invalid
      setRepsInputValue(String(set.reps));
    }
  }, [repsInputValue, onChange, set.reps]);

  const handleRepsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRepsInputValue(e.target.value);
  }, []);

  const toggleDone = useCallback(() => {
    onChange("done", !set.done);
  }, [onChange, set.done]);

  return (
    <div className={`px-4 py-2 transition-colors ${set.done ? "bg-primary/5" : ""}`}>
      <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 items-center">
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
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={isKgFocused ? kgInputValue : set.kg}
              onChange={handleKgChange}
              onFocus={handleKgFocus}
              onBlur={handleKgBlur}
              className="text-foreground text-sm w-12 text-center bg-transparent border-none outline-none"
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={isRepsFocused ? repsInputValue : set.reps}
              onChange={handleRepsChange}
              onFocus={handleRepsFocus}
              onBlur={handleRepsBlur}
              className="text-foreground text-sm w-8 text-center bg-transparent border-none outline-none"
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
      </div>
    </div>
  );
};

export default ActiveSetRow;
