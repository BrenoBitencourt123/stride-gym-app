import { Check, ChevronDown, Plus, Minus, Trash2 } from "lucide-react";

interface SetRowProps {
  setNumber: number;
  kg: number;
  reps: number;
  rest: string;
  done: boolean;
  showDoneLabel?: boolean;
  canRemove?: boolean;
  onKgChange: (kg: number) => void;
  onRepsChange: (reps: number) => void;
  onDoneChange: (done: boolean) => void;
  onRemove?: () => void;
}

const SetRow = ({
  setNumber,
  kg,
  reps,
  rest,
  done,
  showDoneLabel = false,
  canRemove = false,
  onKgChange,
  onRepsChange,
  onDoneChange,
  onRemove,
}: SetRowProps) => {
  return (
    <div className="flex items-center gap-2 py-2">
      {/* Set number */}
      <div className="w-8 text-muted-foreground text-sm">{setNumber}</div>
      <div className="text-muted-foreground text-sm w-8">Set</div>

      {/* Kg input */}
      <div className="flex items-center bg-secondary/50 rounded-lg px-2 py-1.5 gap-1">
        <button
          onClick={() => onKgChange(Math.max(0, kg - 2.5))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          value={kg}
          onChange={(e) => onKgChange(Math.max(0, parseFloat(e.target.value) || 0))}
          className="text-foreground text-sm w-10 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onKgChange(kg + 2.5)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reps input */}
      <div className="flex items-center bg-secondary/50 rounded-lg px-2 py-1.5 gap-1">
        <button
          onClick={() => onRepsChange(Math.max(1, reps - 1))}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <input
          type="number"
          value={reps}
          onChange={(e) => onRepsChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="text-foreground text-sm w-6 text-center bg-transparent border-none outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <button
          onClick={() => onRepsChange(reps + 1)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rest dropdown */}
      <button className="flex items-center bg-secondary/50 rounded-lg px-2 py-1.5 gap-1 text-sm text-foreground">
        <span>{rest}</span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {/* Done checkbox */}
      <button
        onClick={() => onDoneChange(!done)}
        className={`flex items-center gap-1 ml-auto rounded-lg px-2 py-1.5 transition-colors ${
          done
            ? "bg-primary/20 border border-primary/40"
            : "bg-secondary/50 border border-border/40"
        }`}
      >
        {done && <Check className="w-3.5 h-3.5 text-primary" />}
        {showDoneLabel && (
          <span className={`text-xs ${done ? "text-primary" : "text-muted-foreground"}`}>
            Feito
          </span>
        )}
      </button>

      {/* Remove button */}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Remover série"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default SetRow;
