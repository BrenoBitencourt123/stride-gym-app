import { Shield, Copy, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Clan, ClanMember, ELO_TIER_NAMES } from "@/lib/arena/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ClanCardProps {
  clan: Clan;
  members: ClanMember[];
}

const ClanCard = ({ clan, members }: ClanCardProps) => {
  const navigate = useNavigate();
  
  const activeMembers = members.filter(m => m.status === 'active').length;
  const totalMembers = members.length;
  
  const clanEloLabel = clan.clanElo 
    ? `${ELO_TIER_NAMES[clan.clanElo.tier]} ${clan.clanElo.division}`
    : 'Sem rank';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(clan.inviteCode);
    toast.success("Código copiado!");
  };

  return (
    <div className="card-glass p-4 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">
              {clan.name} <span className="text-muted-foreground">[{clan.tag}]</span>
            </h3>
            <p className="text-sm text-muted-foreground">
              {clanEloLabel} • {activeMembers}/{totalMembers} ativos
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-secondary/50 rounded-lg py-2">
          <p className="text-xs text-muted-foreground">Pontos/Sem</p>
          <p className="font-bold text-foreground">{clan.weeklyPoints}</p>
        </div>
        <div className="bg-secondary/50 rounded-lg py-2">
          <p className="text-xs text-muted-foreground">Presença</p>
          <p className="font-bold text-foreground">{Math.round(clan.presenceRate)}%</p>
        </div>
        <div className="bg-secondary/50 rounded-lg py-2">
          <p className="text-xs text-muted-foreground">Membros</p>
          <p className="font-bold text-foreground">{totalMembers}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1"
          onClick={handleCopyCode}
        >
          <Copy className="w-4 h-4 mr-2" />
          {clan.inviteCode}
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate("/arena/clan")}
        >
          <Settings className="w-4 h-4 mr-2" />
          Gerenciar
        </Button>
      </div>
    </div>
  );
};

export default ClanCard;
