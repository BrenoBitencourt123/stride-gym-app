// src/components/arena/UnifiedFeed.tsx
// Unified feed with internal filter toggle (Following/Global/Clan)

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, UserPlus, Users, Globe, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import PostCard from "./PostCard";
import WelcomePostCard from "./WelcomePostCard";
import EmptyFeedCard from "./EmptyFeedCard";
import SuggestedAthletesRow from "./SuggestedAthletesRow";
import PresenceList from "./PresenceList";
import { useAuth } from "@/contexts/AuthContext";
import { useArenaFeed, useArenaClan } from "@/hooks/useArenaFirestore";
import { useFollowingFeed } from "@/hooks/useFollowingFeed";
import { getFollowing } from "@/lib/arena/followRepo";
import { toggleKudos } from "@/lib/arena/arenaFirestore";

type FeedFilter = 'following' | 'global' | 'clan';

const FEED_FILTER_KEY = 'arena_feed_filter';

const UnifiedFeed = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState<FeedFilter>('following');
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Hooks for different feed types
  const { 
    posts: globalPosts, 
    loading: globalLoading, 
    refresh: refreshGlobal, 
    toggleKudos: toggleGlobalKudos 
  } = useArenaFeed('global');
  
  const { 
    posts: clanPosts, 
    loading: clanLoading, 
    refresh: refreshClan, 
    toggleKudos: toggleClanKudos 
  } = useArenaFeed('clan');
  
  const { 
    posts: followingPosts, 
    loading: followingLoading, 
    refresh: refreshFollowing 
  } = useFollowingFeed(30);
  
  const { clan, members, loading: clanDataLoading } = useArenaClan();

  // Load following count and determine default filter
  useEffect(() => {
    const initializeFilter = async () => {
      if (!user) return;

      try {
        // Check saved preference
        const savedFilter = localStorage.getItem(FEED_FILTER_KEY) as FeedFilter | null;
        
        // Get following count
        const following = await getFollowing(user.uid);
        setFollowingCount(following.length);

        // Determine default
        if (savedFilter && ['following', 'global', 'clan'].includes(savedFilter)) {
          setFilter(savedFilter);
        } else {
          // Default based on following count
          setFilter(following.length > 0 ? 'following' : 'global');
        }
      } catch (err) {
        console.error('Error initializing feed filter:', err);
        setFilter('global');
      } finally {
        setIsInitialized(true);
      }
    };

    initializeFilter();
  }, [user]);

  // Persist filter preference
  const handleFilterChange = useCallback((value: string) => {
    if (value && ['following', 'global', 'clan'].includes(value)) {
      setFilter(value as FeedFilter);
      localStorage.setItem(FEED_FILTER_KEY, value);
    }
  }, []);

  // Handle kudos toggle for following feed
  const handleFollowingKudos = async (postId: string) => {
    if (!user) return;
    await toggleKudos(postId, user.uid);
  };

  // Get current feed data based on filter
  const getCurrentFeed = () => {
    switch (filter) {
      case 'following':
        return {
          posts: followingPosts,
          loading: followingLoading,
          refresh: refreshFollowing,
          toggleKudos: handleFollowingKudos,
        };
      case 'clan':
        return {
          posts: clanPosts,
          loading: clanLoading,
          refresh: refreshClan,
          toggleKudos: toggleClanKudos,
        };
      case 'global':
      default:
        return {
          posts: globalPosts,
          loading: globalLoading,
          refresh: refreshGlobal,
          toggleKudos: toggleGlobalKudos,
        };
    }
  };

  const { posts, loading, refresh, toggleKudos: handleKudos } = getCurrentFeed();

  // Show loading while initializing
  if (!isInitialized) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-lg" />
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

  // Render empty state based on filter
  const renderEmptyState = () => {
    if (filter === 'following') {
      return (
        <div>
          {/* Empty state for following */}
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
          <SuggestedAthletesRow />
        </div>
      );
    }

    if (filter === 'clan') {
      if (!clan) {
        return (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Você ainda não faz parte de um clã
            </p>
            <Link to="/arena/clan">
              <Button variant="secondary">
                Criar ou entrar em um clã
              </Button>
            </Link>
          </div>
        );
      }

      return (
        <div>
          {/* Clan members presence list */}
          <div className="mb-6">
            <PresenceList members={members} />
          </div>
          <EmptyFeedCard type="clan" />
        </div>
      );
    }

    // Global empty state
    return (
      <div>
        <div className="mb-4">
          <WelcomePostCard />
        </div>
        <SuggestedAthletesRow className="mb-6" />
        <EmptyFeedCard type="global" />
      </div>
    );
  };

  // Render loading skeleton
  const renderLoading = () => (
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

  return (
    <div>
      {/* Filter Toggle */}
      <div className="mb-4">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={handleFilterChange}
          className="w-full bg-muted/50 p-1 rounded-lg"
        >
          <ToggleGroupItem 
            value="following" 
            className="flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <Users className="w-4 h-4 mr-2" />
            Seguindo
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="global" 
            className="flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <Globe className="w-4 h-4 mr-2" />
            Global
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="clan" 
            className="flex-1 data-[state=on]:bg-background data-[state=on]:shadow-sm"
          >
            <Shield className="w-4 h-4 mr-2" />
            Clã
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

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

      {/* Feed Content */}
      {loading ? (
        renderLoading()
      ) : posts.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="space-y-4">
          {/* Welcome card for global feed */}
          {filter === 'global' && (
            <WelcomePostCard />
          )}

          {/* Posts */}
          {posts.map((post, index) => (
            <div key={post.id}>
              <PostCard post={post} onKudosToggle={handleKudos} />
              {/* Show suggested athletes after 2nd post for global, 3rd for following */}
              {filter === 'global' && index === 1 && posts.length > 2 && (
                <SuggestedAthletesRow className="my-6" />
              )}
              {filter === 'following' && index === 2 && posts.length > 3 && (
                <SuggestedAthletesRow className="my-6" />
              )}
            </div>
          ))}

          {/* Show suggestions at the end for small feeds */}
          {filter === 'global' && posts.length <= 2 && (
            <SuggestedAthletesRow className="mt-6" />
          )}
        </div>
      )}
    </div>
  );
};

export default UnifiedFeed;
