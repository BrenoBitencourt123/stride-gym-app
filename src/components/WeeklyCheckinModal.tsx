import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2, Scale } from "lucide-react";
import { useAppStateContext } from "@/contexts/AppStateContext";
import { getObjectiveLabel, calculateMacros } from "@/lib/onboarding";
import { toast } from "sonner";

interface WeeklyCheckinModalProps {
  open: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export default function WeeklyCheckinModal({ open, onClose, onApplied }: WeeklyCheckinModalProps) {
  const { state, getOnboarding, updateOnboarding, updateState } = useAppStateContext();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [weight, setWeight] = useState("");
  
  const onboarding = getOnboarding();
  
  // Calculate weight stats from Firebase data
  const bodyweightEntries = state?.bodyweight?.entries || [];
  const sortedEntries = [...bodyweightEntries].sort((a, b) => a.date.localeCompare(b.date));
  
  // Calculate trend
  let trendKg: number | null = null;
  let currentWeight: number | null = null;
  let previousWeight: number | null = null;
  
  if (sortedEntries.length > 0) {
    currentWeight = sortedEntries[sortedEntries.length - 1].weight;
    
    if (sortedEntries.length >= 2) {
      const recentEntries = sortedEntries.slice(-14);
      const midpoint = Math.floor(recentEntries.length / 2);
      const firstHalf = recentEntries.slice(0, midpoint);
      const secondHalf = recentEntries.slice(midpoint);
      
      if (firstHalf.length > 0 && secondHalf.length > 0) {
        const firstAvg = firstHalf.reduce((sum, e) => sum + e.weight, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, e) => sum + e.weight, 0) / secondHalf.length;
        previousWeight = Math.round(firstAvg * 10) / 10;
        trendKg = Math.round((secondAvg - firstAvg) * 10) / 10;
      }
    }
  }
  
