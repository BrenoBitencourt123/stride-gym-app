// src/pages/AthleteProfile.tsx
// Public profile page for viewing other athletes

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus, Check, Dumbbell, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import EloFrame from "@/components/arena/EloFrame";
import { useFollow } from "@/hooks/useFollow";
import { useAuth } from "@/contexts/AuthContext";
import { getPublicProfile, PublicProfile } from "@/lib/arena/followRepo";
import { getEloFrameStyles, EloTier, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";

const AthleteProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { isFollowing, loading: followLoading, toggleFollow, followersCount, followingCount } = useFollow(userId || null);
  
  const isOwnProfile = user?.uid === userId;

  useEffect(() => {
    const loadProfile = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const data = await getPublicProfile(userId);
        setProfile(data);
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
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Profile skeleton */}
          <div className="card-glass rounded-xl p-6 text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-20 mx-auto mb-4" />
            <div className="flex justify-center gap-8 mb-4">
              <Skeleton className="h-10 w-16" />
              <Skeleton className="h-10 w-16" />
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
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

  const formatScheduleDays = (days: number[]): string => {
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    return days.map(d => dayNames[d]).join(', ') || 'Não definido';
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">{profile.displayName}</h1>
        </div>

        {/* Profile Card */}
        <EloFrame tier={eloTier} className="mb-6">
          <div className="p-6 text-center">
            {/* Avatar */}
            <div className="flex justify-center mb-4">
              <UserAvatar
                photoURL={profile.photoURL}
                avatarId={profile.avatarId}
                displayName={profile.displayName}
                eloTier={eloTier}
                size="xl"
              />
            </div>

            {/* Name */}
            <h2 className="text-xl font-bold text-foreground mb-2">
              {profile.displayName}
            </h2>

            {/* Elo Badge */}
            <div className="flex justify-center mb-4">
              <span 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  background: eloStyles.gradient,
                  color: 'white',
                }}
              >
                {tierName} {profile.elo.division}
              </span>
            </div>

            {/* Stats */}
            <div className="flex justify-center gap-8 mb-6">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{followersCount}</p>
                <p className="text-xs text-muted-foreground">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{followingCount}</p>
                <p className="text-xs text-muted-foreground">Seguindo</p>
              </div>
            </div>

            {/* Follow Button */}
            {!isOwnProfile && (
              <Button
                className="w-full"
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
          </div>
        </EloFrame>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Treinos</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {profile.totalWorkouts}
            </p>
          </div>

          <div className="card-glass rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Pontos</span>
            </div>
            <p className="text-xl font-bold text-foreground">
              {profile.weeklyPoints}
            </p>
            <p className="text-[10px] text-muted-foreground">esta semana</p>
          </div>
        </div>

        {/* Schedule */}
        <div className="card-glass rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Dias de Treino</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {formatScheduleDays(profile.scheduleDays)}
          </p>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default AthleteProfile;
