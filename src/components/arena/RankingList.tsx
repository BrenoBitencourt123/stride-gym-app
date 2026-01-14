import { useState } from "react";
import { Trophy, Users, TrendingUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useArenaRankings, useArenaClan } from "@/hooks/useArenaFirestore";
import { getEloFrameStyles, getEloTierName, EloTier } from "@/lib/arena/eloUtils";
import { Skeleton } from "@/components/ui/skeleton";

type Period = "weekly" | "monthly";

const RankingList = () => {
  const [period, setPeriod] = useState<Period>("weekly");
  const { weeklyRankings, monthlyRankings, loading } = useArenaRankings();
  const { clan: userClan } = useArenaClan();

  const rankings = period === "weekly" ? weeklyRankings : monthlyRankings;

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-10 w-48" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Period Toggle */}
      <div className="flex justify-center mb-4">
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-full grid-cols-2 max-w-xs">
            <TabsTrigger value="weekly">Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Mensal</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Rankings */}
      <div className="space-y-3">
        {rankings.map((clan, index) => {
          const isUserClan = userClan?.id === clan.clanId;
          const eloTier = clan.clanElo?.tier || "iron";
          const eloStyles = getEloFrameStyles(eloTier as EloTier);
          const position = index + 1;

          return (
            <div
              key={clan.clanId}
              className={`p-4 rounded-xl border ${
                isUserClan 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center gap-4">
                {/* Position */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  position === 1 ? "bg-yellow-500/20 text-yellow-500" :
                  position === 2 ? "bg-gray-400/20 text-gray-400" :
                  position === 3 ? "bg-amber-600/20 text-amber-600" :
                  "bg-secondary text-muted-foreground"
                }`}>
                  {position <= 3 ? <Trophy className="w-4 h-4" /> : position}
                </div>

                {/* Clan Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-foreground">{clan.clanName}</h4>
                    <span 
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ 
                        background: eloStyles.gradient,
                        color: "white",
                      }}
                    >
                      {clan.clanElo ? getEloTierName(clan.clanElo.tier) : "Sem rank"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {clan.activeMembers} membros
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {clan.presenceRate}% presença
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">
                    {period === "weekly" ? clan.weeklyPoints : clan.monthlyPoints}
                  </p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </div>
            </div>
          );
        })}

        {rankings.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhum clã no ranking ainda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RankingList;
