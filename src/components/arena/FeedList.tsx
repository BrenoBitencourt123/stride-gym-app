import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useArenaFeed, useArenaClan } from "@/hooks/useArenaFirestore";
import PostCard from "./PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import WelcomePostCard from "./WelcomePostCard";
import EmptyFeedCard from "./EmptyFeedCard";
import SuggestedAthletesRow from "./SuggestedAthletesRow";

interface FeedListProps {
  type: "global" | "clan";
}

const FeedList = ({ type }: FeedListProps) => {
  const { posts, loading, refresh, toggleKudos } = useArenaFeed(type);
  const { clan, loading: clanLoading } = useArenaClan();

  if (type === "clan" && !clanLoading && !clan) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">
          Você ainda não faz parte de um clã
        </p>
        <Button variant="secondary" onClick={() => window.location.href = "/arena/clan"}>
          Criar ou entrar em um clã
        </Button>
      </div>
    );
  }

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

  // For global feed with no posts, show welcome card, suggestions, then empty CTA
  if (type === "global" && posts.length === 0) {
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

        {/* Welcome card always shows first */}
        <div className="mb-4">
          <WelcomePostCard />
        </div>

        {/* Suggested Athletes */}
        <SuggestedAthletesRow className="mb-6" />

        {/* Then empty state CTA */}
        <EmptyFeedCard type={type} />
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

      {/* Welcome card for global feed */}
      {type === "global" && (
        <div className="mb-4">
          <WelcomePostCard />
        </div>
      )}

      {/* Posts with suggested athletes interspersed */}
      {posts.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post, index) => (
            <div key={post.id}>
              <PostCard 
                post={post}
                onKudosToggle={toggleKudos}
              />
              {/* Show suggested athletes after the 2nd post (index 1) for global feed */}
              {type === "global" && index === 1 && (
                <SuggestedAthletesRow className="my-6" />
              )}
            </div>
          ))}
          {/* If fewer than 3 posts, show suggestions at the end */}
          {type === "global" && posts.length > 0 && posts.length <= 2 && (
            <SuggestedAthletesRow className="mt-6" />
          )}
        </div>
      ) : (
        <EmptyFeedCard type={type} />
      )}
    </div>
  );
};

export default FeedList;
