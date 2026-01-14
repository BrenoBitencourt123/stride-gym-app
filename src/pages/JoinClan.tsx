import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Link, Users, Check, Crown, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { joinClanByCode, getMyClan, getArenaProfile, initializeArenaProfile } from "@/lib/arena/arenaStorage";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const JoinClan = () => {
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const [inviteCode, setInviteCode] = useState(code || "");
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [previewClan, setPreviewClan] = useState<{ name: string; tag: string; members: number } | null>(null);

  // Check if already in a clan
  const existingClan = getMyClan();

  useEffect(() => {
    if (code) {
      setInviteCode(code.toUpperCase());
      // Simulate clan preview
      if (code.length >= 4) {
        setPreviewClan({
          name: "Clã Demo",
          tag: "DEMO",
          members: 5
        });
      }
    }
  }, [code]);

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase();
    setInviteCode(upper);
    
    // Simulate preview when code is long enough
    if (upper.length >= 4) {
      setPreviewClan({
        name: "Clã " + upper,
        tag: upper.substring(0, 4),
        members: Math.floor(Math.random() * 15) + 2
      });
    } else {
      setPreviewClan(null);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      toast.error("Digite o código de convite");
      return;
    }

    // Ensure profile exists
    let profile = getArenaProfile();
    if (!profile) {
      profile = initializeArenaProfile(
        `user_${Date.now()}`,
        "Atleta"
      );
    }

    setJoining(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = joinClanByCode(inviteCode.trim());
    
    if (success) {
      setJoined(true);
      toast.success("Você entrou no clã!");
    } else {
      toast.error("Código inválido ou clã cheio");
    }
    
    setJoining(false);
  };

  if (existingClan && !joined) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Entrar em Clã</h1>
          </div>

          <div className="flex flex-col items-center py-12">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Shield className="w-10 h-10 text-muted-foreground" />
            </div>
            
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Você já está em um clã
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Saia do clã atual para entrar em outro
            </p>

            <Button onClick={() => navigate("/arena/clan")}>
              Ir para Meu Clã
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/arena/clan")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Bem-vindo!</h1>
          </div>

          <div className="flex flex-col items-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-2">
              Você entrou no clã!
            </h2>
            <p className="text-muted-foreground text-center mb-8">
              Agora você faz parte do time. Bons treinos!
            </p>

            <Button className="w-full" onClick={() => navigate("/arena/clan")}>
              <Users className="w-4 h-4 mr-2" />
              Ver Meu Clã
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Entrar em Clã</h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="code">Código de Convite</Label>
            <Input
              id="code"
              placeholder="Ex: ABC123"
              value={inviteCode}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="uppercase font-mono text-lg text-center"
              maxLength={8}
            />
          </div>

          {/* Clan Preview */}
          {previewClan && (
            <div className="card-glass p-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <Crown className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{previewClan.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    [{previewClan.tag}] • {previewClan.members} membros
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button 
            className="w-full" 
            onClick={handleJoin}
            disabled={!inviteCode.trim() || joining}
          >
            {joining ? (
              "Entrando..."
            ) : (
              <>
                <Link className="w-4 h-4 mr-2" />
                Entrar no Clã
              </>
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Não tem um código?
            </p>
            <Button 
              variant="link" 
              className="text-primary"
              onClick={() => navigate("/arena/clan/create")}
            >
              Criar seu próprio clã
            </Button>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default JoinClan;
