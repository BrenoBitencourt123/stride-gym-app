import { ChevronLeft } from "lucide-react";

interface XPBarProps {
  current: number;
  max: number;
}

const XPBar = ({ current, max }: XPBarProps) => {
  const percentage = (current / max) * 100;

  return (
    <div className="w-full px-4">
      <div className="flex items-center gap-2">
        <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        <div className="flex-1 xp-bar">
          <div 
            className="xp-bar-fill" 
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground mt-2 font-medium">
        {current.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')} XP
      </p>
    </div>
  );
};

export default XPBar;
