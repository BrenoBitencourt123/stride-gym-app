// src/pages/FollowersList.tsx
// Page showing followers or following list

import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Search, UserPlus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { useFollow } from "@/hooks/useFollow";
import { getFollowers, getFollowing, getPublicProfile, PublicProfile } from "@/lib/arena/followRepo";
import { getEloFrameStyles, EloTier, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";

interface UserItemProps {
  profile: PublicProfile;
  isOwnProfile: boolean;
}

const UserItem = ({ profile, isOwnProfile }: UserItemProps) => {
  const navigate = useNavigate();
  const { isFollowing, loading, toggleFollow } = useFollow(profile.userId);
  const { user } = useAuth();
  
  const eloTier = (profile.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);
  const tierName = ELO_TIER_NAMES[eloTier];
  const isSelf = user?.uid === profile.userId;

  return (
    <div className="flex items-center gap-3 p-3 hover:bg-secondary/30 rounded-lg transition-colors">
      <div 
        onClick={() => navigate(`/arena/profile/${profile.userId}`)}
        className="cursor-pointer"
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
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => navigate(`/arena/profile/${profile.userId}`)}
      >
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground truncate">
            {profile.displayName}
          </p>
          <span 
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium text-white flex-shrink-0"
            style={{ background: eloStyles.gradient }}
          >
            {tierName}
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {profile.totalWorkouts || 0} treinos
        </p>
      </div>

      {!isSelf && (
        <Button
          size="sm"
          variant={isFollowing ? "secondary" : "default"}
          onClick={toggleFollow}
          disabled={loading}
          className="flex-shrink-0"
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
      )}
    </div>
  );
};

const FollowersList = () => {
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const isFollowersPage = location.pathname.includes('/followers');
  const title = isFollowersPage ? 'Seguidores' : 'Seguindo';
  
  const [profiles, setProfiles] = useState<PublicProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const loadUsers = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        // Get list of user IDs
        const userIds = isFollowersPage 
          ? await getFollowers(userId)
          : await getFollowing(userId);
        
        // Load profiles for each user
        const profilePromises = userIds.map(uid => getPublicProfile(uid));
        const loadedProfiles = await Promise.all(profilePromises);
        
        // Filter out null profiles
        setProfiles(loadedProfiles.filter((p): p is PublicProfile => p !== null));
      } catch (error) {
        console.error('Error loading users:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [userId, isFollowersPage]);

  // Filter profiles by search term
  const filteredProfiles = profiles.filter(p => 
    p.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{title}</h1>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar..."
            className="pl-9"
          />
        </div>

        {/* User List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : filteredProfiles.length > 0 ? (
          <div className="space-y-1">
            {filteredProfiles.map((profile) => (
              <UserItem 
                key={profile.userId} 
                profile={profile}
                isOwnProfile={isOwnProfile}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm 
                ? 'Nenhum resultado encontrado'
                : isFollowersPage 
                  ? 'Nenhum seguidor ainda'
                  : 'Não está seguindo ninguém ainda'
              }
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default FollowersList;
