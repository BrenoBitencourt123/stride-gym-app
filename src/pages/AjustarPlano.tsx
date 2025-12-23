import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown, GripVertical, Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "@/hooks/use-toast";
import { getUserWorkoutPlan, saveUserWorkoutPlan, resetUserWorkoutPlan, type UserWorkoutPlan, type UserExercise, type UserWorkout } from "@/lib/storage";
import { useSyncTrigger } from "@/hooks/useSyncTrigger";

const MUSCLE_GROUPS = [
  "Peito", "Costas", "Ombros", "Bíceps", "Tríceps", "Pernas", "Posterior", "Panturrilha", "Core", "Braços"
];

const REST_OPTIONS = [
  { value: "60", label: "60s" },
  { value: "90", label: "90s" },
  { value: "120", label: "2min" },
  { value: "150", label: "2:30min" },
  { value: "180", label: "3min" },
];

const EXERCISE_SUGGESTIONS = [
  "Supino Reto", "Supino Inclinado", "Supino Declinado", "Crucifixo", "Crossover",
  "Remada Curvada", "Remada Baixa", "Puxada Frontal", "Barra Fixa", "Pulldown",
  "Desenvolvimento", "Elevação Lateral", "Elevação Frontal", "Face Pull",
  "Rosca Direta", "Rosca Alternada", "Rosca Martelo", "Rosca Scott",
  "Tríceps Corda", "Tríceps Testa", "Tríceps Francês", "Mergulho",
  "Agachamento Livre", "Leg Press", "Hack Machine", "Extensora", "Passada",
  "Mesa Flexora", "Stiff", "Levantamento Terra", "Good Morning",
  "Panturrilha em Pé", "Panturrilha Sentado",
  "Abdominal", "Prancha", "Crunch",
];

