// Fonte única de dados para treinos

export interface SetData {
  kg: number;
  reps: number;
}

export interface Exercise {
  id: string;
  nome: string;
  tags: string[];
  repsRange: string;
  descansoSeg: number;
  warmupEnabled: boolean;
  feederSetsDefault: SetData[];
  workSetsDefault: SetData[];
}

export interface Workout {
  id: string;
  titulo: string;
  duracaoEstimada: number;
  exercicios: Exercise[];
}

export const workouts: Record<string, Workout> = {
  "upper-a": {
    id: "upper-a",
    titulo: "Upper A",
    duracaoEstimada: 55,
    exercicios: [
      {
        id: "supino-reto",
        nome: "Supino Reto",
        tags: ["Principal", "Peito"],
        repsRange: "6–10",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 60, reps: 8 },
          { kg: 70, reps: 5 },
        ],
        workSetsDefault: [
          { kg: 100, reps: 8 },
          { kg: 100, reps: 6 },
          { kg: 100, reps: 6 },
        ],
      },
      {
        id: "remada-curvada",
        nome: "Remada Curvada",
        tags: ["Principal", "Costas"],
        repsRange: "6–10",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 50, reps: 8 },
          { kg: 60, reps: 5 },
        ],
        workSetsDefault: [
          { kg: 80, reps: 8 },
          { kg: 80, reps: 6 },
          { kg: 80, reps: 6 },
        ],
      },
      {
        id: "desenvolvimento",
        nome: "Desenvolvimento",
        tags: ["Principal", "Ombros"],
        repsRange: "8–12",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 30, reps: 10 },
          { kg: 40, reps: 6 },
        ],
        workSetsDefault: [
          { kg: 60, reps: 10 },
          { kg: 60, reps: 8 },
          { kg: 60, reps: 8 },
        ],
      },
      {
        id: "biceps-barra",
        nome: "Bíceps Barra",
        tags: ["Acessório", "Braços"],
        repsRange: "8–12",
        descansoSeg: 90,
        warmupEnabled: false,
        feederSetsDefault: [
          { kg: 20, reps: 10 },
        ],
        workSetsDefault: [
          { kg: 30, reps: 10 },
          { kg: 30, reps: 8 },
          { kg: 30, reps: 8 },
        ],
      },
    ],
  },
  "lower-a": {
    id: "lower-a",
    titulo: "Lower A",
    duracaoEstimada: 60,
    exercicios: [
      {
        id: "agachamento-livre",
        nome: "Agachamento Livre",
        tags: ["Principal", "Pernas"],
        repsRange: "6–10",
        descansoSeg: 180,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 60, reps: 8 },
          { kg: 80, reps: 5 },
        ],
        workSetsDefault: [
          { kg: 120, reps: 8 },
          { kg: 120, reps: 6 },
          { kg: 120, reps: 6 },
        ],
      },
      {
        id: "leg-press",
        nome: "Leg Press",
        tags: ["Principal", "Pernas"],
        repsRange: "8–12",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 100, reps: 10 },
        ],
        workSetsDefault: [
          { kg: 200, reps: 10 },
          { kg: 200, reps: 8 },
          { kg: 200, reps: 8 },
        ],
      },
      {
        id: "mesa-flexora",
        nome: "Mesa Flexora",
        tags: ["Acessório", "Posterior"],
        repsRange: "10–12",
        descansoSeg: 90,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 40, reps: 12 },
          { kg: 40, reps: 10 },
          { kg: 40, reps: 10 },
        ],
      },
      {
        id: "panturrilha-lower-a",
        nome: "Panturrilha",
        tags: ["Acessório", "Panturrilha"],
        repsRange: "12–15",
        descansoSeg: 60,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 80, reps: 15 },
          { kg: 80, reps: 12 },
          { kg: 80, reps: 12 },
          { kg: 80, reps: 12 },
        ],
      },
      {
        id: "abdomen-lower-a",
        nome: "Abdômen",
        tags: ["Acessório", "Core"],
        repsRange: "15–20",
        descansoSeg: 60,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 0, reps: 20 },
          { kg: 0, reps: 15 },
          { kg: 0, reps: 15 },
        ],
      },
    ],
  },
  "upper-b": {
    id: "upper-b",
    titulo: "Upper B",
    duracaoEstimada: 55,
    exercicios: [
      {
        id: "desenvolvimento-arnold",
        nome: "Desenvolvimento Arnold",
        tags: ["Principal", "Ombros"],
        repsRange: "8–12",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 20, reps: 10 },
          { kg: 30, reps: 6 },
        ],
        workSetsDefault: [
          { kg: 40, reps: 10 },
          { kg: 40, reps: 8 },
          { kg: 40, reps: 8 },
        ],
      },
      {
        id: "barra-fixa",
        nome: "Barra Fixa",
        tags: ["Principal", "Costas"],
        repsRange: "6–10",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 0, reps: 5 },
        ],
        workSetsDefault: [
          { kg: 0, reps: 8 },
          { kg: 0, reps: 6 },
          { kg: 0, reps: 6 },
        ],
      },
      {
        id: "elevacao-lateral",
        nome: "Elevação Lateral",
        tags: ["Acessório", "Ombros"],
        repsRange: "12–15",
        descansoSeg: 60,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 10, reps: 15 },
          { kg: 10, reps: 12 },
          { kg: 10, reps: 12 },
        ],
      },
      {
        id: "triceps-testa",
        nome: "Tríceps Testa",
        tags: ["Acessório", "Braços"],
        repsRange: "8–12",
        descansoSeg: 90,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 25, reps: 10 },
          { kg: 25, reps: 8 },
          { kg: 25, reps: 8 },
        ],
      },
      {
        id: "rosca-alternada",
        nome: "Rosca Alternada",
        tags: ["Acessório", "Braços"],
        repsRange: "10–12",
        descansoSeg: 60,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 12, reps: 12 },
          { kg: 12, reps: 10 },
          { kg: 12, reps: 10 },
        ],
      },
    ],
  },
  "lower-b": {
    id: "lower-b",
    titulo: "Lower B",
    duracaoEstimada: 60,
    exercicios: [
      {
        id: "levantamento-terra",
        nome: "Levantamento Terra",
        tags: ["Principal", "Posterior"],
        repsRange: "5–8",
        descansoSeg: 180,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 60, reps: 6 },
          { kg: 80, reps: 4 },
        ],
        workSetsDefault: [
          { kg: 120, reps: 6 },
          { kg: 120, reps: 5 },
          { kg: 120, reps: 5 },
        ],
      },
      {
        id: "hack-machine",
        nome: "Hack Machine",
        tags: ["Principal", "Pernas"],
        repsRange: "8–12",
        descansoSeg: 120,
        warmupEnabled: true,
        feederSetsDefault: [
          { kg: 60, reps: 8 },
        ],
        workSetsDefault: [
          { kg: 100, reps: 10 },
          { kg: 100, reps: 8 },
          { kg: 100, reps: 8 },
        ],
      },
      {
        id: "passada",
        nome: "Passada",
        tags: ["Acessório", "Pernas"],
        repsRange: "10–12",
        descansoSeg: 90,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 20, reps: 12 },
          { kg: 20, reps: 10 },
          { kg: 20, reps: 10 },
        ],
      },
      {
        id: "panturrilha-lower-b",
        nome: "Panturrilha",
        tags: ["Acessório", "Panturrilha"],
        repsRange: "12–15",
        descansoSeg: 60,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 80, reps: 15 },
          { kg: 80, reps: 12 },
          { kg: 80, reps: 12 },
          { kg: 80, reps: 12 },
        ],
      },
      {
        id: "posterior",
        nome: "Posterior",
        tags: ["Acessório", "Posterior"],
        repsRange: "10–12",
        descansoSeg: 90,
        warmupEnabled: false,
        feederSetsDefault: [],
        workSetsDefault: [
          { kg: 35, reps: 12 },
          { kg: 35, reps: 10 },
          { kg: 35, reps: 10 },
        ],
      },
    ],
  },
};

// Treino do dia fixo (pode ser dinamizado depois)
export const treinoDoDiaId = "upper-a";

export function getWorkout(id: string): Workout | undefined {
  return workouts[id];
}

export function getExercise(workoutId: string, exerciseId: string): Exercise | undefined {
  const workout = workouts[workoutId];
  if (!workout) return undefined;
  return workout.exercicios.find((e) => e.id === exerciseId);
}

export function getNextExercise(workoutId: string, currentExerciseId: string): Exercise | null {
  const workout = workouts[workoutId];
  if (!workout) return null;
  
  const currentIndex = workout.exercicios.findIndex((e) => e.id === currentExerciseId);
  if (currentIndex === -1 || currentIndex >= workout.exercicios.length - 1) {
    return null;
  }
  
  return workout.exercicios[currentIndex + 1];
}

export function isLastExercise(workoutId: string, exerciseId: string): boolean {
  const workout = workouts[workoutId];
  if (!workout) return true;
  
  const lastExercise = workout.exercicios[workout.exercicios.length - 1];
  return lastExercise?.id === exerciseId;
}
