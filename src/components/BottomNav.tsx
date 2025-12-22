import { Home, Dumbbell, Apple } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

type TabType = "inicio" | "treino" | "nutricao";

const tabs = [
  { id: "inicio" as TabType, label: "Início", icon: Home, path: "/" },
  { id: "treino" as TabType, label: "Treino", icon: Dumbbell, path: "/treino" },
  { id: "nutricao" as TabType, label: "Nutrição", icon: Apple, path: "/nutricao" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): TabType => {
    if (location.pathname.startsWith("/treino")) return "treino";
    if (location.pathname.startsWith("/nutricao")) return "nutricao";
    return "inicio";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`nav-item min-w-[80px] ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
