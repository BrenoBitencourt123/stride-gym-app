import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Copy, Link, Users, Shield, Crown, Settings, UserMinus, ChevronUp, ChevronDown, Snowflake, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  getMyClan, 
  getClanMembers, 
  getArenaProfile,
  getPendingFreezeRequests,
  reviewFreezeRequest,
  leaveClan
} from "@/lib/arena/arenaStorage";
import { calculateMedianElo, getEloDisplayName } from "@/lib/arena/eloUtils";
import PresenceList from "@/components/arena/PresenceList";
import FreezeRequestModal from "@/components/arena/FreezeRequestModal";
import BottomNav from "@/components/BottomNav";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ClanHub = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("presence");
  const [refreshKey, setRefreshKey] = useState(0);
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  
  const clan = getMyClan();
  const members = getClanMembers();
  const profile = getArenaProfile();
  const freezeRequests = getPendingFreezeRequests();

  // If no clan, show CTA
  if (!clan) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-4">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/arena")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold text-foreground">Meu Clã</h1>
          </div>

          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Você ainda não está em um clã
            </h2>
            <p className="text-muted-foreground text-center mb-8 max-w-xs">
              Junte-se a outros atletas para competir juntos e se motivar diariamente!
            </p>

            <div className="w-full space-y-3">
              <Button 
                className="w-full" 
                onClick={() => navigate("/arena/clan/create")}
              >
                <Crown className="w-4 h-4 mr-2" />
                Criar Clã
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => navigate("/arena/clan/join")}
              >
                <Link className="w-4 h-4 mr-2" />
                Entrar com Código
              </Button>
            </div>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const activeMembers = members.filter(m => m.status === 'active');
  const clanElo = activeMembers.length >= 3 
    ? calculateMedianElo(activeMembers)
    : null;

  const isLeader = profile && (
    members.find(m => m.userId === profile.userId)?.role === 'gm' ||
    members.find(m => m.userId === profile.userId)?.role === 'officer'
  );

  const copyCode = () => {
    navigator.clipboard.writeText(clan.inviteCode);
    toast.success("Código copiado!");
  };

  const copyLink = () => {
    const link = `${window.location.origin}/arena/clan/invite/${clan.inviteCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  const handleFreezeReview = (requestId: string, approved: boolean) => {
    if (profile) {
      reviewFreezeRequest(requestId, approved, profile.userId);
      setRefreshKey(k => k + 1);
      toast.success(approved ? "Freeze aprovado" : "Freeze negado");
    }
  };

  const handleLeaveClan = () => {
    leaveClan();
    navigate("/arena");
    toast.success("Você saiu do clã");
  };

  return (
    <div className="min-h-screen bg-background pb-28" key={refreshKey}>
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/arena")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Meu Clã</h1>
        </div>

        {/* Clan Card */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">{clan.name}</h2>
                <span className="text-sm text-muted-foreground">[{clan.tag}]</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {clanElo ? (
                  <span className="text-sm text-primary font-medium">
                    {getEloDisplayName(clanElo.tier, clanElo.division)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Sem rank</span>
                )}
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">
                  {activeMembers.length}/{members.length} ativos
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
          </div>

          {/* Invite Buttons */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1" onClick={copyCode}>
              <Copy className="w-4 h-4 mr-2" />
              Código: {clan.inviteCode}
            </Button>
            <Button variant="secondary" size="sm" onClick={copyLink}>
              <Link className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="presence">Presença</TabsTrigger>
            <TabsTrigger value="management" disabled={!isLeader}>
              <Settings className="w-4 h-4 mr-1" />
              Gestão
            </TabsTrigger>
          </TabsList>

          <TabsContent value="presence">
            <PresenceList members={members} />
            
            {/* Request Freeze Button */}
            <div className="mt-6">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setFreezeModalOpen(true)}
              >
                <Snowflake className="w-4 h-4 mr-2" />
                Pedir Freeze
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Solicite uma pausa para não receber penalidades
              </p>
            </div>
          </TabsContent>

          <TabsContent value="management">
            {isLeader && (
              <div className="space-y-6">
                {/* Freeze Requests */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Pedidos de Freeze ({freezeRequests.length})
                  </h3>
                  
                  {freezeRequests.length > 0 ? (
                    <div className="space-y-2">
                      {freezeRequests.map(req => (
                        <div key={req.id} className="card-glass p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground">{req.displayName}</span>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="secondary"
                                onClick={() => handleFreezeReview(req.id, false)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                              <Button 
                                size="sm"
                                onClick={() => handleFreezeReview(req.id, true)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{req.reason}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(req.freezeFrom).toLocaleDateString('pt-BR')} - {new Date(req.freezeUntil).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="card-glass p-4 text-center">
                      <Snowflake className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Nenhum pedido de freeze pendente
                      </p>
                    </div>
                  )}
                </div>

                {/* Members Management */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                    Membros
                  </h3>
                  
                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.userId} className="card-glass p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                            {member.photoURL ? (
                              <img src={member.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-muted-foreground">
                                {member.displayName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{member.displayName}</span>
                              {member.role === 'gm' && <Crown className="w-4 h-4 text-yellow-500" />}
                              {member.role === 'officer' && <Shield className="w-4 h-4 text-primary" />}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {getEloDisplayName(member.elo.tier, member.elo.division)}
                            </span>
                          </div>
                        </div>

                        {member.role !== 'gm' && profile?.userId !== member.userId && (
                          <div className="flex gap-1">
                            {member.role === 'member' ? (
                              <Button size="sm" variant="ghost" title="Promover">
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" title="Rebaixar">
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-destructive" title="Remover">
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Leave Clan */}
        <div className="mt-8">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full text-destructive">
                Sair do Clã
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sair do clã?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você perderá seu progresso e posição no clã. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLeaveClan}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <FreezeRequestModal 
        open={freezeModalOpen} 
        onOpenChange={(open) => {
          setFreezeModalOpen(open);
          if (!open) setRefreshKey(k => k + 1);
        }} 
      />
      <BottomNav />
    </div>
  );
};

export default ClanHub;
