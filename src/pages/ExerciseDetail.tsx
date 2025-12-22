import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

const exerciseNames: Record<string, string> = {
  "supino-reto": "Supino Reto",
  "remada-curvada": "Remada Curvada",
  "desenvolvimento": "Desenvolvimento",
  "biceps-barra": "Bíceps Barra",
};

const ExerciseDetail = () => {
  const navigate = useNavigate();
  const { slug, exerciseSlug } = useParams();
  const exerciseName = exerciseNames[exerciseSlug || ""] || "Exercício";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/treino/${slug}`)}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground">{exerciseName}</h1>
        </div>

        {/* Placeholder */}
        <div className="card-glass p-6">
          <p className="text-muted-foreground text-center">
            Tela de registro do exercício em breve...
          </p>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetail;
