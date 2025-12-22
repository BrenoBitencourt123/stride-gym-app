import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const workoutDetails: Record<string, { title: string; exercises: string[] }> = {
  "upper-a": {
    title: "Upper A",
    exercises: ["Supino reto", "Remada curvada", "Desenvolvimento", "Bíceps barra", "Tríceps corda"],
  },
  "lower-a": {
    title: "Lower A",
    exercises: ["Agachamento livre", "Leg press", "Mesa flexora", "Panturrilha", "Abdômen"],
  },
  "upper-b": {
    title: "Upper B",
    exercises: ["Desenv. Arnold", "Barra fixa", "Elevação lateral", "Tríceps testa", "Rosca alternada"],
  },
  "lower-b": {
    title: "Lower B",
    exercises: ["Levantamento terra", "Hack machine", "Passada", "Panturrilha", "Posterior"],
  },
};

const WorkoutDetail = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const workout = workoutDetails[slug || ""] || { title: "Treino", exercises: [] };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Starfield background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate("/treino")}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{workout.title}</h1>
        </div>

        {/* Placeholder content */}
        <div className="card-glass p-6">
          <p className="text-muted-foreground text-center">
            Detalhes do treino em breve...
          </p>
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetail;
