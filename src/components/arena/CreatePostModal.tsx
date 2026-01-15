// src/components/arena/CreatePostModal.tsx
// Modal for creating posts with photos

import { useState, useRef } from "react";
import { Camera, X, Loader2, Image as ImageIcon, Dumbbell, Globe, Users, Lock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useArenaProfile, useArenaClan } from "@/hooks/useArenaFirestore";
import { uploadPostImage, generatePostId, validateImageFile } from "@/lib/arena/postMediaRepo";
import { createPost } from "@/lib/arena/arenaFirestore";
import { PostVisibility, WorkoutSnapshot, PostMedia } from "@/lib/arena/types";
import { toast } from "sonner";

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutSnapshot?: WorkoutSnapshot | null;
  onPostCreated?: () => void;
}

const CreatePostModal = ({ 
  open, 
  onOpenChange, 
  workoutSnapshot,
  onPostCreated 
}: CreatePostModalProps) => {
  const { user } = useAuth();
  const { profile } = useArenaProfile();
  const { clan } = useArenaClan();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState<PostVisibility>("public");
  const [postToClan, setPostToClan] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [includeWorkout, setIncludeWorkout] = useState(!!workoutSnapshot);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validation = validateImageFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile) {
      toast.error("Faça login para postar");
      return;
    }
    
    if (!selectedFile && !includeWorkout) {
      toast.error("Adicione uma foto ou selecione um treino");
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const postId = generatePostId();
      let media: PostMedia[] | undefined;
      
      // Upload image if selected
      if (selectedFile) {
        const uploadedMedia = await uploadPostImage(user.uid, postId, selectedFile);
        media = [uploadedMedia];
      }
      
      // Create post - use the existing createPost function with a dummy workout for photo-only
      if (includeWorkout && workoutSnapshot) {
        await createPost(
          user.uid,
          profile,
          workoutSnapshot,
          caption,
          visibility,
          postToClan,
          clan?.id,
          media?.[0]?.url
        );
      } else if (media) {
        // For photo-only posts, create a minimal workout snapshot
        const photoOnlySnapshot = {
          workoutId: 'photo',
          workoutTitle: 'Foto',
          duration: 0,
          totalSets: 0,
          totalReps: 0,
          totalVolume: 0,
          prsCount: 0,
          exercises: [],
        };
        await createPost(
          user.uid,
          profile,
          photoOnlySnapshot,
          caption,
          visibility,
          postToClan,
          clan?.id,
          media[0].url
        );
      }
      
      toast.success("Post publicado!");
      onPostCreated?.();
      onOpenChange(false);
      
      // Reset form
      setCaption("");
      setSelectedFile(null);
      setPreviewUrl(null);
      setIncludeWorkout(false);
      
    } catch (error) {
      console.error("Error creating post:", error);
      toast.error("Erro ao publicar post");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      handleRemoveImage();
      setCaption("");
      onOpenChange(false);
    }
  };

  const canSubmit = (selectedFile || (includeWorkout && workoutSnapshot)) && !isSubmitting;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Foto</Label>
            
            {previewUrl ? (
              <div className="relative rounded-lg overflow-hidden bg-secondary">
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full aspect-[4/3] object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[4/3] border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
              >
                <Camera className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para adicionar foto
                </span>
              </button>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Include Workout Toggle */}
          {workoutSnapshot && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Dumbbell className="w-5 h-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">{workoutSnapshot.workoutTitle}</p>
                <p className="text-xs text-muted-foreground">
                  {workoutSnapshot.totalSets} séries · {workoutSnapshot.totalVolume.toLocaleString()}kg
                </p>
              </div>
              <Button
                variant={includeWorkout ? "default" : "outline"}
                size="sm"
                onClick={() => setIncludeWorkout(!includeWorkout)}
              >
                {includeWorkout ? "Incluído" : "Incluir"}
              </Button>
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="O que você quer compartilhar?"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {caption.length}/500
            </p>
          </div>

          {/* Visibility */}
          <div className="space-y-2">
            <Label>Visibilidade</Label>
            <Select value={visibility} onValueChange={(v) => setVisibility(v as PostVisibility)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Público</span>
                  </div>
                </SelectItem>
                {clan && (
                  <SelectItem value="clan">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>Apenas Clã</span>
                    </div>
                  </SelectItem>
                )}
                <SelectItem value="followers">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Apenas Seguidores</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Post to Clan */}
          {clan && visibility === "public" && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span className="text-sm">Também postar no clã</span>
              </div>
              <Button
                variant={postToClan ? "default" : "outline"}
                size="sm"
                onClick={() => setPostToClan(!postToClan)}
              >
                {postToClan ? "Sim" : "Não"}
              </Button>
            </div>
          )}

          {/* Submit Button */}
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Publicando...
              </>
            ) : (
              'Publicar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePostModal;
