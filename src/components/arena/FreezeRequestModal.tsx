import { useState } from "react";
import { Snowflake, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { requestFreeze } from "@/lib/arena/arenaStorage";
import { toast } from "sonner";

interface FreezeRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FreezeRequestModal = ({ open, onOpenChange }: FreezeRequestModalProps) => {
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim() || !fromDate || !untilDate) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (new Date(fromDate) > new Date(untilDate)) {
      toast.error("Data inicial deve ser antes da final");
      return;
    }

    setSubmitting(true);

    try {
      requestFreeze(reason.trim(), fromDate, untilDate);
      toast.success("Pedido de freeze enviado para aprovação");
      onOpenChange(false);
      setReason("");
      setFromDate("");
      setUntilDate("");
    } catch (error) {
      toast.error("Erro ao enviar pedido");
    }

    setSubmitting(false);
  };

  // Get min date (today)
  const today = new Date().toISOString().split('T')[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="w-5 h-5 text-cyan-400" />
            Solicitar Freeze
          </DialogTitle>
          <DialogDescription>
            Seu pedido será enviado para aprovação do GM ou Oficiais do clã.
            Durante o freeze, você não receberá penalidades por treinos não realizados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Viagem de trabalho, recuperação de lesão..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={200}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from">De</Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                min={today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="until">Até</Label>
              <Input
                id="until"
                type="date"
                value={untilDate}
                onChange={(e) => setUntilDate(e.target.value)}
                min={fromDate || today}
              />
            </div>
          </div>

          <div className="card-glass p-3 bg-cyan-500/10">
            <p className="text-sm text-cyan-400">
              ⚠️ Enquanto congelado, você não contribuirá para o elo do clã e não aparecerá na presença diária.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar Pedido"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FreezeRequestModal;
