import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Crown, Copy, Link, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useArenaClan } from "@/hooks/useArenaFirestore";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";

const CreateClan = () => {
  const navigate = useNavigate();
  const { createClan, loading: clanLoading } = useArenaClan();
  
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [description, setDescription] = useState("");
  const [created, setCreated] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !tag.trim()) {
      toast.error("Preencha nome e tag do clã");
      return;
    }

    if (tag.length > 5) {
      toast.error("Tag deve ter no máximo 5 caracteres");
      return;
    }

    setIsCreating(true);

    try {
      const clan = await createClan(name.trim(), tag.trim().toUpperCase(), description.trim() || undefined);
      setInviteCode(clan.inviteCode);
      setCreated(true);
      toast.success("Clã criado com sucesso!");
    } catch (error) {
      console.error("Error creating clan:", error);
      toast.error("Erro ao criar clã");
    } finally {
      setIsCreating(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Código copiado!");
  };

  const copyLink = () => {
    const link = `${window.location.origin}/arena/clan/invite/${inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  if (created) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/arena/clan")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Clã Criado!</h1>
          </div>

          <div className="flex flex-col items-center py-12">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mb-6">
              <Check className="w-10 h-10 text-primary" />
            </div>
            
            <h2 className="text-xl font-bold text-foreground mb-2">{name}</h2>
            <p className="text-muted-foreground mb-8">[{tag.toUpperCase()}]</p>

            <div className="w-full space-y-4">
              <div className="card-glass p-4">
                <Label className="text-sm text-muted-foreground">Código de convite</Label>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 bg-background rounded-lg px-4 py-3 font-mono text-lg text-center text-foreground">
                    {inviteCode}
                  </div>
                  <Button size="icon" variant="secondary" onClick={copyCode}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button variant="secondary" className="w-full" onClick={copyLink}>
                <Link className="w-4 h-4 mr-2" />
                Copiar Link de Convite
              </Button>

              <Button className="w-full" onClick={() => navigate("/arena/clan")}>
                <Crown className="w-4 h-4 mr-2" />
                Ir para o Clã
              </Button>
            </div>
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
          <h1 className="text-lg font-semibold text-foreground">Criar Clã</h1>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Clã</Label>
            <Input
              id="name"
              placeholder="Ex: Guerreiros do Ferro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tag">Tag (máx. 5 caracteres)</Label>
            <Input
              id="tag"
              placeholder="Ex: GDF"
              value={tag}
              onChange={(e) => setTag(e.target.value.toUpperCase())}
              maxLength={5}
              className="uppercase"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva seu clã..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="card-glass p-4">
            <h3 className="font-medium text-foreground mb-2">Como GM, você poderá:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Aprovar pedidos de freeze</li>
              <li>• Promover membros a oficiais</li>
              <li>• Remover membros do clã</li>
              <li>• Gerenciar convites</li>
            </ul>
          </div>

          <Button 
            className="w-full" 
            onClick={handleCreate}
            disabled={!name.trim() || !tag.trim() || isCreating || clanLoading}
          >
            {isCreating ? (
              "Criando..."
            ) : (
              <>
                <Crown className="w-4 h-4 mr-2" />
                Criar Clã
              </>
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CreateClan;
