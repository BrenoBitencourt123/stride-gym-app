import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Share2, Copy, Image, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getEloFrameStyles, EloTier } from "@/lib/arena/eloUtils";
import { getArenaProfile, WorkoutSnapshot } from "@/lib/arena/arenaStorage";
import { toast } from "sonner";

interface WorkoutCompleteShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutSnapshot: WorkoutSnapshot;
  summary: {
    duration: number;
    totalSets: number;
    totalVolume: number;
    xpGained: number;
  };
  onPostToArena: () => void;
}

const SHARE_TEMPLATES = [
  { id: 1, name: "Minimal", bg: "bg-gradient-to-br from-primary/20 to-secondary" },
  { id: 2, name: "Dark", bg: "bg-gradient-to-br from-gray-900 to-gray-800" },
  { id: 3, name: "Fire", bg: "bg-gradient-to-br from-orange-500/20 to-red-500/20" },
  { id: 4, name: "Ocean", bg: "bg-gradient-to-br from-blue-500/20 to-cyan-500/20" },
  { id: 5, name: "Forest", bg: "bg-gradient-to-br from-green-500/20 to-emerald-500/20" },
];

const WorkoutCompleteShareModal = ({
  open,
  onOpenChange,
  workoutSnapshot,
  summary,
  onPostToArena,
}: WorkoutCompleteShareModalProps) => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const arenaProfile = getArenaProfile();
  const eloTier = (arenaProfile?.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);

  const workoutTitle = workoutSnapshot.workoutTitle || "Treino";

  const handleCopyText = () => {
    const text = `🏋️ ${workoutTitle}

⏱️ ${summary.duration} min
💪 ${summary.totalSets} séries
📊 ${summary.totalVolume.toLocaleString()} kg

#LevelUpGym #Treino`;
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Texto copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveImage = async () => {
    // For MVP, just show a toast. Real implementation would use html2canvas
    toast.info("Funcionalidade de salvar imagem em breve!");
  };

  const handlePostToArena = () => {
    onPostToArena();
    onOpenChange(false);
  };

  const currentTemplate = SHARE_TEMPLATES[selectedTemplate];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Bom trabalho! 💪
          </DialogTitle>
        </DialogHeader>

        {/* Preview Card */}
        <div 
          ref={cardRef}
          className={`relative rounded-xl p-6 ${currentTemplate.bg}`}
          style={{
            borderWidth: "2px",
            borderColor: eloStyles.borderColor,
          }}
        >
          {/* Elo Badge */}
          <div 
            className="absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-bold text-white"
            style={{ background: eloStyles.gradient }}
          >
            {eloTier.toUpperCase()}
          </div>

          {/* Content */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-foreground mb-4">
              {workoutTitle}
            </h3>

            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{summary.duration}</p>
                <p className="text-xs text-muted-foreground">min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{summary.totalSets}</p>
                <p className="text-xs text-muted-foreground">séries</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{summary.totalVolume.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">kg</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              +{summary.xpGained} XP
            </p>
          </div>
        </div>

        {/* Template Selector */}
        <div className="flex gap-2 overflow-x-auto py-2">
          {SHARE_TEMPLATES.map((template, idx) => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(idx)}
              className={`w-12 h-12 rounded-lg shrink-0 ${template.bg} border-2 transition-all ${
                selectedTemplate === idx 
                  ? "border-primary scale-110" 
                  : "border-transparent"
              }`}
            />
          ))}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full gap-2"
            onClick={handlePostToArena}
          >
            <Share2 className="w-4 h-4" />
            Postar na Arena
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleSaveImage}
            >
              <Image className="w-4 h-4 mr-2" />
              Salvar Imagem
            </Button>

            <Button
              variant="secondary"
              onClick={handleCopyText}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copiado!" : "Copiar Texto"}
            </Button>
          </div>

          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              navigate("/");
            }}
          >
            Continuar sem compartilhar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutCompleteShareModal;
