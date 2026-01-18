import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  X, 
  Copy, 
  Share2, 
  Link2, 
  Check, 
  Loader2,
  ChevronLeft,
  ChevronRight,
  Instagram,
  Twitter,
  Upload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { getEloFrameStyles, EloTier } from "@/lib/arena/eloUtils";
import { getArenaProfile } from "@/lib/arena/arenaStorage";
import { WorkoutSnapshot } from "@/lib/arena/types";
import { useCreatePost } from "@/hooks/useArenaFirestore";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  onPostToArena?: () => void;
  weeklyStats?: {
    completed: number;
    total: number;
    weekDays: boolean[];
  };
}

// Share card templates
type CardTemplate = 'stats-grid' | 'stats-centered' | 'exercises' | 'weekly' | 'volume-fun';

interface ShareCardProps {
  template: CardTemplate;
  workoutSnapshot: WorkoutSnapshot;
  summary: {
    duration: number;
    totalSets: number;
    totalVolume: number;
  };
  username?: string;
  weeklyStats?: {
    completed: number;
    total: number;
    weekDays: boolean[];
  };
}

const ShareCard = ({ template, workoutSnapshot, summary, username, weeklyStats }: ShareCardProps) => {
  const workoutTitle = workoutSnapshot.workoutTitle || "Treino";
  const exercises = workoutSnapshot.exercises || [];
  
  // Get volume comparison (fun facts)
  const getVolumeFunFact = (volume: number) => {
    if (volume >= 10000) return { text: "um elefante bebê!", emoji: "🐘" };
    if (volume >= 5000) return { text: "um hipopótamo!", emoji: "🦛" };
    if (volume >= 2000) return { text: "um grande tubarão branco!", emoji: "🦈" };
    if (volume >= 1000) return { text: "um urso polar!", emoji: "🐻‍❄️" };
    if (volume >= 500) return { text: "um gorila!", emoji: "🦍" };
    if (volume >= 200) return { text: "um leão!", emoji: "🦁" };
    return { text: "um cachorro grande!", emoji: "🐕" };
  };

  const funFact = getVolumeFunFact(summary.totalVolume);
  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const baseCardStyle = "relative w-full aspect-square rounded-2xl p-6 flex flex-col bg-[#0d1526]";

  switch (template) {
    case 'stats-grid':
      return (
        <div className={baseCardStyle}>
          <h3 className="text-xl font-bold text-white mb-4">{workoutTitle}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-2xl font-bold text-white">{summary.duration}min</p>
              <p className="text-sm text-muted-foreground">Duração</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{summary.totalVolume.toLocaleString()} kg</p>
              <p className="text-sm text-muted-foreground">Volume</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{exercises.length}</p>
              <p className="text-sm text-muted-foreground">Exercício{exercises.length !== 1 ? 's' : ''}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{summary.totalSets}</p>
              <p className="text-sm text-muted-foreground">Séries</p>
            </div>
          </div>
          
          <div className="flex-1" />
          
          <div className="flex justify-between items-center mt-auto">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white">💪 LevelUp</span>
            </div>
            {username && (
              <span className="text-muted-foreground">@{username}</span>
            )}
          </div>
        </div>
      );

    case 'stats-centered':
      return (
        <div className={cn(baseCardStyle, "items-center justify-center text-center")}>
          <div className="space-y-6">
            <div>
              <p className="text-4xl font-bold text-white">{summary.duration}min</p>
              <p className="text-muted-foreground">Duração</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-primary">{summary.totalVolume.toLocaleString()} kg</p>
              <p className="text-muted-foreground">Volume</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white">{summary.totalSets}</p>
              <p className="text-muted-foreground">Séries</p>
            </div>
          </div>
          
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
            <span className="text-lg font-bold text-white">💪 LevelUp</span>
            {username && <span className="text-muted-foreground">@{username}</span>}
          </div>
        </div>
      );

    case 'exercises':
      return (
        <div className={baseCardStyle}>
          <h3 className="text-xl font-bold text-white mb-2">{workoutTitle}</h3>
          
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <p className="text-lg font-bold text-white">{summary.duration}min</p>
              <p className="text-xs text-muted-foreground">Duração</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{summary.totalVolume.toLocaleString()} kg</p>
              <p className="text-xs text-muted-foreground">Volume</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{summary.totalSets}</p>
              <p className="text-xs text-muted-foreground">Séries</p>
            </div>
          </div>
          
          <div className="space-y-2 flex-1 overflow-hidden">
            {exercises.slice(0, 5).map((ex, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-primary font-bold text-sm">{ex.sets?.length || 0}x</span>
                <span className="text-white text-sm truncate">{ex.exerciseName}</span>
              </div>
            ))}
            {exercises.length > 5 && (
              <p className="text-muted-foreground text-xs">+{exercises.length - 5} exercícios</p>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-auto pt-4">
            <span className="text-lg font-bold text-white">💪 LevelUp</span>
            {username && <span className="text-muted-foreground">@{username}</span>}
          </div>
        </div>
      );

    case 'weekly':
      return (
        <div className={cn(baseCardStyle, "items-center")}>
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex gap-2 mb-4">
              {dayLabels.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{day}</span>
                  <div 
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      weeklyStats?.weekDays[idx] 
                        ? "bg-primary text-white" 
                        : "bg-card/50 text-muted-foreground"
                    )}
                  >
                    {weeklyStats?.weekDays[idx] && <Check className="w-4 h-4" />}
                  </div>
                </div>
              ))}
            </div>
            
            <p className="text-lg text-center">
              Treinou <span className="text-primary font-bold">{weeklyStats?.completed || 1} vez{(weeklyStats?.completed || 1) !== 1 ? 'es' : ''}</span> nos últimos 7 dias
            </p>
          </div>
          
          <div className="flex justify-between items-center w-full mt-auto">
            <span className="text-lg font-bold text-white">💪 LevelUp</span>
            {username && <span className="text-muted-foreground">@{username}</span>}
          </div>
        </div>
      );

    case 'volume-fun':
      return (
        <div className={cn(baseCardStyle, "items-center justify-center text-center")}>
          <p className="text-muted-foreground mb-2">Levantou um total de</p>
          <p className="text-5xl font-bold text-primary mb-4">{summary.totalVolume.toLocaleString()} kg</p>
          <p className="text-muted-foreground mb-4">É igual a levantar {funFact.text}</p>
          <span className="text-6xl mb-4">{funFact.emoji}</span>
          
          <div className="absolute bottom-6 left-6 right-6 flex justify-between items-center">
            <span className="text-lg font-bold text-white">💪 LevelUp</span>
            {username && <span className="text-muted-foreground">@{username}</span>}
          </div>
        </div>
      );

    default:
      return null;
  }
};

