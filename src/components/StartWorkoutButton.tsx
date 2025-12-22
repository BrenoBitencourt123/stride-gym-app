import { Play } from "lucide-react";
import { Link } from "react-router-dom";
import { treinoDoDiaId } from "@/data/workouts";
import { saveTreinoHoje } from "@/lib/storage";

const StartWorkoutButton = () => {
  const handleClick = () => {
    // Registra início do treino
    saveTreinoHoje({
      treinoId: treinoDoDiaId,
      startedAt: new Date().toISOString(),
    });
  };

  return (
    <Link 
      to={`/treino/${treinoDoDiaId}`} 
      className="cta-button group"
      onClick={handleClick}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
        <Play className="w-4 h-4 text-primary fill-primary" />
      </div>
      <span className="text-foreground">Iniciar treino de hoje</span>
    </Link>
  );
};

export default StartWorkoutButton;
