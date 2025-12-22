import { Home, Dumbbell, Apple } from "lucide-react";

type TabType = "inicio" | "treino" | "nutricao";

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: "inicio" as TabType, label: "Início", icon: Home },
  { id: "treino" as TabType, label: "Treino", icon: Dumbbell },
  { id: "nutricao" as TabType, label: "Nutrição", icon: Apple },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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