  // Check if check-in is available (7 days since last)
  const isAvailable = (): boolean => {
    if (!onboarding?.completedAt) return false;
    const lastDate = new Date(onboarding.completedAt);
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + 7);
    return new Date() >= nextDue;
  };
  
  const available = isAvailable();
  const adjustmentAvailable = trendKg !== null && sortedEntries.length >= 2;
  
  // Calculate calorie adjustment suggestion
  const getSuggestion = () => {
    if (!onboarding || trendKg === null) return null;
    
    const goal = onboarding.objective.objective;
    const currentCalories = onboarding.plan.targetKcal;
    const sex = onboarding.profile.sex;
    
    const minCalories = sex === 'male' ? 1500 : 1200;
    const maxCalories = 5000;
    const maxAdjustment = 150;
    
    let delta = 0;
    let reason = '';
    
    if (goal === 'lose_fat') {
      if (trendKg > -0.2) {
        delta = -100;
        reason = 'Perda de peso abaixo do esperado. Redução moderada sugerida.';
      } else if (trendKg >= -0.7) {
        delta = 0;
        reason = 'Progresso adequado. Manter plano atual.';
      } else {
        delta = 100;
        reason = 'Perda rápida demais. Aumento sugerido para preservar massa muscular.';
      }
    } else if (goal === 'gain_muscle') {
      if (trendKg < 0.1) {
        delta = 100;
        reason = 'Ganho de peso abaixo do esperado. Aumento moderado sugerido.';
      } else if (trendKg <= 0.4) {
        delta = 0;
        reason = 'Progresso adequado. Manter plano atual.';
      } else {
        delta = -100;
        reason = 'Ganho rápido demais. Redução sugerida para minimizar gordura.';
      }
    } else {
      if (Math.abs(trendKg) <= 0.2) {
        delta = 0;
        reason = 'Peso estável. Manter plano atual.';
      } else if (trendKg > 0.2) {
        delta = -100;
        reason = 'Leve ganho de peso. Redução moderada sugerida.';
      } else {
        delta = 100;
        reason = 'Leve perda de peso. Aumento moderado sugerido.';
      }
    }
    
    // Apply limits
    delta = Math.max(-maxAdjustment, Math.min(maxAdjustment, delta));
    
    const newCalories = currentCalories + delta;
    if (newCalories < minCalories) {
      delta = minCalories - currentCalories;
      if (delta >= 0) {
        delta = 0;
        reason = `Já está no mínimo seguro (${minCalories} kcal). Não é possível reduzir mais.`;
      }
    }
    if (newCalories > maxCalories) {
      delta = maxCalories - currentCalories;
      reason = `Próximo do limite máximo. Ajuste limitado.`;
    }
    
    return { delta, reason };
  };
  
  const suggestion = getSuggestion();

  const TrendIcon = trendKg !== null 
    ? trendKg < 0 ? TrendingDown 
    : trendKg > 0 ? TrendingUp 
    : Minus
    : null;

  const handleApply = async () => {
    if (!onboarding) return;
    
    setIsApplying(true);
    
    try {
      // Record weight if provided
      if (weight) {
        const parsedWeight = parseFloat(weight.replace(",", "."));
        if (!isNaN(parsedWeight) && parsedWeight >= 30 && parsedWeight <= 300) {
          const todayKey = new Date().toISOString().split('T')[0];
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
        }
      }
      
      // Apply calorie adjustment if available
      if (suggestion && suggestion.delta !== 0 && adjustmentAvailable) {
        const newCalories = onboarding.plan.targetKcal + suggestion.delta;
        const macros = calculateMacros(
          newCalories,
          onboarding.profile.weightKg,
          onboarding.objective.objective
        );
        
        await updateOnboarding({
          ...onboarding,
          plan: {
            ...onboarding.plan,
            targetKcal: newCalories,
            proteinG: macros.proteinG,
            carbsG: macros.carbsG,
            fatG: macros.fatG,
            fiberG: macros.fiberG,
          },
          completedAt: new Date().toISOString(), // Update timestamp to mark check-in
        });
        
        toast.success(`Meta ajustada: ${suggestion.delta > 0 ? '+' : ''}${suggestion.delta} kcal`);
      } else {
        // Just update the check-in timestamp
        await updateOnboarding({
          ...onboarding,
          completedAt: new Date().toISOString(),
        });
        toast.success("Check-in registrado!");
      }
      
      setApplied(true);
      onApplied?.();
      
      setTimeout(() => onClose(), 1500);
    } catch {
      toast.error("Erro ao aplicar ajuste");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSkip = async () => {
    if (onboarding) {
      // Just update the check-in timestamp without applying adjustment
      await updateOnboarding({
        ...onboarding,
        completedAt: new Date().toISOString(),
      });
    }
    
    toast.info("Check-in adiado. Você pode revisar novamente na próxima semana.");
    onClose();
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setApplied(false);
      setWeight("");
    }
  }, [open]);

  if (!onboarding) {
    return null;
  }

  const currentCalories = onboarding.plan.targetKcal;
  const newCalories = currentCalories + (suggestion?.delta || 0);

  // Next check-in date
  const getNextCheckinDate = () => {
    if (!onboarding?.completedAt) return null;
    const lastDate = new Date(onboarding.completedAt);
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + 7);
    return nextDue;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" />
            Check-in Semanal
          </DialogTitle>
        </DialogHeader>
        
        {applied ? (
          <div className="py-8 flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-lg font-medium text-center">Check-in registrado!</p>
            <p className="text-sm text-muted-foreground text-center">
              {adjustmentAvailable && suggestion?.delta !== 0 
                ? 'Seu plano foi atualizado com sucesso.'
                : 'Continue acompanhando seu progresso.'
              }
            </p>
          </div>
        ) : !available ? (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Check-in indisponível</p>
                <p className="text-sm text-muted-foreground">
                  O próximo check-in estará disponível em{' '}
                  <span className="font-medium text-primary">
                    {getNextCheckinDate()?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                  </span>.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Weight input */}
            <div className="space-y-2">
              <Label htmlFor="checkin-weight" className="flex items-center gap-2">
                <Scale className="w-4 h-4" />
                Peso desta semana (kg)
              </Label>
              <Input
                id="checkin-weight"
                type="text"
                inputMode="decimal"
                placeholder="Ex: 75.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-lg font-medium text-center"
                autoFocus
              />
            </div>
            
            {/* Current stats */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <span className="text-sm font-medium">{getObjectiveLabel(onboarding.objective.objective)}</span>
              </div>
              
              {currentWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Último peso</span>
                  <span className="text-sm font-medium">{currentWeight} kg</span>
                </div>
              )}
              
              {previousWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Peso anterior</span>
                  <span className="text-sm font-medium">{previousWeight} kg</span>
                </div>
              )}
              
              {trendKg !== null && TrendIcon && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tendência</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    trendKg < 0 ? "text-green-500" : 
                    trendKg > 0 ? "text-orange-500" : 
                    "text-muted-foreground"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {trendKg > 0 ? "+" : ""}{trendKg} kg/semana
                  </span>
                </div>
              )}
            </div>
            
            {/* Suggestion */}
            {adjustmentAvailable && suggestion ? (
              <div className={`rounded-lg p-4 border ${
                suggestion.delta === 0 
                  ? 'bg-green-500/10 border-green-500/30' 
                  : 'bg-primary/10 border-primary/30'
              }`}>
                <p className="text-sm font-medium mb-2">
                  {suggestion.delta === 0 
                    ? 'Manter plano atual' 
                    : `Ajuste sugerido: ${suggestion.delta > 0 ? '+' : ''}${suggestion.delta} kcal`
                  }
                </p>
                <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                
                {suggestion.delta !== 0 && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-sm">
                    <span className="text-muted-foreground">Nova meta</span>
                    <span className="font-medium">
                      {currentCalories} → <span className="text-primary">{newCalories}</span> kcal
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-lg p-4 border border-border bg-muted/20">
                <p className="text-sm font-medium mb-1">Ajuste automático indisponível</p>
                <p className="text-xs text-muted-foreground">
                  Precisa de mais registros de peso para calcular tendência e sugerir ajustes.
                </p>
              </div>
            )}
            
            {/* Safety note */}
            <p className="text-xs text-muted-foreground text-center italic">
              Ajustes são conservadores e seguros. Variações de peso são normais.
            </p>
          </div>
        )}
        
        {!applied && available && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} disabled={isApplying}>
              Adiar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isApplying || !weight.trim()}
            >
              {!adjustmentAvailable || suggestion?.delta === 0 ? 'Registrar' : 'Aplicar ajuste'}
            </Button>
          </DialogFooter>
        )}
        
        {!applied && !available && (
          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
