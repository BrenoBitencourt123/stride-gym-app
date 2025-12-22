import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft, Plus, Info } from "lucide-react";
import BottomNav from "@/components/BottomNav";

interface FoodItem {
  name: string;
  quantity: string;
  kcal: number;
}

interface Meal {
  name: string;
  totalKcal: number;
  items: FoodItem[];
}

const meals: Meal[] = [
  {
    name: "Café da manhã",
    totalKcal: 520,
    items: [
      { name: "Ovos mexidos", quantity: "2 un", kcal: 180 },
      { name: "Pão integral", quantity: "2 fatias", kcal: 140 },
      { name: "Whey", quantity: "1 scoop", kcal: 200 },
    ],
  },
  {
    name: "Almoço",
    totalKcal: 650,
    items: [
      { name: "Arroz", quantity: "150 g", kcal: 190 },
      { name: "Frango grelhado", quantity: "180 g", kcal: 300 },
      { name: "Salada", quantity: "1 porção", kcal: 160 },
    ],
  },
  {
    name: "Lanche",
    totalKcal: 300,
    items: [
      { name: "Iogurte", quantity: "1 pote", kcal: 160 },
      { name: "Banana", quantity: "1 un", kcal: 140 },
    ],
  },
  {
    name: "Jantar",
    totalKcal: 580,
    items: [
      { name: "Carne magra", quantity: "180 g", kcal: 320 },
      { name: "Batata", quantity: "200 g", kcal: 260 },
    ],
  },
];

const CriarDieta = () => {
  const navigate = useNavigate();

  const handleSave = () => {
    navigate("/nutricao");
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <Link
            to="/nutricao"
            className="p-2 -ml-2 rounded-xl hover:bg-card/50 transition-colors"
          >
            <ChevronLeft size={24} className="text-foreground" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Criar minha dieta</h1>
            <p className="text-sm text-muted-foreground">Monte um padrão para seus dias</p>
          </div>
        </div>

        {/* Card: Meta diária */}
        <div className="card-glass p-4 mt-6 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">Meta diária</h2>
            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-lg">
              Meta segura
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">2.050</span>
              <span className="text-sm text-muted-foreground">kcal</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">160</span>
              <span className="text-sm text-muted-foreground">g proteína</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">200</span>
              <span className="text-sm text-muted-foreground">g carbo</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">65</span>
              <span className="text-sm text-muted-foreground">g gorduras</span>
            </div>
          </div>
        </div>

        {/* Seção: Refeições */}
        <h2 className="text-lg font-semibold text-foreground mb-3">Refeições</h2>

        <div className="space-y-3">
          {meals.map((meal) => (
            <div key={meal.name} className="card-glass p-4">
              {/* Meal header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{meal.name}</h3>
                <span className="text-sm text-muted-foreground">{meal.totalKcal} kcal</span>
              </div>

              {/* Food items */}
              <div className="space-y-2 mb-3">
                {meal.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground">{item.name}</span>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-muted-foreground">{item.quantity}</span>
                    </div>
                    <span className="text-muted-foreground">{item.kcal} kcal</span>
                  </div>
                ))}
              </div>

              {/* Add food button */}
              <button className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors">
                <Plus size={16} />
                <span>Adicionar alimento</span>
              </button>
            </div>
          ))}
        </div>

        {/* Card: Como funciona */}
        <div className="card-glass p-4 mt-4 flex items-start gap-3">
          <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">
            Você pode seguir esta dieta como base e registrar extras no dia.
          </p>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className="w-full bg-primary text-primary-foreground font-semibold py-4 rounded-2xl hover:bg-primary/90 transition-colors mt-6"
        >
          Salvar minha dieta
        </button>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default CriarDieta;
