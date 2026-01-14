import { useState, useRef } from "react";
import { Upload, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { AVATAR_OPTIONS, AvatarOption } from "@/data/avatars";
import { uploadProfilePhoto } from "@/lib/storage/imageUpload";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface EditAvatarModalProps {
  open: boolean;
  onClose: () => void;
  currentPhotoURL?: string;
  currentAvatarId?: string;
  onSave: (photoURL: string, avatarId?: string) => Promise<void>;
}

const EditAvatarModal = ({
  open,
  onClose,
  currentPhotoURL,
  currentAvatarId,
  onSave,
}: EditAvatarModalProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<string>("gallery");
  const [selectedAvatarId, setSelectedAvatarId] = useState<string | undefined>(currentAvatarId);
  const [uploadedPhotoURL, setUploadedPhotoURL] = useState<string | undefined>(
    currentAvatarId ? undefined : currentPhotoURL
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem");
      return;
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande (máximo 2MB)");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewFile(event.target?.result as string);
      setPendingFile(file);
      setSelectedAvatarId(undefined); // Clear avatar selection
    };
    reader.readAsDataURL(file);
  };

  const handleUploadPhoto = async () => {
    if (!pendingFile || !user) return;

    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, pendingFile);
      setUploadedPhotoURL(url);
      setPreviewFile(null);
      setPendingFile(null);
      toast.success("Foto carregada!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao carregar foto");
    } finally {
      setUploading(false);
    }
  };

  const handleSelectAvatar = (avatar: AvatarOption) => {
    setSelectedAvatarId(avatar.id);
    setUploadedPhotoURL(undefined);
    setPreviewFile(null);
    setPendingFile(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedAvatarId) {
        // Using pre-defined avatar
        await onSave("", selectedAvatarId);
      } else if (uploadedPhotoURL) {
        // Using uploaded photo
        await onSave(uploadedPhotoURL, undefined);
      } else if (pendingFile && user) {
        // Upload pending file first
        const url = await uploadProfilePhoto(user.uid, pendingFile);
        await onSave(url, undefined);
      } else {
        toast.error("Selecione um avatar ou faça upload de uma foto");
        return;
      }
      toast.success("Avatar atualizado!");
      onClose();
    } catch (error) {
      toast.error("Erro ao salvar avatar");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = selectedAvatarId !== currentAvatarId || 
    (uploadedPhotoURL && uploadedPhotoURL !== currentPhotoURL) ||
    previewFile;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Editar Avatar</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gallery">Galeria</TabsTrigger>
            <TabsTrigger value="upload">Minha Foto</TabsTrigger>
          </TabsList>

          <TabsContent value="gallery" className="mt-4">
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((avatar) => {
                const IconComponent = avatar.icon;
                const isSelected = selectedAvatarId === avatar.id;
                
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleSelectAvatar(avatar)}
                    className={cn(
                      "relative w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    style={{ background: avatar.bgGradient }}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                    {isSelected && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="upload" className="mt-4 space-y-4">
            {/* Preview area */}
            <div className="flex flex-col items-center gap-4">
              {(previewFile || uploadedPhotoURL) ? (
                <div className="relative">
                  <img
                    src={previewFile || uploadedPhotoURL}
                    alt="Preview"
                    className="w-24 h-24 rounded-full object-cover ring-2 ring-primary"
                  />
                  {!selectedAvatarId && !previewFile && uploadedPhotoURL && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Escolher Foto
                </Button>
                
                {previewFile && (
                  <Button
                    size="sm"
                    onClick={handleUploadPhoto}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                    ) : null}
                    Carregar
                  </Button>
                )}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Tamanho máximo: 2MB<br />
                A imagem será redimensionada para 400x400px
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 mt-4">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleSave}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : null}
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditAvatarModal;
