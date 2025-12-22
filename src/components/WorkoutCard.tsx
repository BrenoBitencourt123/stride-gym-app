import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkoutCardProps {
  title: string;
  exercises: string[];
  slug: string;
}

const WorkoutCard = ({ title, exercises, slug }: WorkoutCardProps) => {
  return (
    <Link
      to={`/treino/${slug}`}
      className="w-full card-glass p-5 flex items-start justify-between gap-4 text-left hover:bg-card/80 transition-colors group block"
    >
      <div className="flex-1">
        <h3 className="text-xl font-semibold text-foreground mb-3">{title}</h3>
        <div className="flex flex-wrap gap-2">
          {exercises.map((exercise, index) => (
            <span
              key={index}
              className="px-3 py-1.5 rounded-full bg-secondary text-muted-foreground text-sm font-medium border border-border/50"
            >
              {exercise}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-muted-foreground mt-1 group-hover:text-foreground transition-colors flex-shrink-0" />
    </Link>
  );
};

export default WorkoutCard;
