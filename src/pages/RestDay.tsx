import { Link } from "react-router-dom";
import { Coffee, ArrowRight, Calendar, Footprints, StretchHorizontal } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { getDayName } from "@/lib/weekUtils";

const suggestions = [
  { icon: StretchHorizontal, label: "Alongamento leve", description: "15-20 minutos de mobilidade" },
  { icon: Footprints, label: "Caminhada", description: "30 minutos ao ar livre" },
  { icon: Coffee, label: "Recuperação ativa", description: "Yoga ou meditação" },
];

const RestDay = () => {
  const today = new Date();
  const dayName = getDayName(today);

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-16 flex flex-col items-center">
        {/* Rest Icon */}
        <div className="w-24 h-24 rounded-full bg-secondary/50 flex items-center justify-center mb-6">
          <Coffee className="w-12 h-12 text-muted-foreground" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-foreground mb-2">Dia de Descanso</h1>
        <p className="text-muted-foreground text-center mb-2">
          {dayName} - Recuperação
        </p>
        <p className="text-sm text-muted-foreground/80 text-center mb-8 max-w-xs">
          O descanso é essencial para o crescimento muscular. Aproveite para recuperar!
        </p>

        {/* Suggestions */}
        <div className="w-full space-y-3 mb-8">
          <p className="text-sm font-medium text-muted-foreground mb-2">Sugestões para hoje:</p>
          {suggestions.map((suggestion, index) => (
            <div key={index} className="card-glass p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center">
                <suggestion.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{suggestion.label}</p>
                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          to="/treino"
          className="w-full cta-button flex items-center justify-center gap-3 bg-secondary hover:bg-secondary/80"
        >
          <Calendar className="w-5 h-5" />
          <span className="text-lg font-semibold">Ver plano de treino</span>
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Bottom Nav */}
      <BottomNav />
    </div>
  );
};

export default RestDay;
