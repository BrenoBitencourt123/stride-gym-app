import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, Calendar, User, Activity, Target, Sparkles } from "lucide-react";
import HelpIcon from "@/components/HelpIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { useAppStateContext } from "@/contexts/AppStateContext";
import { createOnboardingData } from "@/lib/onboarding";
import type { OnboardingData } from "@/lib/appState";
import {
  OnboardingProfile,
  OnboardingObjective,
  OnboardingPlan,
  Sex,
  ActivityLevel,
  Objective,
  calculateAge,
  isAdult,
  calculatePlan,
  getActivityLabel,
  getActivityDescription,
  getObjectiveLabel,
  getObjectiveDescription,
} from "@/lib/onboarding";

type Step = 'age' | 'basics' | 'activity' | 'objective' | 'summary';

const STEPS: Step[] = ['age', 'basics', 'activity', 'objective', 'summary'];

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { updateOnboarding } = useAppStateContext();
  const from = location.state?.from?.pathname || '/';

  const [currentStep, setCurrentStep] = useState<Step>('age');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [birthDate, setBirthDate] = useState('');
  const [ageError, setAgeError] = useState('');
  const [sex, setSex] = useState<Sex>('male');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>('moderate');
  const [objective, setObjective] = useState<Objective>('maintain');
  const [targetWeightKg, setTargetWeightKg] = useState('');

  // Calculated plan preview
  const [planPreview, setPlanPreview] = useState<OnboardingPlan | null>(null);

  // Calculate age and validate when birthDate changes
  useEffect(() => {
    if (birthDate) {
      const age = calculateAge(birthDate);
      if (age < 18) {
        setAgeError('Este aplicativo é voltado para adultos (18+). Por favor, verifique sua data de nascimento.');
      } else {
        setAgeError('');
      }
    }
  }, [birthDate]);

  // Calculate plan preview when reaching summary step
  useEffect(() => {
    if (currentStep === 'summary' && birthDate && heightCm && weightKg) {
      const parsedHeight = parseFloat(heightCm);
      const parsedWeight = parseFloat(weightKg);
      
      console.log('Onboarding calculation inputs:', {
        birthDate,
        sex,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        activityLevel,
        objective,
      });
      
      const profile: OnboardingProfile = {
        birthDate,
        sex,
        heightCm: parsedHeight,
        weightKg: parsedWeight,
        activityLevel,
      };
      const obj: OnboardingObjective = {
        objective,
        targetWeightKg: parseFloat(targetWeightKg) || parsedWeight,
      };
      const plan = calculatePlan(profile, obj);
      
      console.log('Calculated plan:', plan);
      
      setPlanPreview(plan);
    }
  }, [currentStep, birthDate, sex, heightCm, weightKg, activityLevel, objective, targetWeightKg]);

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / STEPS.length) * 100;

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 'age':
        return !!birthDate && isAdult(birthDate);
      case 'basics':
        return !!sex && parseFloat(heightCm) > 0 && parseFloat(weightKg) > 0;
      case 'activity':
        return !!activityLevel;
      case 'objective':
        return !!objective;
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  const goNext = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
    }
  };

  const goBack = () => {
    const idx = STEPS.indexOf(currentStep);
    if (idx > 0) {
      setCurrentStep(STEPS[idx - 1]);
    }
  };

  const handleComplete = async () => {
    if (!canGoNext()) return;

    setIsSubmitting(true);

    const profile: OnboardingProfile = {
      birthDate,
      sex,
      heightCm: parseFloat(heightCm),
      weightKg: parseFloat(weightKg),
      activityLevel,
    };

    const obj: OnboardingObjective = {
      objective,
      targetWeightKg: parseFloat(targetWeightKg) || parseFloat(weightKg),
    };

    try {
      // Create onboarding data with calculated plan
      const onboardingData = createOnboardingData(profile, obj);
      
      // Save to localStorage as backup (for legacy compatibility and redundancy)
      localStorage.setItem('levelup.onboarding.v1', JSON.stringify(onboardingData));
      
      // Save to Firebase via context
      await updateOnboarding(onboardingData);
      
      console.log('[Onboarding] Saved to Firebase:', {
        targetKcal: onboardingData.plan.targetKcal,
        proteinG: onboardingData.plan.proteinG,
      });

      // Navigate to the original route or home
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 500);
    } catch (error) {
      console.error('[Onboarding] Error saving:', error);
      setIsSubmitting(false);
    }
  };

  const stepIcons: Record<Step, React.ReactNode> = {
    age: <Calendar className="w-6 h-6" />,
    basics: <User className="w-6 h-6" />,
    activity: <Activity className="w-6 h-6" />,
    objective: <Target className="w-6 h-6" />,
    summary: <Sparkles className="w-6 h-6" />,
  };

  const stepTitles: Record<Step, string> = {
    age: 'Data de nascimento',
    basics: 'Dados básicos',
    activity: 'Nível de atividade',
    objective: 'Seu objetivo',
    summary: 'Seu plano',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-4 py-6">
        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Passo {currentStepIndex + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
            {stepIcons[currentStep]}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{stepTitles[currentStep]}</h1>
            <p className="text-sm text-muted-foreground">
              {currentStep === 'age' && 'Precisamos confirmar sua idade'}
              {currentStep === 'basics' && 'Informe seus dados físicos'}
              {currentStep === 'activity' && 'Qual seu nível de atividade física?'}
              {currentStep === 'objective' && 'O que você quer alcançar?'}
              {currentStep === 'summary' && 'Confira suas metas calculadas'}
            </p>
          </div>
        </div>

        {/* Step content */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Step 1: Age */}
          {currentStep === 'age' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="birthDate" className="text-foreground">
                  Data de nascimento
                </Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="mt-2"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>

              {birthDate && (
                <p className="text-sm text-muted-foreground">
                  Idade: {calculateAge(birthDate)} anos
                </p>
              )}

              {ageError && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-destructive">{ageError}</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Basics */}
          {currentStep === 'basics' && (
            <div className="space-y-5">
              <div>
                <Label className="text-foreground mb-3 block">Sexo biológico</Label>
                <RadioGroup value={sex} onValueChange={(v) => setSex(v as Sex)} className="flex gap-4">
                  <div className="flex-1">
                    <RadioGroupItem value="male" id="male" className="peer sr-only" />
                    <Label
                      htmlFor="male"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-secondary/30 p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                    >
                      <span className="text-lg">♂</span>
                      <span className="mt-1 text-sm font-medium">Masculino</span>
                    </Label>
                  </div>
                  <div className="flex-1">
                    <RadioGroupItem value="female" id="female" className="peer sr-only" />
                    <Label
                      htmlFor="female"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-border bg-secondary/30 p-4 hover:bg-secondary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                    >
                      <span className="text-lg">♀</span>
                      <span className="mt-1 text-sm font-medium">Feminino</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="height" className="text-foreground">
                    Altura (cm)
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="175"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="mt-2"
                    min={100}
                    max={250}
                  />
                </div>
                <div>
                  <Label htmlFor="weight" className="text-foreground">
                    Peso atual (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder="75"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="mt-2"
                    min={30}
                    max={300}
                    step={0.1}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Activity Level */}
          {currentStep === 'activity' && (
            <div className="space-y-3">
              {(['sedentary', 'light', 'moderate', 'active', 'athlete'] as ActivityLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setActivityLevel(level)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    activityLevel === level
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-secondary/30 hover:bg-secondary/50'
                  }`}
                >
                  <p className="font-medium text-foreground">{getActivityLabel(level)}</p>
                  <p className="text-sm text-muted-foreground mt-1">{getActivityDescription(level)}</p>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Objective */}
          {currentStep === 'objective' && (
            <div className="space-y-5">
              <div className="space-y-3">
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
                  Peso alvo (kg) — opcional
                </Label>
                <Input
                  id="targetWeight"
                  type="number"
                  placeholder={weightKg || "70"}
                  value={targetWeightKg}
                  onChange={(e) => setTargetWeightKg(e.target.value)}
                  className="mt-2"
                  min={30}
                  max={300}
                  step={0.1}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Deixe em branco para usar seu peso atual
                </p>
              </div>
            </div>
          )}

          {/* Step 5: Summary */}
          {currentStep === 'summary' && planPreview && (
            <div className="space-y-5">
              {/* BMR & TDEE */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">TMB</p>
                    <HelpIcon helpKey="onboard.bmr" size={12} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{planPreview.bmr}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">TDEE</p>
                    <HelpIcon helpKey="onboard.tdee" size={12} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{planPreview.tdee}</p>
                  <p className="text-xs text-muted-foreground">kcal/dia</p>
                </div>
              </div>

              {/* Target calories */}
              <div className="p-5 rounded-xl bg-primary/10 border border-primary/30">
                <p className="text-xs text-primary uppercase tracking-wider mb-1">Meta de calorias</p>
                <p className="text-3xl font-bold text-foreground">{planPreview.targetKcal}</p>
                <p className="text-sm text-muted-foreground">kcal por dia</p>
              </div>

              {/* Macros */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Macronutrientes</p>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-pink-500" />
                    <span className="text-foreground">Proteína</span>
                  </div>
                  <span className="font-semibold text-foreground">{planPreview.proteinG}g</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="text-foreground">Carboidratos</span>
                  </div>
                  <span className="font-semibold text-foreground">{planPreview.carbsG}g</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-400" />
                    <span className="text-foreground">Gordura</span>
                  </div>
                  <span className="font-semibold text-foreground">{planPreview.fatG}g</span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-foreground">Fibra</span>
                  </div>
                  <span className="font-semibold text-foreground">{planPreview.fiberG}g</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Esses valores foram calculados com base nos seus dados e objetivo. Você pode ajustá-los depois em Configurações.
              </p>
            </div>
          )}
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              onClick={goBack}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          )}

          {currentStep !== 'summary' ? (
            <Button
              onClick={goNext}
              disabled={!canGoNext()}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
