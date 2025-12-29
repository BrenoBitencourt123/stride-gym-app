import { useState, memo, useCallback } from "react";
import { MoreVertical, Plus, Timer } from "lucide-react";
import { ActiveExercise, ActiveSet, SetType } from "@/pages/ActiveWorkout";
import ActiveSetRow from "./ActiveSetRow";

interface ExerciseSectionProps {
  exercise: ActiveExercise;
  exerciseIndex: number;
  onSetChange: (exerciseIndex: number, setIndex: number, field: keyof ActiveSet, value: number | boolean | SetType) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onNotesChange: (exerciseIndex: number, notes: string) => void;
  onSetTypeClick: (exerciseIndex: number, setIndex: number) => void;
}

function formatRestTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}min`;
  return `${mins}min ${secs}s`;
}

const ExerciseSection = memo(({
  exercise,
  exerciseIndex,
  onSetChange,
  onAddSet,
  onRemoveSet,
  onNotesChange,
  onSetTypeClick,
}: ExerciseSectionProps) => {
  const [showNotes, setShowNotes] = useState(!!exercise.notes);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onNotesChange(exerciseIndex, e.target.value);
  }, [exerciseIndex, onNotesChange]);

  const handleAddSet = useCallback(() => {
    onAddSet(exerciseIndex);
  }, [exerciseIndex, onAddSet]);

  return (
    <div className="card-glass overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-primary">{exercise.name}</h3>
            
            {/* Notes input */}
            {showNotes ? (
              <input
                type="text"
                value={exercise.notes}
                onChange={handleNotesChange}
                placeholder="Adicionar notas aqui..."
                className="mt-2 w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/50 outline-none border-none"
              />
            ) : (
              <button
                onClick={() => setShowNotes(true)}
                className="mt-1 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                + Adicionar notas
              </button>
            )}
          </div>
          
          {/* Simple menu button - dropdown removed to fix re-render loop */}
          <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
        
        {/* Rest time badge */}
        <div className="mt-2 flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">
            Descanso: {formatRestTime(exercise.restSeconds)}
          </span>
        </div>
      </div>

      {/* Table Header */}
      <div className="px-4 py-2 bg-secondary/30">
        <div className="grid grid-cols-[40px_1fr_1fr_1fr_40px] gap-2 text-xs text-muted-foreground font-medium">
          <div className="text-center">SÉRIE</div>
          <div className="text-center">ANTERIOR</div>
          <div className="text-center">KG</div>
          <div className="text-center">REPS</div>
          <div className="text-center">✓</div>
        </div>
      </div>

      {/* Sets */}
      <div className="divide-y divide-border/30">
        {exercise.sets.map((set, setIndex) => (
          <ActiveSetRow
            key={`${exercise.id}-set-${setIndex}`}
            set={set}
            setIndex={setIndex}
            canRemove={exercise.sets.length > 1}
            onChange={(field, value) => onSetChange(exerciseIndex, setIndex, field, value)}
            onRemove={() => onRemoveSet(exerciseIndex, setIndex)}
            onTypeClick={() => onSetTypeClick(exerciseIndex, setIndex)}
          />
        ))}
      </div>

      {/* Add Set Button */}
      <button
        onClick={handleAddSet}
        className="w-full px-4 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/30 transition-colors border-t border-border/30"
      >
        <Plus className="w-4 h-4" />
        <span>Adicionar Série</span>
      </button>
    </div>
  );
});

ExerciseSection.displayName = 'ExerciseSection';

export default ExerciseSection;
