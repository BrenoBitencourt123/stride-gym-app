import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, Plus, RefreshCw, Filter, Users as UsersIcon } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PlayerCard from "@/components/arena/PlayerCard";
import CleanFeed from "@/components/arena/CleanFeed";
import UsernameSetupModal from "@/components/arena/UsernameSetupModal";
import CreatePostModal from "@/components/arena/CreatePostModal";
import { useProgression } from "@/hooks/useProgression";
import { useUsernameSetup } from "@/hooks/useUsernameSetup";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const ArenaPage = () => {
  const navigate = useNavigate();
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [feedMode, setFeedMode] = useState<'global' | 'following'>('global');
  const [refreshKey, setRefreshKey] = useState(0);
  const { refresh } = useProgression();
  const { needsUsername, loading: usernameLoading } = useUsernameSetup();

  // Apply pending penalties when Arena is opened
  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggleFeedMode = () => {
    setFeedMode(prev => prev === 'global' ? 'following' : 'global');
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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

        {/* Player Card */}
        <div className="mb-6">
          <PlayerCard />
        </div>

        {/* Feed Controls - Minimal */}
        <div className="flex items-center justify-between mb-4">
          {/* Find Athletes Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/arena/search")}
            className="text-muted-foreground"
          >
            <UsersIcon className="w-4 h-4 mr-2" />
            Encontrar atletas
          </Button>

          {/* Refresh + Filter */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Atualizar
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={feedMode === 'following' ? 'secondary' : 'ghost'}
                    size="icon"
                    onClick={toggleFeedMode}
                    className="relative"
                  >
                    <Filter className="w-4 h-4" />
                    {feedMode === 'following' && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{feedMode === 'global' ? 'Ver apenas quem eu sigo' : 'Ver feed global'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Single Clean Feed */}
        <CleanFeed mode={feedMode} refreshKey={refreshKey} />
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
