// src/pages/SocialProfile.tsx
// Self profile page with Instagram-style layout

import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings, Share2, Grid, Dumbbell, Trophy, MapPin, Instagram, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import ProgressionStats from "@/components/arena/ProgressionStats";
import PostGrid from "@/components/arena/PostGrid";
import { useAuth } from "@/contexts/AuthContext";
import { useMyFollowStats } from "@/hooks/useFollow";
import { getPublicProfile, PublicProfile } from "@/lib/arena/followRepo";
import { getPublicProfileByUid } from "@/lib/arena/socialRepo";
import { getUserPosts } from "@/lib/arena/socialRepo";
import { getEloFrameStyles, EloTier, ELO_TIER_NAMES } from "@/lib/arena/eloUtils";
import { Post } from "@/lib/arena/types";
import { toast } from "sonner";

const SocialProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [socialProfile, setSocialProfile] = useState<any>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("posts");
  
  const { followersCount, followingCount, loading: statsLoading } = useMyFollowStats();

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const [profileData, userPosts, social] = await Promise.all([
          getPublicProfile(user.uid),
          getUserPosts(user.uid, 30),
          getPublicProfileByUid(user.uid),
        ]);
        setProfile(profileData);
        setPosts(userPosts);
        setSocialProfile(social);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleShare = async () => {
    const profileUrl = `${window.location.origin}/arena/profile/${user?.uid}`;
    const shareText = `Confira meu perfil no LevelUp Gym! 💪\n${profileUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText, url: profileUrl });
      } catch {
        navigator.clipboard.writeText(profileUrl);
        toast.success('Link copiado!');
      }
    } else {
      navigator.clipboard.writeText(profileUrl);
      toast.success('Link copiado!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-28">
        <div className="max-w-md mx-auto px-4 pt-6">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
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
        </div>
        <BottomNav />
      </div>
    );
  }

  const eloTier = (profile?.elo?.tier || "iron") as EloTier;
  const eloStyles = getEloFrameStyles(eloTier);
  const tierName = ELO_TIER_NAMES[eloTier] || eloTier;

  const workoutPosts = posts.filter(p => p.type === 'workout' || p.workoutSnapshot);

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-foreground">
            @{socialProfile?.username || profile?.displayName?.toLowerCase().replace(/\s+/g, '_') || 'atleta'}
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-5 h-5" />
            </Button>
            <Link to="/settings">
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Profile Header */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar with Elo Frame */}
          <div className="relative flex-shrink-0">
            <div 
              className="w-20 h-20 rounded-full p-[3px]"
              style={{ background: eloStyles.gradient }}
            >
              <div className="w-full h-full rounded-full bg-background p-[2px]">
                <UserAvatar
                  photoURL={profile?.photoURL}
                  avatarId={profile?.avatarId}
                  displayName={profile?.displayName || 'Atleta'}
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
              {tierName} {profile?.elo?.division || 4}
            </div>
          </div>

          {/* Name and Stats */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {profile?.displayName || 'Atleta'}
            </h2>
            
            {/* Stats Row */}
            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-lg font-bold text-foreground">{profile?.totalWorkouts || 0}</p>
                <p className="text-[11px] text-muted-foreground">Treinos</p>
              </div>
              <Link to={`/arena/profile/${user?.uid}/followers`} className="text-center hover:opacity-80">
                <p className="text-lg font-bold text-foreground">{followersCount}</p>
                <p className="text-[11px] text-muted-foreground">Seguidores</p>
              </Link>
              <Link to={`/arena/profile/${user?.uid}/following`} className="text-center hover:opacity-80">
                <p className="text-lg font-bold text-foreground">{followingCount}</p>
                <p className="text-[11px] text-muted-foreground">Seguindo</p>
              </Link>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="mb-4">
          {socialProfile?.bio && (
            <p className="text-sm text-foreground mb-1">{socialProfile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {socialProfile?.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {socialProfile.location}
              </span>
            )}
            {socialProfile?.instagramHandle && (
              <a 
                href={`https://instagram.com/${socialProfile.instagramHandle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary"
              >
                <Instagram className="w-3 h-3" />
                @{socialProfile.instagramHandle}
              </a>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <Link to="/arena/edit-profile" className="flex-1">
            <Button variant="secondary" className="w-full">
              Editar perfil
            </Button>
          </Link>
          <Button variant="secondary" className="flex-1" onClick={handleShare}>
            Compartilhar perfil
          </Button>
        </div>

        {/* Progression Stats */}
        <div className="mb-6">
          <ProgressionStats
            level={profile?.level || 1}
            xp={profile?.xp || 0}
            xpGoal={profile?.xpGoal || 500}
            eloTier={eloTier}
            eloDivision={profile?.elo?.division || 4}
            streak={profile?.streak || 0}
            prsCount={profile?.prsCount || 0}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts" className="flex items-center gap-1.5">
              <Grid className="w-4 h-4" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="workouts" className="flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4" />
              Treinos
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4" />
              Conquistas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length > 0 ? (
              <PostGrid posts={posts} />
            ) : (
              <div className="text-center py-12">
                <Grid className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum post ainda</p>
                <p className="text-muted-foreground/70 text-xs mt-1">
                  Compartilhe seus treinos na Arena!
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="workouts" className="mt-4">
            {workoutPosts.length > 0 ? (
              <PostGrid posts={workoutPosts} />
            ) : (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">Nenhum treino compartilhado</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <Link to="/conquistas">
              <div className="card-glass rounded-xl p-6 text-center hover:bg-secondary/20 transition-colors">
                <Trophy className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <p className="text-foreground font-medium">Ver todas as conquistas</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Desbloqueie medalhas e ganhe XP
                </p>
              </div>
            </Link>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNav />
    </div>
  );
};

export default SocialProfile;
