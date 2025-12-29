import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CalendarCheck, TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2 } from "lucide-react";
import { 
  getWeightStats, 
  suggestCalorieAdjustment, 
  applyCalorieAdjustment,
  recordCheckin,
  isCheckinAvailable,
  getNextCheckinDueDate
} from "@/lib/progress";
import { getOnboardingData, getObjectiveLabel } from "@/lib/onboarding";
import { toast } from "sonner";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

interface WeeklyCheckinModalProps {
  open: boolean;
  onClose: () => void;
  onApplied?: () => void;
}

export default function WeeklyCheckinModal({ open, onClose, onApplied }: WeeklyCheckinModalProps) {
  const triggerSync = useSyncTrigger();
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  
  const onboarding = getOnboardingData();
  const stats = getWeightStats();
  const available = isCheckinAvailable();
  
  // Calculate suggestion
  const suggestion = onboarding && stats.trendKg !== null
    ? suggestCalorieAdjustment(
        onboarding.objective.objective,
        stats.trendKg,
        onboarding.plan.targetKcal,
        onboarding.profile.weightKg,
        onboarding.profile.sex
      )
    : null;

  const TrendIcon = stats.trendKg !== null 
    ? stats.trendKg < 0 ? TrendingDown 
    : stats.trendKg > 0 ? TrendingUp 
    : Minus
    : null;

  const handleApply = () => {
    if (!suggestion || !stats.currentAvg7) return;
    
    setIsApplying(true);
    
    try {
      // Apply the adjustment
      if (suggestion.delta !== 0) {
        applyCalorieAdjustment(suggestion.delta, 'auto_adjust');
      }
      
      // Record the check-in
      recordCheckin(
        stats.currentAvg7,
        stats.prevAvg7,
        stats.trendKg,
        suggestion.delta,
        suggestion.delta,
        suggestion.reason
      );
      
      triggerSync();
      setApplied(true);
      
      if (suggestion.delta !== 0) {
        toast.success(`Meta ajustada: ${suggestion.delta > 0 ? '+' : ''}${suggestion.delta} kcal`);
      } else {
        toast.success("Check-in registrado! Plano mantido.");
      }
      
      onApplied?.();
      
      // Close after a short delay to show success state
      setTimeout(() => onClose(), 1500);
    } catch {
      toast.error("Erro ao aplicar ajuste");
    } finally {
      setIsApplying(false);
    }
  };

  const handleSkip = () => {
    if (!stats.currentAvg7) return;
    
    // Record check-in but don't apply adjustment
    recordCheckin(
      stats.currentAvg7,
      stats.prevAvg7,
      stats.trendKg,
      suggestion?.delta || 0,
      null, // Not applied
      'Usuário optou por não ajustar'
    );
    
    toast.info("Check-in adiado. Você pode revisar novamente na próxima semana.");
    onClose();
  };

  // Reset applied state when modal opens
  useEffect(() => {
    if (open) {
      setApplied(false);
    }
  }, [open]);

  if (!onboarding) {
    return null;
  }

  const currentCalories = onboarding.plan.targetKcal;
  const newCalories = currentCalories + (suggestion?.delta || 0);

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
            <p className="text-lg font-medium text-center">Ajuste aplicado!</p>
            <p className="text-sm text-muted-foreground text-center">
              Seu plano foi atualizado com sucesso.
            </p>
          </div>
        ) : !available ? (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
              <AlertCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Check-in indisponível</p>
                {stats.logsNeeded > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Você precisa registrar mais <span className="font-medium text-primary">{stats.logsNeeded}</span> peso(s) 
                    nos últimos 7 dias para calcular sua média.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    O próximo check-in estará disponível em{' '}
                    <span className="font-medium text-primary">
                      {getNextCheckinDueDate()?.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Current stats */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <span className="text-sm font-medium">{getObjectiveLabel(onboarding.objective.objective)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Média 7 dias</span>
                <span className="text-sm font-medium">{stats.currentAvg7} kg</span>
              </div>
              
              {stats.prevAvg7 !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Média anterior</span>
                  <span className="text-sm font-medium">{stats.prevAvg7} kg</span>
                </div>
              )}
              
              {stats.trendKg !== null && TrendIcon && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tendência</span>
                  <span className={`flex items-center gap-1 text-sm font-medium ${
                    stats.trendKg < 0 ? "text-green-500" : 
                    stats.trendKg > 0 ? "text-orange-500" : 
                    "text-muted-foreground"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    {stats.trendKg > 0 ? "+" : ""}{stats.trendKg} kg/semana
                  </span>
                </div>
              )}
            </div>
            
            {/* Suggestion */}
            {suggestion && (
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
            )}
            
            {/* Safety note */}
            <p className="text-xs text-muted-foreground text-center italic">
              Ajustes são conservadores e seguros. Variações diárias de peso são normais.
            </p>
          </div>
        )}
        
        {!applied && available && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} disabled={isApplying}>
              Adiar
            </Button>
            <Button onClick={handleApply} disabled={isApplying}>
              {suggestion?.delta === 0 ? 'Confirmar' : 'Aplicar ajuste'}
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
