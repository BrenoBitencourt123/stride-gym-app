import { Dumbbell, TrendingDown, Shield } from "lucide-react";

interface StatsRowProps {
  streak: number;
  multiplier: number;
  shields: number;
}

const StatsRow = ({ streak, multiplier, shields }: StatsRowProps) => {
  return (
    <div className="card-glass flex items-center justify-center gap-6 px-6 py-3">
      <div className="flex items-center gap-2 text-foreground">
        <Dumbbell className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">Sequência {streak} dias</span>
      </div>
      
      <div className="flex items-center gap-1 text-foreground">
        <TrendingDown className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">x{multiplier.toFixed(1).replace('.', ',')}</span>
      </div>
      
      <div className="flex items-center gap-1 text-foreground">
        <Shield className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{shields}</span>
      </div>
    </div>
  );
};

export default StatsRow;
