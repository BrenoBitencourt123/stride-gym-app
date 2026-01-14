import { useState, useRef, useMemo } from "react";
import { ArrowLeft, Award, Flame, Dumbbell, TrendingUp, Scale, Edit2, ChevronRight, Cloud, CloudOff, RefreshCw, LogOut, Download, Upload, Check, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AvatarFrame from "@/components/AvatarFrame";
import XPBar from "@/components/XPBar";
import { Button } from "@/components/ui/button";
import { exportAppState, importAppState } from "@/lib/appState";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStateContext } from "@/contexts/AppStateContext";
import { toast } from "sonner";

const Perfil = () => {
  const navigate = useNavigate();
  const { user, syncStatus, isConfigured, logout, triggerSync } = useAuth();
  const { state, loading, getProfile: getProfileFromContext } = useAppStateContext();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // Get data from Firebase state
  const profile = getProfileFromContext();
  const progression = state?.progression;
  
  // Calculate achievements from state
  const unlockedAchievements = useMemo(() => {
    return state?.achievements?.unlocked || [];
  }, [state]);
  
  const unlockedCount = unlockedAchievements.length;
  
  // Calculate stats from state
  const totalWorkouts = useMemo(() => {
    let count = 0;
    Object.values(state?.weeklyCompletions || {}).forEach((week: any) => {
      count += Object.keys(week || {}).length;
    });
    return count;
  }, [state?.weeklyCompletions]);
  
  const totalVolume = useMemo(() => {
    let vol = 0;
    Object.values(state?.weeklyCompletions || {}).forEach((week: any) => {
      Object.values(week || {}).forEach((completion: any) => {
        vol += completion?.totalVolume || 0;
      });
    });
    return vol;
  }, [state?.weeklyCompletions]);
  
  // Get streak from progression (use bestStreak or default)
  const streak = 0; // TODO: Add streak tracking to progression
  
  const stats = [
    { icon: Flame, label: "Streak atual", value: `${streak} dias`, color: "text-orange-500" },
    { icon: Dumbbell, label: "Treinos concluídos", value: String(totalWorkouts), color: "text-blue-500" },
    { icon: TrendingUp, label: "Volume total", value: `${(totalVolume / 1000).toFixed(1)}t`, color: "text-green-500" },
    { icon: Award, label: "Conquistas", value: `${unlockedCount}/12`, color: "text-yellow-500" },
  ];

  const getSyncStatusInfo = () => {
    switch (syncStatus) {
      case 'synced':
        return { icon: Check, label: 'Sincronizado', color: 'text-green-500' };
      case 'syncing':
        return { icon: Loader2, label: 'Sincronizando...', color: 'text-blue-500', animate: true };
      case 'pending':
        return { icon: Cloud, label: 'Pendente', color: 'text-yellow-500' };
      case 'offline':
        return { icon: CloudOff, label: 'Offline', color: 'text-muted-foreground' };
      case 'error':
        return { icon: CloudOff, label: 'Erro de sync', color: 'text-destructive' };
      default:
        return { icon: Cloud, label: 'Não sincronizado', color: 'text-muted-foreground' };
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await triggerSync();
      toast.success('Sincronização concluída!');
    } catch (error) {
      toast.error('Erro ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Você saiu da conta');
    } catch (error) {
      toast.error('Erro ao sair');
    }
  };

  const handleExport = () => {
    try {
      const json = exportAppState();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `levelup-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Backup exportado com sucesso!');
    } catch (error) {
      toast.error('Erro ao exportar backup');
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const result = importAppState(text);
      
      if (result.success) {
        toast.success('Backup importado com sucesso! Recarregando...');
        // Trigger sync if logged in
        if (user) {
          await triggerSync();
        }
        // Reload to refresh all data
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(result.error || 'Erro ao importar backup');
      }
    } catch (error) {
      toast.error('Erro ao ler arquivo');
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const syncInfo = getSyncStatusInfo();
  const SyncIcon = syncInfo.icon;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Use progression for level/XP display
  const displayLevel = progression?.accountLevel || 1;
  const displayXP = progression?.xp || 0;
  const displayXPMeta = progression?.xpToNext || 500;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-muted-foreground" />
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Meu Perfil</h1>
          </div>
          <Link
            to="/settings"
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors"
          >
            <Edit2 className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>

        {/* Avatar & Level */}
        <div className="flex flex-col items-center mb-6">
          <AvatarFrame level={displayLevel} />
          <h2 className="mt-4 text-xl font-bold text-foreground">Nível {displayLevel}</h2>
          <p className="text-sm text-muted-foreground">
            {user ? user.email : 'Atleta Dedicado'}
          </p>
        </div>

        {/* XP Bar */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-foreground font-medium">XP para próximo nível</span>
            <span className="text-sm text-muted-foreground">{displayXP} / {displayXPMeta}</span>
          </div>
          <XPBar current={displayXP} max={displayXPMeta} />
        </div>

        {/* Sync Status Card */}
        <div className="card-glass p-4 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SyncIcon className={`w-5 h-5 ${syncInfo.color} ${syncInfo.animate ? 'animate-spin' : ''}`} />
              <span className={`text-sm font-medium ${syncInfo.color}`}>{syncInfo.label}</span>
            </div>
            {user && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={syncing || syncStatus === 'syncing'}
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${syncing ? 'animate-spin' : ''}`} />
                Sincronizar
              </Button>
            )}
          </div>
          
          {!user ? (
            <Button
              className="w-full"
              onClick={() => navigate('/login')}
            >
              <Cloud className="w-4 h-4 mr-2" />
              Fazer login para sincronizar
            </Button>
          ) : (
            <Button
              variant="outline"
              className="w-full text-destructive hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair da conta
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="card-glass p-4">
                <Icon className={`w-5 h-5 ${stat.color} mb-2`} />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Backup Section */}
        <div className="card-glass p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">Backup Local</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleExport}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleImportClick}
              disabled={importing}
            >
              <Upload className="w-4 h-4 mr-2" />
              {importing ? 'Importando...' : 'Importar'}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFile}
            className="hidden"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Exporte seus dados para um arquivo JSON ou importe um backup anterior.
          </p>
        </div>

        {/* Quick Links */}
        <div className="space-y-2">
          <Link
            to="/conquistas"
            className="card-glass p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Award className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-foreground">Ver todas as conquistas</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
          
          <Link
            to="/settings"
            className="card-glass p-4 flex items-center justify-between hover:bg-card/80 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-foreground">Histórico de peso</span>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};

export default Perfil;
