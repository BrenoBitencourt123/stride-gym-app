// src/pages/AthleteProfile.tsx
// Public profile page with progression-focused layout

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Check, MoreHorizontal, Share2, MapPin, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import EloFrame from "@/components/arena/EloFrame";
import ProgressionStats from "@/components/arena/ProgressionStats";
import ActivityChart from "@/components/arena/ActivityChart";
import WorkoutHistoryCard from "@/components/arena/WorkoutHistoryCard";
import PostCard from "@/components/arena/PostCard";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicProfile, PublicProfile } from "@/lib/arena/followRepo";
import { getUserPosts } from "@/lib/arena/socialRepo";
import { getEloFrameStyles, EloTier, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";
import { Post } from "@/lib/arena/types";

const AthleteProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { isFollowing, loading: followLoading, toggleFollow, followersCount, followingCount } = useFollow(userId || null);
  
  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const [profileData, userPosts] = await Promise.all([
          getPublicProfile(userId),
          getUserPosts(userId, 10),
        ]);
        setProfile(profileData);
        setPosts(userPosts);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>

          {/* Profile skeleton */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-6 w-32 mb-2" />
              <div className="flex gap-6">
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-10 w-16" />
              </div>
            </div>
          </div>

          {/* Stats skeleton */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>

          {/* Activity skeleton */}
          <Skeleton className="h-28 rounded-xl mb-6" />
        </div>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Perfil</h1>
          </div>

          <div className="card-glass rounded-xl p-6 text-center">
            <p className="text-muted-foreground mb-4">
              Este perfil não está disponível.
            </p>
            <Button variant="secondary" onClick={() => navigate('/arena')}>
              Voltar para Arena
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const eloTier = (profile.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);
  const tierName = ELO_TIER_NAMES[eloTier] || eloTier;

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              @{profile.displayName.toLowerCase().replace(/\s+/g, '_')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Share2 className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Profile Header - Compact */}
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar with Elo Frame */}
          <div className="relative">
            <div 
              className="w-20 h-20 rounded-full p-[3px]"
              style={{ background: eloStyles.gradient }}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <UserAvatar
                  photoURL={profile.photoURL}
                  avatarId={profile.avatarId}
                  displayName={profile.displayName}
                  eloTier={eloTier}
                  size="lg"
                />
              </div>
            </div>
            {/* Elo Badge */}
            <div 
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
              style={{ background: eloStyles.gradient }}
            >
              {tierName} {profile.elo.division}
            </div>
          </div>

          {/* Name and Stats */}
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground mb-2">
              {profile.displayName}
            </h1>
            
            {/* Stats Row */}
            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{profile.totalWorkouts}</p>
                <p className="text-[11px] text-muted-foreground">Treinos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{followersCount}</p>
                <p className="text-[11px] text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{followingCount}</p>
                <p className="text-[11px] text-muted-foreground">Seguindo</p>
              </div>
            </div>
          </div>
        </div>

        {/* Follow Button */}
        {!isOwnProfile && (
          <Button
            className="w-full mb-6"
            variant={isFollowing ? "secondary" : "default"}
            onClick={toggleFollow}
            disabled={followLoading}
          >
            {isFollowing ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Seguindo
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Seguir
              </>
            )}
          </Button>
        )}

        {/* Progression Stats Cards */}
        <div className="mb-6">
          <ProgressionStats
            level={profile.level || 1}
            xp={profile.xp || 0}
            xpGoal={profile.xpGoal || 500}
            eloTier={eloTier}
            eloDivision={profile.elo.division}
            streak={profile.streak || 0}
            prsCount={profile.prsCount || 0}
          />
        </div>

        {/* Activity Chart */}
        {profile.weeklyActivity && profile.weeklyActivity.length > 0 && (
          <div className="mb-6">
            <ActivityChart 
              data={profile.weeklyActivity} 
              eloTier={eloTier} 
            />
          </div>
        )}

        {/* Workout History */}
        {profile.workoutHistory && profile.workoutHistory.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Últimos Treinos
            </h3>
            <div className="space-y-2">
              {profile.workoutHistory.slice(0, 5).map((workout) => (
                <WorkoutHistoryCard
                  key={workout.id}
                  workout={workout}
                  onClick={() => navigate(`/arena/post/${workout.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Posts Feed */}
        {posts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-foreground mb-3">
              Publicações
            </h3>
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State for new profiles */}
        {!profile.workoutHistory?.length && posts.length === 0 && (
          <div className="card-glass rounded-xl p-6 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma atividade ainda.
            </p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default AthleteProfile;
