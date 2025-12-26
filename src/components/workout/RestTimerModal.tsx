import { useState, useEffect } from "react";
import { X, Plus, Minus, SkipForward } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface RestTimerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration: number;
}

const RestTimerModal = ({ open, onOpenChange, duration }: RestTimerModalProps) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeLeft(duration);
      setIsPaused(false);
    }
  }, [open, duration]);

  useEffect(() => {
    if (!open || isPaused || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onOpenChange(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isPaused, timeLeft, onOpenChange]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addTime = (seconds: number) => {
    setTimeLeft((prev) => Math.max(0, prev + seconds));
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 bg-card border-border overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-secondary">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">Tempo de Descanso</h3>
          
          {/* Timer display */}
          <div className="text-6xl font-bold text-primary my-8 font-mono">
            {formatTime(timeLeft)}
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <button
              onClick={() => addTime(-15)}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Minus className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {isPaused ? (
                <span className="text-lg font-bold">▶</span>
              ) : (
                <span className="text-lg font-bold">⏸</span>
              )}
            </button>
            
            <button
              onClick={() => addTime(15)}
              className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Skip button */}
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground transition-colors mx-auto"
          >
            <SkipForward className="w-4 h-4" />
            <span className="text-sm">Pular descanso</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RestTimerModal;
