import { useState } from "react";
import { Check, X, Moon, Snowflake, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClanMember, sendMotivation } from "@/lib/arena/arenaStorage";
import { getMemberDayStatus, DayStatus } from "@/lib/arena/scheduleUtils";
import UserAvatar from "./UserAvatar";

interface PresenceListProps {
  members: ClanMember[];
  onMotivate?: (memberId: string) => void;
}

const MOTIVATION_MESSAGES = [
  "💪 Bora treinar! O clã conta com você!",
  "🔥 Falta pouco! Vamos lá, campeão!",
  "⚡ Hora de treinar! Não quebre o streak!",
];

const statusConfig: Record<DayStatus, { icon: React.ReactNode; label: string; color: string }> = {
  trained: { 
    icon: <Check className="w-4 h-4" />, 
    label: "Treinou", 
    color: "text-green-500 bg-green-500/10" 
  },
  pending: { 
    icon: <X className="w-4 h-4" />, 
    label: "Não treinou ainda", 
    color: "text-red-500 bg-red-500/10" 
  },
  rest: { 
    icon: <Moon className="w-4 h-4" />, 
    label: "Descanso", 
    color: "text-muted-foreground bg-secondary" 
  },
  frozen: { 
    icon: <Snowflake className="w-4 h-4" />, 
    label: "Congelado", 
    color: "text-blue-400 bg-blue-400/10" 
  },
};

const PresenceList = ({ members, onMotivate }: PresenceListProps) => {
  const [motivateModalOpen, setMotivateModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ClanMember | null>(null);

  const handleMotivateClick = (member: ClanMember) => {
    setSelectedMember(member);
    setMotivateModalOpen(true);
  };

  const handleSendMotivation = (message: string, index: number) => {
    if (selectedMember) {
      sendMotivation(selectedMember.userId, selectedMember.displayName, index);
      onMotivate?.(selectedMember.userId);
    }
    setMotivateModalOpen(false);
    setSelectedMember(null);
  };

  return (
    <>
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground flex items-center gap-2 mb-3">
          📋 Presença de Hoje
        </h3>
        
        {members.map((member) => {
          const dayStatus = getMemberDayStatus(member);
          const config = statusConfig[dayStatus];
          
          return (
            <div
              key={member.userId}
              className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <UserAvatar
                  photoURL={member.photoURL}
                  avatarId={member.avatarId}
                  displayName={member.displayName}
                  eloTier={member.elo?.tier || 'iron'}
                  size="sm"
                />
                <div>
                  <p className="font-medium text-foreground">{member.displayName}</p>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.color}`}>
                    {config.icon}
                    <span>{config.label}</span>
                  </div>
                </div>
              </div>

              {dayStatus === "pending" && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-primary"
                  onClick={() => handleMotivateClick(member)}
                >
                  <Send className="w-4 h-4 mr-1" />
                  Motivar
                </Button>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            Nenhum membro no clã ainda
          </p>
        )}
      </div>

      {/* Motivation Modal */}
      <Dialog open={motivateModalOpen} onOpenChange={setMotivateModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Motivar {selectedMember?.displayName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {MOTIVATION_MESSAGES.map((msg, idx) => (
              <Button
                key={idx}
                variant="secondary"
                className="w-full justify-start text-left h-auto py-3"
                onClick={() => handleSendMotivation(msg, idx)}
              >
                {msg}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PresenceList;
