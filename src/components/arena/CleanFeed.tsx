// src/components/arena/CleanFeed.tsx
// Clean, minimal feed component with global/following toggle

import { useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PostCard from "./PostCard";
import WelcomePostCard from "./WelcomePostCard";
import SuggestedAthletesRow from "./SuggestedAthletesRow";
import { useAuth } from "@/contexts/AuthContext";
import { useArenaFeed } from "@/hooks/useArenaFirestore";
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { toggleKudos } from "@/lib/arena/arenaFirestore";

interface CleanFeedProps {
  mode: 'global' | 'following';
  refreshKey?: number;
}

const CleanFeed = ({ mode, refreshKey = 0 }: CleanFeedProps) => {
  const { user } = useAuth();

  // Global feed hook
  const { 
    posts: globalPosts, 
    loading: globalLoading, 
    refresh: refreshGlobal, 
    toggleKudos: toggleGlobalKudos 
  } = useArenaFeed('global');
  
  // Following feed hook
  const { 
    posts: followingPosts, 
    loading: followingLoading, 
    refresh: refreshFollowing 
  } = useFollowingFeed(30);

  // Handle kudos for following feed
  const handleFollowingKudos = useCallback(async (postId: string) => {
    if (!user) return;
    await toggleKudos(postId, user.uid);
  }, [user]);

  // Refresh when refreshKey changes
  useEffect(() => {
    if (refreshKey > 0) {
      if (mode === 'global') {
        refreshGlobal();
      } else {
        refreshFollowing();
      }
    }
  }, [refreshKey, mode, refreshGlobal, refreshFollowing]);

  // Get current feed data
  const posts = mode === 'global' ? globalPosts : followingPosts;
  const loading = mode === 'global' ? globalLoading : followingLoading;
  const handleKudos = mode === 'global' ? toggleGlobalKudos : handleFollowingKudos;

  // Loading skeleton
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

  // Empty state for following feed
  if (mode === 'following' && posts.length === 0) {
    return (
      <div className="space-y-6">
        {/* Empty state card */}
        <div className="card-glass rounded-xl p-6 text-center">
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

  // Empty state for global feed
  if (mode === 'global' && posts.length === 0) {
    return (
      <div className="space-y-4">
        <WelcomePostCard />
        <SuggestedAthletesRow />
      </div>
    );
  }

  // Main feed
  return (
    <div className="space-y-4">
      {/* Welcome card for global feed */}
      {mode === 'global' && (
        <WelcomePostCard />
      )}

      {/* Posts */}
      {posts.map((post, index) => (
        <div key={post.id}>
          <PostCard post={post} onKudosToggle={handleKudos} />
          
          {/* Show suggested athletes after 2nd post for global, 3rd for following */}
          {mode === 'global' && index === 1 && posts.length > 2 && (
            <SuggestedAthletesRow className="my-6" />
          )}
          {mode === 'following' && index === 2 && posts.length > 3 && (
            <SuggestedAthletesRow className="my-6" />
          )}
        </div>
      ))}

      {/* Suggestions at end for small feeds */}
      {mode === 'global' && posts.length <= 2 && (
        <SuggestedAthletesRow className="mt-6" />
      )}
      {mode === 'following' && posts.length <= 3 && (
        <SuggestedAthletesRow className="mt-6" />
      )}
    </div>
  );
};

export default CleanFeed;
