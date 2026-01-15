import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { searchUsers, PublicProfileData } from "@/lib/arena/socialRepo";
import { followUser, unfollowUser } from "@/lib/arena/followRepo";
import { getEloFrameStyles, EloTier, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";
import { Skeleton } from "@/components/ui/skeleton";

const SearchUsers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PublicProfileData[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [followLoadingMap, setFollowLoadingMap] = useState<Record<string, boolean>>({});

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const users = await searchUsers(query.trim(), 20);
        // Filter out current user
        const filtered = users.filter(u => u.uid !== user?.uid);
        setResults(filtered);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, user?.uid]);

  const handleToggleFollow = useCallback(async (targetUid: string) => {
    if (!user) return;
    
    setFollowLoadingMap(prev => ({ ...prev, [targetUid]: true }));
    
    try {
      const isCurrentlyFollowing = followingMap[targetUid];
      
      if (isCurrentlyFollowing) {
        await unfollowUser(user.uid, targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: false }));
      } else {
        await followUser(user.uid, targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: true }));
      }
    } catch (error) {
      console.error("Follow error:", error);
    } finally {
      setFollowLoadingMap(prev => ({ ...prev, [targetUid]: false }));
    }
  }, [user, followingMap]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Buscar Atletas</h1>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Results */}
        <div className="space-y-3">
          {loading ? (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-glass rounded-xl p-4 flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-9 w-20" />
                </div>
              ))}
            </>
          ) : results.length > 0 ? (
            results.map((profile) => {
              const eloTier = (profile.elo?.tier || "iron") as EloTier;
              const eloStyles = getEloFrameStyles(eloTier);
              const tierName = ELO_TIER_NAMES[eloTier] || eloTier;
              const isFollowing = followingMap[profile.uid];
              const isLoading = followLoadingMap[profile.uid];

              return (
                <div
                  key={profile.uid}
                  className="card-glass rounded-xl p-4 flex items-center gap-3"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => navigate(`/arena/profile/${profile.uid}`)}
                  >
                    <UserAvatar
                      photoURL={profile.photoURL}
                      avatarId={profile.avatarId}
                      displayName={profile.displayName}
                      eloTier={eloTier}
                      size="md"
                    />
                  </div>

                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => navigate(`/arena/profile/${profile.uid}`)}
                  >
                    <p className="font-semibold text-foreground">
                      {profile.displayName}
                    </p>
                    {profile.username && (
                      <p className="text-xs text-muted-foreground">
                        @{profile.username}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{
                          background: eloStyles.gradient,
                          color: "white",
                        }}
                      >
                        {tierName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {profile.stats?.followersCount || 0} seguidores
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant={isFollowing ? "secondary" : "default"}
                    onClick={() => handleToggleFollow(profile.uid)}
                    disabled={isLoading}
                  >
                    {isFollowing ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Seguindo
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3 mr-1" />
                        Seguir
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          ) : query.trim() ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                Nenhum atleta encontrado para "{query}"
              </p>
            </div>
          ) : (
            <div className="text-center py-12">
              <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                Digite para buscar atletas
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchUsers;
