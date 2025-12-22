import { Filter } from "lucide-react";
import WorkoutCard from "@/components/WorkoutCard";
import BottomNav from "@/components/BottomNav";

const workoutPlans = [
  {
    title: "Upper A",
    slug: "upper-a",
    exercises: ["Supino reto", "Remada curvada", "Desenvolvimento", "Bíceps barra", "Tríceps corda"],
  },
  {
    title: "Lower A",
    slug: "lower-a",
    exercises: ["Agachamento livre", "Leg press", "Mesa flexora", "Panturrilha", "Abdômen"],
  },
  {
    title: "Upper B",
    slug: "upper-b",
    exercises: ["Desenv. Arnold", "Barra fixa", "Elevação lateral", "Tríceps testa", "Rosca alternada"],
  },
  {
    title: "Lower B",
    slug: "lower-b",
    exercises: ["Levantamento terra", "Hack machine", "Passada", "Panturrilha", "Posterior"],
  },
];

const Treino = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Plano de Treino</h1>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 rounded-full border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
              Ajustar plano
            </button>
            <button className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors">
              <Filter className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Workout Cards */}
        <div className="space-y-4">
          {workoutPlans.map((plan) => (
            <WorkoutCard
              key={plan.slug}
              title={plan.title}
              exercises={plan.exercises}
              slug={plan.slug}
            />
          ))}
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Treino;
