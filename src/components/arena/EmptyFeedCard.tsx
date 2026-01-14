import { Zap, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface EmptyFeedCardProps {
  type: "global" | "clan";
}

const EmptyFeedCard = ({ type }: EmptyFeedCardProps) => {
  const navigate = useNavigate();

  return (
    <Card className="bg-card/80 border-dashed border-2 border-border">
      <CardContent className="p-6 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        
        <h4 className="font-semibold text-foreground mb-2">
          {type === "global" 
            ? "Seja o primeiro a postar!" 
            : "Seu clã ainda não tem posts"
          }
        </h4>
        
        <p className="text-sm text-muted-foreground mb-4">
          {type === "global"
            ? "Complete um treino e compartilhe sua conquista com a comunidade."
            : "Motive seus colegas de clã compartilhando um treino."
          }
        </p>
        
        <Button 
          variant="default" 
          size="sm"
          onClick={() => navigate("/treino")}
          className="gap-2"
        >
          Ir para Treinos
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default EmptyFeedCard;
