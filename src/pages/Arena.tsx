import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/arena/PlayerCard";
import FeedList from "@/components/arena/FeedList";
import RankingList from "@/components/arena/RankingList";
import { useProgression } from "@/hooks/useProgression";

const ArenaPage = () => {
  const [activeTab, setActiveTab] = useState("global");
  const { refresh } = useProgression();

  // Apply pending penalties when Arena is opened
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <h1 className="text-2xl font-bold text-foreground mb-4">Arena</h1>

        {/* Player Card */}
        <div className="mb-6">
          <PlayerCard />
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
