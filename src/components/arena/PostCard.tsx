import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Share2, Clock, Dumbbell, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { ArenaPost, toggleKudos, getPostKudos, hasUserKudos } from "@/lib/arena/arenaStorage";
import { getEloFrameStyles, EloTier } from "@/lib/arena/eloUtils";
import EloFrame from "./EloFrame";
import { useState, useEffect } from "react";

interface PostCardProps {
  post: ArenaPost;
  onKudosChange?: () => void;
}

const PostCard = ({ post, onKudosChange }: PostCardProps) => {
  const navigate = useNavigate();
  const [kudosCount, setKudosCount] = useState(post.kudosCount || 0);
  const [hasKudos, setHasKudos] = useState(false);
  
  const eloTier = (post.author.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);

  useEffect(() => {
    setKudosCount(getPostKudos(post.id).length);
    setHasKudos(hasUserKudos(post.id));
  }, [post.id]);

  const handleKudos = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleKudos(post.id);
    setKudosCount(getPostKudos(post.id).length);
    setHasKudos(hasUserKudos(post.id));
    onKudosChange?.();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + "/arena/post/" + post.id);
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/arena/post/${post.id}?comment=true`);
  };

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: ptBR,
  });

  const workoutTitle = post.workoutSnapshot?.workoutTitle || "Treino";
  const duration = post.workoutSnapshot?.duration ? Math.round(post.workoutSnapshot.duration / 60) : 0;
  const totalSets = post.workoutSnapshot?.totalSets || 0;
  const totalVolume = post.workoutSnapshot?.totalVolume || 0;

  return (
    <EloFrame tier={eloTier} className="mb-4">
      <div 
        className="p-4 cursor-pointer"
        onClick={() => navigate(`/arena/post/${post.id}`)}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
            style={{ background: eloStyles.gradient }}
          >
            {post.author.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{post.author.displayName}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          <div 
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{ 
              background: eloStyles.gradient,
              color: "white",
            }}
          >
            {eloTier.charAt(0).toUpperCase() + eloTier.slice(1)}
          </div>
        </div>

        {/* Description */}
        {post.description && (
          <p className="text-foreground mb-3">{post.description}</p>
        )}

        {/* Workout Summary Card */}
        {post.type === "workout" && post.workoutSnapshot && (
          <div className="bg-secondary/50 rounded-lg p-3 mb-3">
            <h4 className="font-semibold text-foreground mb-2">
              {workoutTitle}
            </h4>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{duration}min</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Dumbbell className="w-4 h-4" />
                <span>{totalSets} séries</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{totalVolume.toLocaleString()}kg</span>
              </div>
            </div>
          </div>
        )}

        {/* Photo placeholder */}
        {post.photoURL && (
          <div className="relative rounded-lg overflow-hidden mb-3 bg-secondary aspect-video">
            <img 
              src={post.photoURL} 
              alt="Workout" 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-1.5 ${hasKudos ? "text-red-500" : "text-muted-foreground"}`}
            onClick={handleKudos}
          >
            <Heart className={`w-4 h-4 ${hasKudos ? "fill-current" : ""}`} />
            <span>{kudosCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={handleComment}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground ml-auto"
            onClick={handleShare}
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </EloFrame>
  );
};

export default PostCard;