const WorkoutCompleteShareModal = ({
  open,
  onOpenChange,
  workoutSnapshot,
  summary,
  onPostToArena,
  weeklyStats,
}: WorkoutCompleteShareModalProps) => {
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [copied, setCopied] = useState(false);
  const [description, setDescription] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showDescriptionInput, setShowDescriptionInput] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { createPost } = useCreatePost();
  const arenaProfile = getArenaProfile();
  const username = arenaProfile?.displayName?.replace(/\s+/g, '_').toLowerCase();

  const templates: CardTemplate[] = ['stats-grid', 'stats-centered', 'exercises', 'weekly', 'volume-fun'];

  const handleCopyText = () => {
    const workoutTitle = workoutSnapshot.workoutTitle || "Treino";
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const workoutTitle = workoutSnapshot.workoutTitle || "Treino";
        await navigator.share({
          title: `${workoutTitle} - LevelUp Gym`,
          text: `🏋️ Acabei de treinar!\n\n⏱️ ${summary.duration} min\n💪 ${summary.totalSets} séries\n📊 ${summary.totalVolume.toLocaleString()} kg`,
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      handleCopyText();
    }
  };

  const handlePostToArena = async () => {
    setIsPosting(true);
    try {
      await createPost(
        workoutSnapshot,
        description.trim() || undefined,
        'public',
        false,
        undefined
      );
      toast.success("Treino postado na Arena! 🎉");
      onPostToArena?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error posting to arena:", error);
      toast.error("Erro ao postar na Arena");
    } finally {
      setIsPosting(false);
    }
  };

  const nextTemplate = () => {
    setSelectedTemplate((prev) => (prev + 1) % templates.length);
  };

  const prevTemplate = () => {
    setSelectedTemplate((prev) => (prev - 1 + templates.length) % templates.length);
  };

  const workoutNumber = weeklyStats?.completed || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-background border-0">
        <div className="flex flex-col h-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-center p-4 relative">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold text-white">Bom trabalho!</h2>
                <span className="text-2xl">🎉</span>
              </div>
              <p className="text-muted-foreground">
                Esse é o seu treinamento {workoutNumber}
              </p>
            </div>
          </div>

          {/* Card Carousel */}
          <div className="relative px-4">
            <div 
              ref={cardRef}
              className="relative"
            >
              <ShareCard 
                template={templates[selectedTemplate]}
                workoutSnapshot={workoutSnapshot}
                summary={summary}
                username={username}
                weeklyStats={weeklyStats}
              />
              
              {/* Navigation Arrows */}
              <button 
                onClick={prevTemplate}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-white hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button 
                onClick={nextTemplate}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 flex items-center justify-center text-white hover:bg-background transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-4">
              {templates.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedTemplate(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    idx === selectedTemplate ? "bg-primary" : "bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Share Text */}
          <p className="text-center text-muted-foreground text-sm mt-4 px-4">
            Compartilhe o treinamento - Use a tag @levelupgym
          </p>

          {/* Share Options */}
          <div className="flex justify-center gap-4 px-4 py-4">
            <button 
              onClick={() => setShowDescriptionInput(!showDescriptionInput)}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                <Share2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">Arena</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center">
                <Instagram className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">Stories</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                <Upload className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">Mais</span>
            </button>
            
            <button 
              onClick={() => toast.info("Link copiado!")}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                <Link2 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">Link</span>
            </button>
            
            <button 
              onClick={handleCopyText}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                {copied ? (
                  <Check className="w-5 h-5 text-primary" />
                ) : (
                  <Copy className="w-5 h-5 text-white" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">Copiar</span>
            </button>
            
            <button 
              onClick={handleShare}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center">
                <Twitter className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-muted-foreground">Twitter</span>
            </button>
          </div>

          {/* Description Input (expandable) */}
          {showDescriptionInput && (
            <div className="px-4 pb-2 space-y-3">
              <Textarea
                placeholder="Como foi o treino? (opcional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={280}
                className="resize-none bg-card border-border"
                rows={2}
              />
              <Button
                className="w-full gap-2"
                onClick={handlePostToArena}
                disabled={isPosting}
              >
                {isPosting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Share2 className="w-4 h-4" />
                )}
                {isPosting ? "Postando..." : "Postar na Arena"}
              </Button>
            </div>
          )}

          {/* Done Button */}
          <div className="p-4 pt-2">
            <Button
              className="w-full py-6 text-lg font-semibold"
              onClick={() => {
                onOpenChange(false);
                navigate("/");
              }}
            >
              Feito
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorkoutCompleteShareModal;
