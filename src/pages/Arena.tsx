import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/arena/PlayerCard";
import ClanCard from "@/components/arena/ClanCard";
import FeedList from "@/components/arena/FeedList";
import FollowingFeedList from "@/components/arena/FollowingFeedList";
import RankingList from "@/components/arena/RankingList";
import UsernameSetupModal from "@/components/arena/UsernameSetupModal";
import CreatePostModal from "@/components/arena/CreatePostModal";
import { useProgression } from "@/hooks/useProgression";
import { useArenaClan } from "@/hooks/useArenaFirestore";
import { useUsernameSetup } from "@/hooks/useUsernameSetup";

const ArenaPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("following");
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { refresh } = useProgression();
  const { clan, members } = useArenaClan();
  const { needsUsername, loading: usernameLoading } = useUsernameSetup();

  // Apply pending penalties when Arena is opened
  useEffect(() => {
    refresh();
  }, [refresh]);

  const showClanCard = activeTab === "clan" && clan;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-foreground">Arena</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/arena/search")}
            >
              <Search className="w-5 h-5" />
            </Button>
            <Button
              size="icon"
              onClick={() => setShowCreatePost(true)}
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Player Card or Clan Card based on active tab */}
        <div className="mb-6">
          {showClanCard ? (
            <ClanCard clan={clan} members={members} />
          ) : (
            <PlayerCard />
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="following">Seguindo</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="clan">Clã</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="following">
            <FollowingFeedList />
          </TabsContent>

          <TabsContent value="global">
            <FeedList type="global" />
          </TabsContent>

          <TabsContent value="clan">
            <FeedList type="clan" />
          </TabsContent>

          <TabsContent value="ranking">
            <RankingList />
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />

      {/* Username Setup Modal - shows on first Arena visit */}
      {!usernameLoading && needsUsername && (
        <UsernameSetupModal open={needsUsername} onOpenChange={() => {}} />
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        open={showCreatePost}
        onOpenChange={setShowCreatePost}
      />
    </div>
  );
};

export default ArenaPage;