function generateExerciseId(name: string): string {
  const baseId = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${baseId}-${Date.now()}`;
}

function generateWorkoutId(title: string): string {
  const baseId = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return `${baseId}-${Date.now()}`;
}

const AjustarPlano = () => {
  const navigate = useNavigate();
  const triggerSync = useSyncTrigger();
  const [plan, setPlan] = useState<UserWorkoutPlan | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string[]>([]);
  
  // Modal states
  const [showDeleteWorkout, setShowDeleteWorkout] = useState<string | null>(null);
  const [showDeleteExercise, setShowDeleteExercise] = useState<{ workoutId: string; exerciseId: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState<string | null>(null);
  const [showEditExercise, setShowEditExercise] = useState<{ workoutId: string; exercise: UserExercise } | null>(null);
  
  // New exercise form
  const [newExercise, setNewExercise] = useState<Partial<UserExercise>>({
    nome: "",
    muscleGroup: "Peito",
    repsRange: "8–12",
    descansoSeg: 120,
  });

  useEffect(() => {
    const userPlan = getUserWorkoutPlan();
    setPlan(userPlan);
    // Open first workout by default
    if (userPlan.workouts.length > 0) {
      setOpenAccordion([userPlan.workouts[0].id]);
    }
  }, []);

  const handleSave = () => {
    if (!plan) return;
    saveUserWorkoutPlan(plan);
    triggerSync(); // Sync after saving workout plan
    toast({
      title: "Plano salvo!",
      description: "Suas alterações foram salvas com sucesso.",
    });
    navigate("/treino");
  };

  const handleReset = () => {
    resetUserWorkoutPlan();
    const defaultPlan = getUserWorkoutPlan();
    setPlan(defaultPlan);
    setShowResetConfirm(false);
    toast({
      title: "Plano restaurado",
      description: "O plano foi restaurado para o padrão.",
    });
  };

  // Workout operations
  const renameWorkout = (workoutId: string, newTitle: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      workouts: plan.workouts.map(w =>
        w.id === workoutId ? { ...w, titulo: newTitle } : w
      ),
    });
  };

  const addWorkout = () => {
    if (!plan) return;
    const newWorkout: UserWorkout = {
      id: generateWorkoutId(`Treino ${plan.workouts.length + 1}`),
      titulo: `Treino ${plan.workouts.length + 1}`,
      duracaoEstimada: 45,
      exercicios: [],
    };
    setPlan({
      ...plan,
      workouts: [...plan.workouts, newWorkout],
    });
    setOpenAccordion([...openAccordion, newWorkout.id]);
  };

  const deleteWorkout = (workoutId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      workouts: plan.workouts.filter(w => w.id !== workoutId),
    });
    setShowDeleteWorkout(null);
  };

  const moveWorkout = (workoutId: string, direction: "up" | "down") => {
    if (!plan) return;
    const index = plan.workouts.findIndex(w => w.id === workoutId);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= plan.workouts.length) return;
    
    const newWorkouts = [...plan.workouts];
    [newWorkouts[index], newWorkouts[newIndex]] = [newWorkouts[newIndex], newWorkouts[index]];
    setPlan({ ...plan, workouts: newWorkouts });
  };

  // Exercise operations
  const addExercise = (workoutId: string) => {
    if (!plan || !newExercise.nome) return;
    
    const exercise: UserExercise = {
      id: generateExerciseId(newExercise.nome),
      nome: newExercise.nome,
      muscleGroup: newExercise.muscleGroup || "Peito",
      tags: ["Principal", newExercise.muscleGroup || "Peito"],
      repsRange: newExercise.repsRange || "8–12",
      descansoSeg: newExercise.descansoSeg || 120,
      warmupEnabled: true,
      feederSetsDefault: [{ kg: 20, reps: 8 }],
      workSetsDefault: [
        { kg: 40, reps: 8 },
        { kg: 40, reps: 8 },
        { kg: 40, reps: 8 },
      ],
      observacoes: newExercise.observacoes,
    };
    
    setPlan({
      ...plan,
      workouts: plan.workouts.map(w =>
        w.id === workoutId
          ? { ...w, exercicios: [...w.exercicios, exercise] }
          : w
      ),
    });
    
    setShowAddExercise(null);
    setNewExercise({
      nome: "",
      muscleGroup: "Peito",
      repsRange: "8–12",
      descansoSeg: 120,
    });
  };

  const updateExercise = (workoutId: string, exerciseId: string, updates: Partial<UserExercise>) => {
    if (!plan) return;
    setPlan({
      ...plan,
      workouts: plan.workouts.map(w =>
        w.id === workoutId
          ? {
              ...w,
              exercicios: w.exercicios.map(e =>
                e.id === exerciseId ? { ...e, ...updates } : e
              ),
            }
          : w
      ),
    });
  };

  const deleteExercise = (workoutId: string, exerciseId: string) => {
    if (!plan) return;
    setPlan({
      ...plan,
      workouts: plan.workouts.map(w =>
        w.id === workoutId
          ? { ...w, exercicios: w.exercicios.filter(e => e.id !== exerciseId) }
          : w
      ),
    });
    setShowDeleteExercise(null);
  };

  const moveExercise = (workoutId: string, exerciseId: string, direction: "up" | "down") => {
    if (!plan) return;
    const workout = plan.workouts.find(w => w.id === workoutId);
    if (!workout) return;
    
    const index = workout.exercicios.findIndex(e => e.id === exerciseId);
    if (index === -1) return;
    
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= workout.exercicios.length) return;
    
    const newExercicios = [...workout.exercicios];
    [newExercicios[index], newExercicios[newIndex]] = [newExercicios[newIndex], newExercicios[index]];
    
    setPlan({
      ...plan,
      workouts: plan.workouts.map(w =>
        w.id === workoutId ? { ...w, exercicios: newExercicios } : w
      ),
    });
  };

  if (!plan) return null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/treino")}
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-xl font-bold text-foreground">Ajustar Plano</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Restaurar
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto px-4 pt-4">
        <Accordion
          type="multiple"
          value={openAccordion}
          onValueChange={setOpenAccordion}
          className="space-y-3"
        >
          {plan.workouts.map((workout, workoutIndex) => (
            <AccordionItem
              key={workout.id}
              value={workout.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="flex items-center px-4 py-3 gap-2">
                <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                
                <AccordionTrigger className="flex-1 py-0 hover:no-underline">
                  <Input
                    value={workout.titulo}
                    onChange={(e) => renameWorkout(workout.id, e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-transparent border-none p-0 h-auto text-lg font-semibold text-foreground focus-visible:ring-0"
                  />
                </AccordionTrigger>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => moveWorkout(workout.id, "up")}
                    disabled={workoutIndex === 0}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                  >
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => moveWorkout(workout.id, "down")}
                    disabled={workoutIndex === plan.workouts.length - 1}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => setShowDeleteWorkout(workout.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </button>
                </div>
              </div>

              <AccordionContent className="px-4 pb-4">
                <div className="space-y-2">
                  {workout.exercicios.map((exercise, exerciseIndex) => (
                    <div
                      key={exercise.id}
                      className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg"
                    >
                      <GripVertical className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => setShowEditExercise({ workoutId: workout.id, exercise })}
                      >
                        <p className="text-sm font-medium text-foreground">{exercise.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {exercise.muscleGroup} • {exercise.repsRange} • {exercise.descansoSeg}s
                        </p>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => moveExercise(workout.id, exercise.id, "up")}
                          disabled={exerciseIndex === 0}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary disabled:opacity-30 transition-colors"
                        >
                          <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => moveExercise(workout.id, exercise.id, "down")}
                          disabled={exerciseIndex === workout.exercicios.length - 1}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-secondary disabled:opacity-30 transition-colors"
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => setShowDeleteExercise({ workoutId: workout.id, exerciseId: exercise.id })}
                          className="w-7 h-7 rounded flex items-center justify-center hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => setShowAddExercise(workout.id)}
                    className="w-full flex items-center justify-center gap-2 p-3 border border-dashed border-border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-primary" />
                    <span className="text-sm text-primary font-medium">Adicionar exercício</span>
                  </button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Add workout button */}
        <button
          onClick={addWorkout}
          className="w-full mt-4 flex items-center justify-center gap-2 p-4 border border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="w-5 h-5 text-primary" />
          <span className="text-primary font-medium">Adicionar dia de treino</span>
        </button>
      </div>

      {/* Sticky save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="max-w-md mx-auto">
          <Button onClick={handleSave} className="w-full" size="lg">
            <Save className="w-5 h-5 mr-2" />
            Salvar plano
          </Button>
        </div>
      </div>

      {/* Delete workout confirmation */}
      <Dialog open={!!showDeleteWorkout} onOpenChange={() => setShowDeleteWorkout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover treino?</DialogTitle>
            <DialogDescription>
              Essa ação não pode ser desfeita. O histórico de exercícios será mantido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteWorkout(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => showDeleteWorkout && deleteWorkout(showDeleteWorkout)}>
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete exercise confirmation */}
      <Dialog open={!!showDeleteExercise} onOpenChange={() => setShowDeleteExercise(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remover exercício?</DialogTitle>
            <DialogDescription>
              O histórico de progressão será mantido caso adicione o exercício novamente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteExercise(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteExercise && deleteExercise(showDeleteExercise.workoutId, showDeleteExercise.exerciseId)}
            >
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset confirmation */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restaurar plano padrão?</DialogTitle>
            <DialogDescription>
              Todas as suas customizações serão perdidas. O histórico de exercícios será mantido.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add exercise modal */}
      <Dialog open={!!showAddExercise} onOpenChange={() => setShowAddExercise(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar exercício</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do exercício</Label>
              <Input
                value={newExercise.nome}
                onChange={(e) => setNewExercise({ ...newExercise, nome: e.target.value })}
                placeholder="Ex: Supino Reto"
                list="exercise-suggestions"
              />
              <datalist id="exercise-suggestions">
                {EXERCISE_SUGGESTIONS.map((ex) => (
                  <option key={ex} value={ex} />
                ))}
              </datalist>
            </div>

            <div className="space-y-2">
              <Label>Grupo muscular</Label>
              <Select
                value={newExercise.muscleGroup}
                onValueChange={(value) => setNewExercise({ ...newExercise, muscleGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Faixa de reps</Label>
                <Input
                  value={newExercise.repsRange}
                  onChange={(e) => setNewExercise({ ...newExercise, repsRange: e.target.value })}
                  placeholder="8–12"
                />
              </div>
              <div className="space-y-2">
                <Label>Descanso</Label>
                <Select
                  value={String(newExercise.descansoSeg)}
                  onValueChange={(value) => setNewExercise({ ...newExercise, descansoSeg: parseInt(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {REST_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações (opcional)</Label>
              <Input
                value={newExercise.observacoes || ""}
                onChange={(e) => setNewExercise({ ...newExercise, observacoes: e.target.value })}
                placeholder="Ex: Pausa no final"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddExercise(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => showAddExercise && addExercise(showAddExercise)}
              disabled={!newExercise.nome}
            >
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit exercise modal */}
      <Dialog open={!!showEditExercise} onOpenChange={() => setShowEditExercise(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar exercício</DialogTitle>
          </DialogHeader>
          
          {showEditExercise && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do exercício</Label>
                <Input
                  value={showEditExercise.exercise.nome}
                  onChange={(e) =>
                    setShowEditExercise({
                      ...showEditExercise,
                      exercise: { ...showEditExercise.exercise, nome: e.target.value },
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Grupo muscular</Label>
                <Select
                  value={showEditExercise.exercise.muscleGroup}
                  onValueChange={(value) =>
                    setShowEditExercise({
                      ...showEditExercise,
                      exercise: { ...showEditExercise.exercise, muscleGroup: value },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MUSCLE_GROUPS.map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faixa de reps</Label>
                  <Input
                    value={showEditExercise.exercise.repsRange}
                    onChange={(e) =>
                      setShowEditExercise({
                        ...showEditExercise,
                        exercise: { ...showEditExercise.exercise, repsRange: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Descanso</Label>
                  <Select
                    value={String(showEditExercise.exercise.descansoSeg)}
                    onValueChange={(value) =>
                      setShowEditExercise({
                        ...showEditExercise,
                        exercise: { ...showEditExercise.exercise, descansoSeg: parseInt(value) },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REST_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observações (opcional)</Label>
                <Input
                  value={showEditExercise.exercise.observacoes || ""}
                  onChange={(e) =>
                    setShowEditExercise({
                      ...showEditExercise,
                      exercise: { ...showEditExercise.exercise, observacoes: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditExercise(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (showEditExercise) {
                  updateExercise(
                    showEditExercise.workoutId,
                    showEditExercise.exercise.id,
                    showEditExercise.exercise
                  );
                  setShowEditExercise(null);
                }
              }}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AjustarPlano;
