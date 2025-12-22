import { Home, Dumbbell, Apple } from "lucide-react";
import { NavLink } from "react-router-dom";

const tabs = [
  { label: "Início", icon: Home, path: "/" },
  { label: "Treino", icon: Dumbbell, path: "/treino" },
  { label: "Nutrição", icon: Apple, path: "/nutricao" },
];

const BottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="max-w-md mx-auto flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === "/"}
              className={({ isActive }) =>
                `nav-item min-w-[80px] ${isActive ? 'nav-item-active' : 'nav-item-inactive'}`
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
