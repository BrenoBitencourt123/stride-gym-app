import { Check, ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

interface SetRowProps {
  setNumber: number;
  initialKg: number;
  initialReps: number;
  initialRest: string;
  initialDone: boolean;
  showDoneLabel?: boolean;
}

const SetRow = ({
  setNumber,
  initialKg,
  initialReps,
  initialRest,
  initialDone,
  showDoneLabel = false,
}: SetRowProps) => {
  const [kg, setKg] = useState(initialKg);
  const [reps, setReps] = useState(initialReps);
  const [rest, setRest] = useState(initialRest);
  const [done, setDone] = useState(initialDone);

  return (
    <div className="flex items-center gap-2 py-2">
      {/* Set number */}
      <div className="w-8 text-muted-foreground text-sm">{setNumber}</div>
      <div className="text-muted-foreground text-sm w-8">Set</div>

      {/* Kg input */}
      <div className="flex items-center bg-secondary/50 rounded-lg px-2 py-1.5 gap-1">
        <span className="text-foreground text-sm w-8 text-center">{kg}</span>
        <button
          onClick={() => setKg((prev) => prev + 2.5)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Reps input */}
      <div className="flex items-center bg-secondary/50 rounded-lg px-2 py-1.5 gap-1">
        <span className="text-foreground text-sm w-4 text-center">{reps}</span>
        <button
          onClick={() => setReps((prev) => prev + 1)}
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
        onClick={() => setDone(!done)}
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
    </div>
  );
};

export default SetRow;
