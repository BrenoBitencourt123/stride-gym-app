import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarCheck, TrendingDown, TrendingUp, Minus, AlertCircle, CheckCircle2, Scale, Settings2 } from "lucide-react";
import { 
  getWeightStats, 
  suggestCalorieAdjustment, 
  applyCalorieAdjustment,
  recordCheckin,
  isCheckinAvailable,
  isAdjustmentAvailable,
  getNextCheckinDueDate,
  getWeighingFrequency,
  setWeighingFrequency,
  recordWeeklyCheckinWithWeight,
  WeighingFrequency
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
  const [showSettings, setShowSettings] = useState(false);
  const [weight, setWeight] = useState("");
  
  const onboarding = getOnboardingData();
  const stats = getWeightStats();
  const frequency = getWeighingFrequency();
  const available = isCheckinAvailable();
  const adjustmentAvailable = isAdjustmentAvailable();
  
  // Calculate suggestion based on mode
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
    if (!onboarding) return;
    
    setIsApplying(true);
    
    try {
      // For weekly mode: first record the weight if provided
      if (frequency === 'weekly' && weight) {
        const parsedWeight = parseFloat(weight.replace(",", "."));
        if (!isNaN(parsedWeight) && parsedWeight >= 30 && parsedWeight <= 300) {
          recordWeeklyCheckinWithWeight(parsedWeight);
        }
      }
      
      // Apply the adjustment if available
      if (suggestion && suggestion.delta !== 0 && adjustmentAvailable) {
        applyCalorieAdjustment(suggestion.delta, 'auto_adjust');
      }
      
      // Record the check-in
      if (frequency === 'daily' && stats.currentAvg7) {
        recordCheckin({
          avg7: stats.currentAvg7,
          prevAvg7: stats.prevAvg7,
          trendKg: stats.trendKg,
          suggestedDelta: suggestion?.delta || 0,
          appliedDelta: adjustmentAvailable ? (suggestion?.delta || 0) : null,
          notes: suggestion?.reason,
        });
      } else if (frequency === 'weekly') {
        const parsedWeight = parseFloat(weight.replace(",", "."));
        const { currentWeight, prevWeight, trendKg } = stats.weeklyModeStats;
        recordCheckin({
          weightKg: !isNaN(parsedWeight) ? parsedWeight : currentWeight || undefined,
          prevWeightKg: prevWeight,
          trendKg: trendKg,
          suggestedDelta: suggestion?.delta || 0,
          appliedDelta: adjustmentAvailable ? (suggestion?.delta || 0) : null,
          notes: suggestion?.reason || 'Check-in semanal registrado',
        });
      }
      
      triggerSync();
      setApplied(true);
      
      if (suggestion?.delta !== 0 && adjustmentAvailable) {
        toast.success(`Meta ajustada: ${suggestion!.delta > 0 ? '+' : ''}${suggestion!.delta} kcal`);
      } else {
        toast.success("Check-in registrado!");
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
    // Record check-in but don't apply adjustment
    if (frequency === 'daily' && stats.currentAvg7) {
      recordCheckin({
        avg7: stats.currentAvg7,
        prevAvg7: stats.prevAvg7,
        trendKg: stats.trendKg,
        suggestedDelta: suggestion?.delta || 0,
        appliedDelta: null,
        notes: 'Usuário optou por não ajustar',
      });
    } else {
      recordCheckin({
        trendKg: stats.weeklyModeStats.trendKg,
        suggestedDelta: suggestion?.delta || 0,
        appliedDelta: null,
        notes: 'Usuário optou por adiar',
      });
    }
    
    toast.info("Check-in adiado. Você pode revisar novamente na próxima semana.");
    onClose();
  };

  const handleFrequencyChange = (newFreq: WeighingFrequency) => {
    setWeighingFrequency(newFreq);
    setShowSettings(false);
    toast.success(`Modo alterado para ${newFreq === 'weekly' ? 'semanal' : 'diário'}`);
  };

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setApplied(false);
      setShowSettings(false);
      setWeight("");
    }
  }, [open]);

  if (!onboarding) {
    return null;
  }

  const currentCalories = onboarding.plan.targetKcal;
  const newCalories = currentCalories + (suggestion?.delta || 0);

  // For weekly mode: show current stats differently
  const displayWeight = frequency === 'weekly' 
    ? stats.weeklyModeStats.currentWeight
    : stats.currentAvg7;
  const displayPrevWeight = frequency === 'weekly'
    ? stats.weeklyModeStats.prevWeight
    : stats.prevAvg7;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary" />
              Check-in Semanal
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        {showSettings ? (
          <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Frequência de pesagem:</p>
            <div className="space-y-2">
              <button
                onClick={() => handleFrequencyChange('weekly')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  frequency === 'weekly' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <p className="font-medium text-sm">Semanal (recomendado)</p>
                <p className="text-xs text-muted-foreground">
                  Um registro por semana. Menos fricção, mais praticidade.
                </p>
              </button>
              <button
                onClick={() => handleFrequencyChange('daily')}
                className={`w-full p-3 rounded-lg border text-left transition-colors ${
                  frequency === 'daily' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-border hover:bg-muted/30'
                }`}
              >
                <p className="font-medium text-sm">Diário (avançado)</p>
                <p className="text-xs text-muted-foreground">
                  Registro diário com média móvel de 7 dias. Mais preciso.
                </p>
              </button>
            </div>
          </div>
        ) : applied ? (
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
                {frequency === 'daily' && stats.logsNeeded > 0 ? (
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
            {/* Weekly mode: weight input */}
            {frequency === 'weekly' && (
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
            )}
            
            {/* Current stats */}
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Objetivo</span>
                <span className="text-sm font-medium">{getObjectiveLabel(onboarding.objective.objective)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Modo</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {frequency === 'weekly' ? 'Semanal' : 'Diário'}
                </span>
              </div>
              
              {displayWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {frequency === 'weekly' ? 'Último check-in' : 'Média 7 dias'}
                  </span>
                  <span className="text-sm font-medium">{displayWeight} kg</span>
                </div>
              )}
              
              {displayPrevWeight !== null && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {frequency === 'weekly' ? 'Check-in anterior' : 'Média anterior'}
                  </span>
                  <span className="text-sm font-medium">{displayPrevWeight} kg</span>
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
            ) : frequency === 'weekly' && stats.weeklyModeStats.checkinsNeeded > 0 ? (
              <div className="rounded-lg p-4 border border-border bg-muted/20">
                <p className="text-sm font-medium mb-1">Ajuste automático indisponível</p>
                <p className="text-xs text-muted-foreground">
                  Precisa de mais {stats.weeklyModeStats.checkinsNeeded} check-in(s) para calcular tendência e sugerir ajustes.
                </p>
              </div>
            ) : null}
            
            {/* Safety note */}
            <p className="text-xs text-muted-foreground text-center italic">
              Ajustes são conservadores e seguros. Variações de peso são normais.
            </p>
          </div>
        )}
        
        {!showSettings && !applied && available && (
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleSkip} disabled={isApplying}>
              Adiar
            </Button>
            <Button 
              onClick={handleApply} 
              disabled={isApplying || (frequency === 'weekly' && !weight.trim())}
            >
              {!adjustmentAvailable || suggestion?.delta === 0 ? 'Registrar' : 'Aplicar ajuste'}
            </Button>
          </DialogFooter>
        )}
        
        {!showSettings && !applied && !available && (
          <DialogFooter>
            <Button onClick={onClose}>Fechar</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
