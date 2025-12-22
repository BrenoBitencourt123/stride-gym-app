import BottomNav from "@/components/BottomNav";

const Nutricao = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Background effect */}
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
      <BottomNav />
    </div>
  );
};

export default Nutricao;
