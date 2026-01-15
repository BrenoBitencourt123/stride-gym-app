// src/components/arena/FollowingFeedList.tsx
// Feed showing posts from users I follow

import { RefreshCw, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "./PostCard";
import SuggestedAthletesRow from "./SuggestedAthletesRow";
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { toggleKudos } from "@/lib/arena/arenaFirestore";
import { useAuth } from "@/contexts/AuthContext";

const FollowingFeedList = () => {
  const { user } = useAuth();
  const { posts, loading, refresh } = useFollowingFeed(30);

  const handleToggleKudos = async (postId: string) => {
    if (!user) return;
    await toggleKudos(postId, user.uid);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card-glass p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div>
        {/* Refresh Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {/* Empty state */}
        <div className="card-glass rounded-xl p-6 text-center mb-6">
          <UserPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground mb-2">
            Comece a seguir atletas
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Siga outros atletas para ver seus treinos aqui
          </p>
          <Link to="/arena/search">
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Encontrar atletas
            </Button>
          </Link>
        </div>

        {/* Suggested athletes */}
        <SuggestedAthletesRow />
      </div>
    );
  }

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, index) => (
          <div key={post.id}>
            <PostCard post={post} onKudosToggle={handleToggleKudos} />
            {/* Show suggested athletes after 3rd post */}
            {index === 2 && posts.length > 3 && (
              <SuggestedAthletesRow className="my-6" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FollowingFeedList;
