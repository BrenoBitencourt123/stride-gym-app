import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Save, Instagram, MapPin, User, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/arena/UserAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getOrCreatePublicProfile, 
  updatePublicProfile,
  isUsernameAvailable,
  PublicProfileData
} from "@/lib/arena/socialRepo";
import { getArenaProfile } from "@/lib/arena/arenaFirestore";
import { toast } from "sonner";
import { EloTier } from "@/lib/arena/eloUtils";

const EditProfile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [arenaProfile, setArenaProfile] = useState<{ photoURL?: string; avatarId?: string; elo?: { tier: string } } | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [instagramHandle, setInstagramHandle] = useState("");
  
  const [usernameError, setUsernameError] = useState("");
  const [checkingUsername, setCheckingUsername] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      try {
        // Load arena profile for avatar
        const arena = await getArenaProfile(user.uid);
        setArenaProfile(arena ? { 
          photoURL: arena.photoURL, 
          avatarId: arena.avatarId,
          elo: arena.elo
        } : null);
        
        const data = await getOrCreatePublicProfile(
          user.uid,
          user.displayName || "Atleta",
          arena?.photoURL,
          arena?.avatarId
        );
        
        if (data) {
          setProfile(data);
          setDisplayName(data.displayName);
          setUsername(data.username || "");
          setBio(data.bio || "");
          setLocation(data.location || "");
          setInstagramHandle(data.instagramHandle || "");
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Erro ao carregar perfil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  // Validate username on change
  useEffect(() => {
    if (!username || username === profile?.username) {
      setUsernameError("");
      return;
    }

    const validateUsername = async () => {
      // Basic validation
      if (username.length < 3) {
        setUsernameError("Mínimo 3 caracteres");
        return;
      }
      if (username.length > 20) {
        setUsernameError("Máximo 20 caracteres");
        return;
      }
      if (!/^[a-z0-9_]+$/.test(username)) {
        setUsernameError("Apenas letras minúsculas, números e _");
        return;
      }

      setCheckingUsername(true);
      try {
        const available = await isUsernameAvailable(username);
        setUsernameError(available ? "" : "Username já em uso");
      } catch (error) {
        setUsernameError("Erro ao verificar");
      } finally {
        setCheckingUsername(false);
      }
    };

    const timer = setTimeout(validateUsername, 300);
    return () => clearTimeout(timer);
  }, [username, profile?.username]);

  const handleSave = async () => {
    if (!user || usernameError || checkingUsername) return;
    
    setSaving(true);
    try {
      await updatePublicProfile(user.uid, {
        displayName: displayName.trim(),
        username: username.toLowerCase().trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        instagramHandle: instagramHandle.trim() || undefined,
      });
      
      toast.success("Perfil atualizado!");
      navigate(-1);
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  const eloTier = (profile?.elo?.tier || arenaProfile?.elo?.tier || "iron") as EloTier;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Editar Perfil</h1>
          </div>
          <Button 
            onClick={handleSave} 
            disabled={saving || !!usernameError || checkingUsername}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <UserAvatar
            photoURL={arenaProfile?.photoURL}
            avatarId={arenaProfile?.avatarId}
            displayName={displayName}
            eloTier={eloTier}
            size="xl"
          />
          <p className="text-muted-foreground text-sm mt-2">
            Altere seu avatar nas configurações
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Nome de exibição
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Seu nome"
              maxLength={50}
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="username" className="flex items-center gap-2">
              <AtSign className="w-4 h-4" />
              Username
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              placeholder="seu_username"
              maxLength={20}
              className={usernameError ? "border-destructive" : ""}
            />
            {usernameError && (
              <p className="text-xs text-destructive">{usernameError}</p>
            )}
            {checkingUsername && (
              <p className="text-xs text-muted-foreground">Verificando...</p>
            )}
            {username && !usernameError && !checkingUsername && (
              <p className="text-xs text-green-500">✓ Disponível</p>
            )}
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              rows={3}
              maxLength={160}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/160
            </p>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location" className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Localização
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="São Paulo, Brasil"
              maxLength={50}
            />
          </div>

          {/* Instagram */}
          <div className="space-y-2">
            <Label htmlFor="instagram" className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              Instagram
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="instagram"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value.replace("@", ""))}
                placeholder="seu_instagram"
                className="pl-8"
                maxLength={30}
              />
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
