import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { useAppStateContext } from "@/contexts/AppStateContext";
import { toast } from "sonner";

interface WeightLogModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export default function WeightLogModal({ open, onClose, onSaved }: WeightLogModalProps) {
  const { state, updateState, updateQuests } = useAppStateContext();
  const [weight, setWeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get today's date key
  const todayKey = new Date().toISOString().split('T')[0];
  
  // Check if already logged today
  const bodyweightEntries = state?.bodyweight?.entries || [];
  const todayLog = bodyweightEntries.find(e => e.date === todayKey);
  
  // Calculate trend from recent entries
  const sortedEntries = [...bodyweightEntries].sort((a, b) => a.date.localeCompare(b.date));
  const recentEntries = sortedEntries.slice(-14); // Last 2 weeks
  
  let trendKg: number | null = null;
  if (recentEntries.length >= 2) {
    const midpoint = Math.floor(recentEntries.length / 2);
    const firstHalf = recentEntries.slice(0, midpoint);
    const secondHalf = recentEntries.slice(midpoint);
    
    if (firstHalf.length > 0 && secondHalf.length > 0) {
      const firstAvg = firstHalf.reduce((sum, e) => sum + e.weight, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, e) => sum + e.weight, 0) / secondHalf.length;
      trendKg = Math.round((secondAvg - firstAvg) * 10) / 10;
    }
  }
  
  const currentWeight = sortedEntries.length > 0 
    ? sortedEntries[sortedEntries.length - 1].weight 
    : null;

  const handleSave = async () => {
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
      // Update bodyweight entries in Firebase
      const existingEntries = state?.bodyweight?.entries || [];
      const filtered = existingEntries.filter(e => e.date !== todayKey);
      const newEntry = {
        date: todayKey,
        weight: parsedWeight,
        updatedAt: Date.now(),
      };
      
      await updateState({
        bodyweight: {
          entries: [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date)),
        },
      });
      
      // Mark quest as done
      if (state?.quests && !state.quests.registrarPesoDone) {
        await updateQuests({ registrarPesoDone: true });
      }
      
      toast.success(todayLog ? "Peso atualizado!" : "Peso registrado!");
      setWeight("");
      onSaved?.();
      onClose();
    } catch {
      toast.error("Erro ao salvar peso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const TrendIcon = trendKg !== null 
    ? trendKg < 0 ? TrendingDown 
    : trendKg > 0 ? TrendingUp 
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
              placeholder={todayLog ? `Atual: ${todayLog.weight} kg` : "Ex: 75.5"}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="text-lg font-medium text-center"
              autoFocus
            />
          </div>
          
          {/* Stats display */}
          {currentWeight !== null && (
            <div className="bg-muted/30 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Peso atual</span>
                <span className="font-medium">{currentWeight} kg</span>
              </div>
              
              {trendKg !== null && TrendIcon && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Tendência</span>
                  <span className={`flex items-center gap-1 font-medium ${
                    trendKg < 0 ? "text-green-500" : 
                    trendKg > 0 ? "text-orange-500" : 
                    "text-muted-foreground"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {trendKg > 0 ? "+" : ""}{trendKg} kg
                  </span>
                </div>
              )}
            </div>
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
