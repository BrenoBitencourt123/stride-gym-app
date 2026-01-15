// src/pages/ArenaRanking.tsx
// Dedicated Ranking page accessible from PlayerCard

import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import RankingList from "@/components/arena/RankingList";

const ArenaRanking = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/arena")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold text-foreground">Ranking de Clãs</h1>
        </div>

        {/* Ranking List */}
        <RankingList />
      </div>
      <BottomNav />
    </div>
  );
};

export default ArenaRanking;
