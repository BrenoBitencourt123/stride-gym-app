import { NavLink } from "react-router-dom";
import { Home, Dumbbell, Apple } from "lucide-react";

const tabs = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/treino", label: "Treino", icon: Dumbbell },
  { to: "/nutricao", label: "Nutrição", icon: Apple },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `nav-item min-w-[80px] ${isActive ? "nav-item-active" : "nav-item-inactive"}`
              }
            >
              <Icon className="w-6 h-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
