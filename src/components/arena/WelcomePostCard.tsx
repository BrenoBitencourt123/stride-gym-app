import { Sparkles, Dumbbell, Users, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const WelcomePostCard = () => {
  return (
    <Card className="bg-gradient-to-br from-primary/20 via-card to-primary/10 border-primary/30 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl" />
      
      <CardContent className="p-5 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-foreground">LevelUp Team</p>
            <p className="text-xs text-muted-foreground">Equipe oficial</p>
          </div>
        </div>

        {/* Welcome message */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-foreground">
            🎉 Bem-vindo à Arena!
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            A Arena é o coração social do LevelUp Gym. Aqui você pode compartilhar seus treinos, 
            motivar amigos e competir em clãs!
          </p>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 gap-2 mt-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-4 h-4 text-primary" />
              </div>
              <span>Compartilhe seus treinos e conquistas</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-primary" />
              </div>
              <span>Crie ou entre em um clã com amigos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="w-4 h-4 text-primary" />
              </div>
              <span>Suba de Elo e apareça no ranking</span>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-center text-primary font-medium">
            Complete seu primeiro treino para publicar na Arena! 💪
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WelcomePostCard;
