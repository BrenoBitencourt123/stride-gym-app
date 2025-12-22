import { ArrowLeft, Check, Play, Plus } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SetRow from "@/components/SetRow";

const exerciseData: Record<
  string,
  {
    name: string;
    nextExercise: string | null;
  }
> = {
  "supino-reto": {
    name: "Supino Reto",
    nextExercise: "remada-curvada",
  },
  "remada-curvada": {
    name: "Remada Curvada",
    nextExercise: "desenvolvimento",
  },
  desenvolvimento: {
    name: "Desenvolvimento",
    nextExercise: "biceps-barra",
  },
  "biceps-barra": {
    name: "Bíceps Barra",
    nextExercise: null,
  },
};

const ExerciseLogging = () => {
  const navigate = useNavigate();
  const { slug, exerciseSlug } = useParams();
  const [warmupDone, setWarmupDone] = useState(true);
  const [validSets, setValidSets] = useState([
    { kg: 100, reps: 8, rest: "2 min", done: true },
    { kg: 100, reps: 6, rest: "2 min", done: true },
    { kg: 100, reps: 6, rest: "2 min", done: true },
  ]);

  const exercise = exerciseData[exerciseSlug || ""] || {
    name: "Exercício",
    nextExercise: null,
  };

  const handleAddSet = () => {
    setValidSets((prev) => [
      ...prev,
      { kg: 100, reps: 6, rest: "2 min", done: false },
    ]);
  };

  const handleNextExercise = () => {
    if (exercise.nextExercise) {
      navigate(`/treino/${slug}/${exercise.nextExercise}`);
    } else {
      navigate(`/treino/${slug}`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/treino/${slug}`)}
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <h1 className="text-2xl font-bold text-foreground">{exercise.name}</h1>
          </div>
          <button className="text-primary text-sm font-medium hover:underline">
            Por quê?
          </button>
        </div>

        {/* Warmup Card */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Série de Aquecimento
          </h2>
          <button
            onClick={() => setWarmupDone(!warmupDone)}
            className="flex items-center gap-2"
          >
            <div
              className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${
                warmupDone
                  ? "bg-primary/20 border border-primary/40"
                  : "bg-secondary/50 border border-border/40"
              }`}
            >
              {warmupDone && <Check className="w-3.5 h-3.5 text-primary" />}
            </div>
            <span className="text-muted-foreground text-sm">
              <span className={warmupDone ? "text-foreground" : ""}>Aquecimento</span>{" "}
              Finalizado
            </span>
          </button>
        </div>

        {/* Feeder Set Card */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">Série Feeder</h2>

          {/* Table Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
            <div className="w-8">Conj.</div>
            <div className="w-8"></div>
            <div className="w-16 text-center">Kg</div>
            <div className="w-14 text-center">Reps</div>
            <div className="flex-1">Descanso</div>
          </div>

          {/* Feeder Rows */}
          <SetRow
            setNumber={1}
            initialKg={60}
            initialReps={8}
            initialRest="2 min"
            initialDone={true}
          />
          <SetRow
            setNumber={1}
            initialKg={70}
            initialReps={5}
            initialRest="2 min"
            initialDone={true}
          />

          {/* Suggestion Banner */}
          <div className="mt-4 bg-secondary/30 rounded-xl px-4 py-3 text-center">
            <span className="text-muted-foreground text-sm">
              Sugerimos{" "}
              <span className="text-primary font-medium">+2,5%</span> no próximo
              treino
            </span>
          </div>
        </div>

        {/* Valid Sets Card */}
        <div className="card-glass p-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-3">
            Séries Válidas
          </h2>

          {/* Table Header */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-1">
            <div className="w-8">Conj.</div>
            <div className="w-8"></div>
            <div className="w-16 text-center">Kg</div>
            <div className="w-14 text-center">Reps</div>
            <div className="flex-1">Descanso</div>
          </div>

          {/* Valid Set Rows */}
          {validSets.map((set, index) => (
            <SetRow
              key={index}
              setNumber={index + 1}
              initialKg={set.kg}
              initialReps={set.reps}
              initialRest={set.rest}
              initialDone={set.done}
              showDoneLabel={true}
            />
          ))}

          {/* Add Set Button */}
          <button
            onClick={handleAddSet}
            className="w-full mt-4 bg-secondary/30 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm">Adicionar série</span>
          </button>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-20 left-0 right-0 z-20 px-4 pb-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={handleNextExercise}
            className="w-full cta-button flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-primary-foreground" />
            <span className="text-lg font-semibold">Próximo exercício</span>
          </button>
        </div>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default ExerciseLogging;
