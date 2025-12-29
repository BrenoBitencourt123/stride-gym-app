import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Objective,
  OnboardingObjective,
  getOnboardingData,
  updateObjective,
  getObjectiveLabel,
  getObjectiveDescription,
  calculatePlan,
} from "@/lib/onboarding";
import { toast } from "sonner";

const ObjectiveOnboarding = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load current data
  const existingData = getOnboardingData();

  const [objective, setObjective] = useState<Objective>(
    existingData?.objective?.objective || 'maintain'
  );
  const [targetWeightKg, setTargetWeightKg] = useState(
    existingData?.objective?.targetWeightKg?.toString() || ''
  );

  // Preview of new plan
  const [previewKcal, setPreviewKcal] = useState<number | null>(null);

  useEffect(() => {
    if (existingData?.profile) {
      const obj: OnboardingObjective = {
        objective,
        targetWeightKg: parseFloat(targetWeightKg) || existingData.profile.weightKg,
      };
      const plan = calculatePlan(existingData.profile, obj);
      setPreviewKcal(plan.targetKcal);
    }
  }, [objective, targetWeightKg, existingData?.profile]);

  const handleSave = () => {
    if (!existingData) {
      toast.error('Dados de onboarding não encontrados');
      navigate('/onboarding');
      return;
    }

    setIsSubmitting(true);

    const newObjective: OnboardingObjective = {
      objective,
      targetWeightKg: parseFloat(targetWeightKg) || existingData.profile.weightKg,
    };

    updateObjective(newObjective);
    toast.success('Objetivo atualizado com sucesso!');

    setTimeout(() => {
      navigate(-1);
    }, 300);
  };

  if (!existingData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Ajustar objetivo</h1>
            <p className="text-sm text-muted-foreground">Altere seu objetivo e metas</p>
          </div>
        </div>

        {/* Current stats */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-2">Seus dados atuais</p>
          <div className="flex gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Peso: </span>
              <span className="font-medium text-foreground">{existingData.profile.weightKg} kg</span>
            </div>
            <div>
              <span className="text-muted-foreground">Meta atual: </span>
              <span className="font-medium text-foreground">{existingData.plan.targetKcal} kcal</span>
            </div>
          </div>
        </div>

        {/* Objective selection */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <Label className="text-lg font-semibold text-foreground">Objetivo</Label>
          </div>

          <div className="space-y-3 mb-5">
            {(['lose_fat', 'maintain', 'gain_muscle'] as Objective[]).map((obj) => (
              <button
                key={obj}
                onClick={() => setObjective(obj)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                  objective === obj
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/30 hover:bg-secondary/50'
                }`}
              >
                <p className="font-medium text-foreground">{getObjectiveLabel(obj)}</p>
                <p className="text-sm text-muted-foreground mt-1">{getObjectiveDescription(obj)}</p>
              </button>
            ))}
          </div>

          <div>
            <Label htmlFor="targetWeight" className="text-foreground">
              Peso alvo (kg)
            </Label>
            <Input
              id="targetWeight"
              type="number"
              placeholder={existingData.profile.weightKg.toString()}
              value={targetWeightKg}
              onChange={(e) => setTargetWeightKg(e.target.value)}
              className="mt-2"
              min={30}
              max={300}
              step={0.1}
            />
          </div>
        </div>

        {/* Preview */}
        {previewKcal && (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-4 mb-6">
            <p className="text-sm text-primary mb-1">Nova meta de calorias</p>
            <p className="text-2xl font-bold text-foreground">{previewKcal} kcal/dia</p>
            {previewKcal !== existingData.plan.targetKcal && (
              <p className="text-xs text-muted-foreground mt-1">
                {previewKcal > existingData.plan.targetKcal 
                  ? `+${previewKcal - existingData.plan.targetKcal} kcal em relação ao atual`
                  : `${previewKcal - existingData.plan.targetKcal} kcal em relação ao atual`
                }
              </p>
            )}
          </div>
        )}

        {/* Save button */}
        <Button
          onClick={handleSave}
          disabled={isSubmitting}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              Salvar alterações
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ObjectiveOnboarding;
