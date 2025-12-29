import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { upsertWeightLog, getLocalDateISO, getTodayLog, getWeightStats } from "@/lib/progress";
import { getQuests, saveQuests } from "@/lib/storage";
import { toast } from "sonner";

interface WeightLogModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WeightLogModal({ open, onClose, onSaved }: WeightLogModalProps) {
  const todayLog = getTodayLog();
  const [weight, setWeight] = useState(todayLog?.weightKg?.toString() || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const stats = getWeightStats();

  const handleSave = () => {
    // Parse weight - accept comma or period
    const parsedWeight = parseFloat(weight.replace(",", "."));
    
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      toast.error("Digite um peso válido");
      return;
    }
    
    // Validate reasonable range (30-300 kg)
    if (parsedWeight < 30 || parsedWeight > 300) {
      toast.error("Peso fora do intervalo esperado (30-300 kg)");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const dateISO = getLocalDateISO();
      upsertWeightLog(dateISO, parsedWeight);
      
      // Mark quest as done
      const quests = getQuests();
      if (!quests.registrarPesoDone) {
        quests.registrarPesoDone = true;
        saveQuests(quests);
      }
      
      toast.success(todayLog ? "Peso atualizado!" : "Peso registrado!");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Erro ao salvar peso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TrendIcon = stats.trendKg !== null 
    ? stats.trendKg < 0 ? TrendingDown 
    : stats.trendKg > 0 ? TrendingUp 
    : Minus
    : null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[340px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Registrar Peso
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          {/* Weight input */}
          <div className="space-y-2">
            <Label htmlFor="weight">Peso de hoje (kg)</Label>
            <Input
              id="weight"
              type="text"
              inputMode="decimal"
              placeholder="Ex: 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-lg font-medium text-center"
              autoFocus
            />
          </div>
          
          {/* Stats display */}
          {stats.currentAvg7 !== null && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Média 7 dias</span>
                <span className="font-medium">{stats.currentAvg7} kg</span>
              </div>
              
              {stats.trendKg !== null && TrendIcon && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tendência semanal</span>
                  <span className={`flex items-center gap-1 font-medium ${
                    stats.trendKg < 0 ? "text-green-500" : 
                    stats.trendKg > 0 ? "text-orange-500" : 
                    "text-muted-foreground"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {stats.trendKg > 0 ? "+" : ""}{stats.trendKg} kg
                  </span>
                </div>
              )}
            </div>
          )}
          
          {/* Progress indicator */}
          {stats.logsNeeded > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              Faltam <span className="font-medium text-primary">{stats.logsNeeded}</span> registros 
              para calcular a média de 7 dias
            </p>
          )}
          
          {/* Tip */}
          <p className="text-xs text-muted-foreground text-center italic">
            Dica: pese-se sempre no mesmo horário, de preferência pela manhã em jejum
          </p>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !weight.trim()}>
            {todayLog ? "Atualizar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
