import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const Nutricao = () => {
  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-6">Nutrição</h1>

        {/* Card 1: Meta diária */}
        <div className="card-glass p-4 mb-4">
          <span className="text-sm text-muted-foreground">Meta diária</span>
          
          <div className="flex items-center justify-between mt-1 mb-3">
            <h2 className="text-xl font-semibold text-foreground">Calorias</h2>
            <span className="text-lg font-medium text-foreground">0 / 2255 kcal</span>
          </div>

          {/* Progress bar - segmented for macros */}
          <div className="flex h-2 rounded-full overflow-hidden bg-muted/30 mb-3">
            <div className="bg-pink-500 w-1/3" style={{ width: '0%' }} />
            <div className="bg-yellow-400 w-1/3" style={{ width: '0%' }} />
            <div className="bg-blue-400 w-1/3" style={{ width: '0%' }} />
          </div>

          {/* Macro breakdown */}
          <div className="flex justify-between text-sm">
            <div className="flex items-center gap-1">
              <span className="text-pink-500">Proteína</span>
              <span className="text-muted-foreground">–g</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">Carbs</span>
              <span className="text-muted-foreground">–g</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">Gordura</span>
              <span className="text-muted-foreground">–g</span>
            </div>
          </div>
        </div>

        {/* Card 2: Alimentos de hoje */}
        <div className="card-glass p-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Alimentos de hoje</h2>
          
          {/* Empty state card */}
          <div className="bg-muted/20 rounded-2xl border border-border/50 p-6 flex flex-col items-center">
            <Link
              to="/nutricao/adicionar-alimento"
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/50 text-primary hover:bg-primary/10 transition-colors mb-4"
            >
              <Plus size={18} />
              <span className="font-medium">Adicionar alimento</span>
            </Link>
            
            <p className="text-muted-foreground text-center text-sm">
              Nenhum alimento registrado hoje
            </p>
            <p className="text-muted-foreground text-center text-sm">
              Toque em "Adicionar alimento" para começar
            </p>
          </div>
        </div>

        {/* Spacer to push CTA up from bottom nav */}
        <div className="h-16" />
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-20">
        <div className="max-w-md mx-auto">
          <Link
            to="/nutricao/criar-dieta"
            className="w-full card-glass flex items-center justify-center gap-2 py-4 rounded-2xl border border-border/50 hover:border-primary/50 transition-colors"
          >
            <Plus size={20} className="text-primary" />
            <span className="text-foreground font-medium">Criar minha dieta</span>
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Nutricao;
