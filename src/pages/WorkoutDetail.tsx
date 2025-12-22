import { ArrowLeft, Play } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import ExerciseCard from "@/components/ExerciseCard";
import BottomNav from "@/components/BottomNav";

interface Exercise {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  slug: string;
}

interface WorkoutData {
  title: string;
  exercises: Exercise[];
}

const workoutDetails: Record<string, WorkoutData> = {
  "upper-a": {
    title: "Upper A",
    exercises: [
      { name: "Supino reto", sets: "4", reps: "6–10", rest: "2 min", slug: "supino-reto" },
      { name: "Remada curvada", sets: "4", reps: "6–10", rest: "2 min", slug: "remada-curvada" },
      { name: "Desenvolvimento", sets: "3", reps: "8–12", rest: "2 min", slug: "desenvolvimento" },
      { name: "Bíceps barra", sets: "3", reps: "8–12", rest: "2 min", slug: "biceps-barra" },
    ],
  },
  "lower-a": {
    title: "Lower A",
    exercises: [
      { name: "Agachamento livre", sets: "4", reps: "6–10", rest: "3 min", slug: "agachamento-livre" },
      { name: "Leg press", sets: "4", reps: "8–12", rest: "2 min", slug: "leg-press" },
      { name: "Mesa flexora", sets: "3", reps: "10–12", rest: "90s", slug: "mesa-flexora" },
      { name: "Panturrilha", sets: "4", reps: "12–15", rest: "60s", slug: "panturrilha" },
      { name: "Abdômen", sets: "3", reps: "15–20", rest: "60s", slug: "abdomen" },
    ],
  },
  "upper-b": {
    title: "Upper B",
    exercises: [
      { name: "Desenv. Arnold", sets: "4", reps: "8–12", rest: "2 min", slug: "desenvolvimento-arnold" },
      { name: "Barra fixa", sets: "4", reps: "6–10", rest: "2 min", slug: "barra-fixa" },
      { name: "Elevação lateral", sets: "3", reps: "12–15", rest: "60s", slug: "elevacao-lateral" },
      { name: "Tríceps testa", sets: "3", reps: "8–12", rest: "90s", slug: "triceps-testa" },
      { name: "Rosca alternada", sets: "3", reps: "10–12", rest: "60s", slug: "rosca-alternada" },
    ],
  },
  "lower-b": {
    title: "Lower B",
    exercises: [
      { name: "Levantamento terra", sets: "4", reps: "5–8", rest: "3 min", slug: "levantamento-terra" },
      { name: "Hack machine", sets: "4", reps: "8–12", rest: "2 min", slug: "hack-machine" },
      { name: "Passada", sets: "3", reps: "10–12", rest: "90s", slug: "passada" },
      { name: "Panturrilha", sets: "4", reps: "12–15", rest: "60s", slug: "panturrilha" },
      { name: "Posterior", sets: "3", reps: "10–12", rest: "90s", slug: "posterior" },
    ],
  },
};

const WorkoutDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const workout = workoutDetails[slug || ""] || { title: "Treino", exercises: [] };

  const handleStartWorkout = () => {
    if (workout.exercises.length > 0) {
      navigate(`/treino/${slug}/${workout.exercises[0].slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={() => navigate("/treino")}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{workout.title}</h1>
            <p className="text-sm text-muted-foreground">{workout.exercises.length} exercícios</p>
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-3 mt-6">
          {workout.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.slug}
              name={exercise.name}
              sets={exercise.sets}
              reps={exercise.reps}
              rest={exercise.rest}
              slug={exercise.slug}
              workoutSlug={slug || ""}
            />
          ))}
        </div>

        {/* Start Workout CTA */}
        <button
          onClick={handleStartWorkout}
          className="w-full mt-6 cta-button flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          Iniciar treino
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default WorkoutDetail;
