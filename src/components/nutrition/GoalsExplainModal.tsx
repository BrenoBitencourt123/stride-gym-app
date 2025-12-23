import { X, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { getNutritionGoals } from "@/lib/storage";

interface GoalsExplainModalProps {
  open: boolean;
  onClose: () => void;
}

const GoalsExplainModal = ({ open, onClose }: GoalsExplainModalProps) => {
  const goals = getNutritionGoals();
  
  // Mock calculado (coerente com a meta)
  const maintenance = goals.kcalTarget + 300;
  const deficit = -300;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-card border-border/50 max-w-sm mx-4">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info size={18} className="text-primary" />
              <DialogTitle className="text-foreground">Por quê essas metas?</DialogTitle>
            </div>
            <DialogClose asChild>
              <button className="p-2 hover:bg-muted/30 rounded-lg transition-colors">
                <X size={18} className="text-muted-foreground" />
              </button>
            </DialogClose>
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Calories explanation */}
          <div className="card-glass p-4">
            <p className="text-sm text-muted-foreground mb-3">
              Suas calorias são calculadas para alcançar seu objetivo com segurança.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manutenção estimada:</span>
                <span className="text-foreground font-medium">{maintenance.toLocaleString()} kcal</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Déficit escolhido:</span>
                <span className="text-yellow-400 font-medium">{deficit} kcal</span>
              </div>
              <div className="flex justify-between border-t border-border/30 pt-2 mt-2">
                <span className="text-foreground font-medium">Meta diária:</span>
                <span className="text-primary font-bold">{goals.kcalTarget.toLocaleString()} kcal</span>
              </div>
            </div>
          </div>

          {/* Macros explanation */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-pink-400 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">Proteína alta ({goals.pTarget}g)</p>
                <p className="text-xs text-muted-foreground">Para preservar massa muscular durante déficit.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">Carboidratos ({goals.cTarget}g)</p>
                <p className="text-xs text-muted-foreground">Para energia nos treinos e recuperação.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
              <div>
                <p className="text-sm text-foreground font-medium">Gorduras ({goals.gTarget}g)</p>
                <p className="text-xs text-muted-foreground">Para hormônios, saciedade e absorção de vitaminas.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border/30">
            Ajustes finos são normais. Foque na consistência.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalsExplainModal;
