import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const Nutricao = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.startsWith("/treino")) return "treino";
    if (location.pathname.startsWith("/nutricao")) return "nutricao";
    return "inicio";
  };

  const handleTabChange = (tab: "inicio" | "treino" | "nutricao") => {
    if (tab === "inicio") navigate("/");
    else if (tab === "treino") navigate("/treino");
    else if (tab === "nutricao") navigate("/nutricao");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Starfield background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold text-foreground mb-6">Nutrição</h1>
        
        <div className="card-glass p-6">
          <p className="text-muted-foreground text-center">
            Conteúdo de nutrição em breve...
          </p>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav activeTab={getActiveTab()} onTabChange={handleTabChange} />
    </div>
  );
};

export default Nutricao;
