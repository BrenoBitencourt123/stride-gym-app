import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGlobalFeed, getClanFeed, ArenaPost, getUserClan } from "@/lib/arena/arenaStorage";
import PostCard from "./PostCard";

interface FeedListProps {
  type: "global" | "clan";
}

const FeedList = ({ type }: FeedListProps) => {
  const [posts, setPosts] = useState<ArenaPost[]>([]);
  const [loading, setLoading] = useState(false);
  const userClan = getUserClan();

  const loadPosts = () => {
    setLoading(true);
    setTimeout(() => {
      if (type === "global") {
        setPosts(getGlobalFeed());
      } else if (userClan) {
        setPosts(getClanFeed(userClan.id));
      } else {
        setPosts([]);
      }
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    loadPosts();
  }, [type, userClan?.id]);

  if (type === "clan" && !userClan) {
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

  return (
    <div>
      {/* Refresh Button */}
      <div className="flex justify-end mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={loadPosts}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      {/* Posts */}
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post}
            onKudosChange={loadPosts}
          />
        ))
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {type === "global" 
              ? "Nenhum post ainda. Seja o primeiro a compartilhar um treino!"
              : "Nenhum post do clã ainda."
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedList;
