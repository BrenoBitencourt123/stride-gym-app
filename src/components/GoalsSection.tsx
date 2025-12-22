import { Dumbbell, Apple, Scale } from "lucide-react";

interface Goal {
  id: string;
  icon: "workout" | "nutrition" | "weight";
  label: string;
  xp: number;
  completed?: boolean;
}

interface GoalsSectionProps {
  goals: Goal[];
}

const iconMap = {
  workout: Dumbbell,
  nutrition: Apple,
  weight: Scale,
};

const GoalsSection = ({ goals }: GoalsSectionProps) => {
  return (
    <div className="w-full">
      <h2 className="text-lg font-semibold text-foreground mb-3">Metas de hoje</h2>
      <div className="card-glass overflow-hidden">
        {goals.map((goal) => {
          const Icon = iconMap[goal.icon];
          return (
            <div key={goal.id} className="goal-item hover:bg-muted/30 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{goal.label}</span>
              </div>
              <span className="text-sm font-semibold text-primary">+{goal.xp} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsSection;
