import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/arena/PlayerCard";
import ClanCard from "@/components/arena/ClanCard";
import FeedList from "@/components/arena/FeedList";
import RankingList from "@/components/arena/RankingList";
import { useProgression } from "@/hooks/useProgression";
import { useArenaClan } from "@/hooks/useArenaFirestore";

const ArenaPage = () => {
  const [activeTab, setActiveTab] = useState("global");
  const { refresh } = useProgression();
  const { clan, members } = useArenaClan();

  // Apply pending penalties when Arena is opened
  useEffect(() => {
    refresh();
  }, [refresh]);

  const showClanCard = activeTab === "clan" && clan;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-4">Arena</h1>

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
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="global">Feed Global</TabsTrigger>
            <TabsTrigger value="clan">Meu Clã</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

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
    </div>
  );
};

export default ArenaPage;
