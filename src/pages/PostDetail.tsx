import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Share2, Clock, Dumbbell, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPostById, toggleKudos, hasGivenKudos } from "@/lib/arena/arenaStorage";
import { getEloStyles, getEloDisplayName } from "@/lib/arena/eloUtils";
import EloFrame from "@/components/arena/EloFrame";
import BottomNav from "@/components/BottomNav";
import { useState, useEffect } from "react";

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState(id ? getPostById(id) : undefined);
  const [hasKudos, setHasKudos] = useState(id ? hasGivenKudos(id) : false);

  useEffect(() => {
    if (id) {
      setPost(getPostById(id));
      setHasKudos(hasGivenKudos(id));
    }
  }, [id]);

  if (!post || !post.workoutSnapshot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Post não encontrado</p>
          <Button variant="secondary" onClick={() => navigate("/arena")}>
            Voltar para Arena
          </Button>
        </div>
      </div>
    );
  }

  const { workoutSnapshot, author } = post;
  const eloStyles = getEloStyles(author.elo.tier);

  const handleKudos = () => {
    if (id) {
      toggleKudos(id);
      setHasKudos(!hasKudos);
      setPost(getPostById(id));
    }
  };

  const handleShare = async () => {
    const shareText = `${author.displayName} completou ${workoutSnapshot.workoutTitle}! 💪\n${workoutSnapshot.totalSets} séries • ${workoutSnapshot.totalVolume.toLocaleString()}kg de volume`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        navigator.clipboard.writeText(shareText);
      }
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Detalhe do Treino</h1>
        </div>

        {/* Author Card */}
        <EloFrame tier={author.elo.tier} className="mb-6">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {author.photoURL ? (
                  <img src={author.photoURL} alt={author.displayName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-muted-foreground">
                    {author.displayName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">@{author.displayName}</span>
                  <span 
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ 
                      background: eloStyles.gradient,
                      color: '#fff'
                    }}
                  >
                    {getEloDisplayName(author.elo)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            {post.description && (
              <p className="mt-3 text-foreground">{post.description}</p>
            )}
          </div>
        </EloFrame>

        {/* Workout Summary Card */}
        <div className="card-glass p-4 mb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{workoutSnapshot.workoutTitle}</h2>
          
          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-card/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Duração</p>
                <p className="text-lg font-semibold text-foreground">{Math.round(workoutSnapshot.duration / 60)}min</p>
              </div>
            </div>

            <div className="bg-card/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Séries</p>
                <p className="text-lg font-semibold text-foreground">{workoutSnapshot.totalSets}</p>
              </div>
            </div>

            <div className="bg-card/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-lg font-semibold text-foreground">{workoutSnapshot.totalVolume.toLocaleString()}kg</p>
              </div>
            </div>

            {workoutSnapshot.prsCount > 0 && (
              <div className="bg-card/50 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PRs</p>
                  <p className="text-lg font-semibold text-foreground">{workoutSnapshot.prsCount}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Exercise List */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Exercícios
          </h3>

          {workoutSnapshot.exercises.map((exercise, idx) => (
            <div key={idx} className="card-glass p-4">
              <h4 className="font-semibold text-foreground mb-3">{exercise.exerciseName}</h4>
              
              <div className="space-y-2">
                {/* Header */}
                <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
                  <span>Série</span>
                  <span className="text-center">Peso</span>
                  <span className="text-center">Reps</span>
                  <span className="text-center">RIR</span>
                </div>
                
                {/* Sets */}
                {exercise.sets.map((set, setIdx) => (
                  <div key={setIdx} className="grid grid-cols-4 gap-2 text-sm">
                    <span className="text-muted-foreground">{setIdx + 1}</span>
                    <span className="text-center text-foreground font-medium">{set.kg}kg</span>
                    <span className="text-center text-foreground font-medium">{set.reps}</span>
                    <span className="text-center text-muted-foreground">
                      {set.rir !== undefined ? set.rir : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant={hasKudos ? "default" : "secondary"}
            className="flex-1"
            onClick={handleKudos}
          >
            <Heart className={`w-4 h-4 mr-2 ${hasKudos ? "fill-current" : ""}`} />
            {post.kudosCount} Kudos
          </Button>
          
          <Button variant="secondary" className="flex-1" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PostDetail;
