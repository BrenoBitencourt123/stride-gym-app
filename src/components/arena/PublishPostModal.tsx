import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Globe, Users, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createPost, WorkoutSnapshot, getUserClan } from "@/lib/arena/arenaStorage";
import { toast } from "sonner";

interface PublishPostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workoutSnapshot: WorkoutSnapshot;
  summary: {
    duration: number;
    totalSets: number;
    totalVolume: number;
    prsCount?: number;
  };
}

const PublishPostModal = ({
  open,
  onOpenChange,
  workoutSnapshot,
  summary,
}: PublishPostModalProps) => {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"public" | "clan">("public");
  const [postToClan, setPostToClan] = useState(true);
  const [loading, setLoading] = useState(false);

  const userClan = getUserClan();

  const handlePublish = async () => {
    setLoading(true);
    
    try {
      createPost(
        workoutSnapshot,
        description.trim() || "",
        visibility,
        postToClan && !!userClan,
        undefined // photoURL
      );

      toast.success("Post publicado na Arena!");
      onOpenChange(false);
      navigate("/arena");
    } catch (error) {
      toast.error("Erro ao publicar post");
    } finally {
      setLoading(false);
    }
  };

  const workoutTitle = workoutSnapshot.workoutTitle || "Treino";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Publicar na Arena</DialogTitle>
        </DialogHeader>

        {/* Workout Preview */}
        <div className="bg-secondary/50 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-foreground mb-2">{workoutTitle}</h4>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{summary.duration}min</span>
            <span>{summary.totalSets} séries</span>
            <span>{summary.totalVolume.toLocaleString()}kg</span>
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Descrição (opcional)</Label>
          <Textarea
            id="description"
            placeholder="Como foi o treino?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="resize-none"
            rows={3}
          />
        </div>

        {/* Visibility */}
        <div className="space-y-3">
          <Label>Visibilidade</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={visibility === "public" ? "default" : "secondary"}
              size="sm"
              onClick={() => setVisibility("public")}
              className="flex-1"
            >
              <Globe className="w-4 h-4 mr-2" />
              Público
            </Button>
            <Button
              type="button"
              variant={visibility === "clan" ? "default" : "secondary"}
              size="sm"
              onClick={() => setVisibility("clan")}
              className="flex-1"
              disabled={!userClan}
            >
              <Users className="w-4 h-4 mr-2" />
              Só Clã
            </Button>
          </div>
        </div>

        {/* Post to Clan Toggle */}
        {userClan && visibility === "public" && (
          <div className="flex items-center justify-between py-2">
            <Label htmlFor="post-clan" className="text-sm">
              Mostrar também no feed do clã
            </Label>
            <Switch
              id="post-clan"
              checked={postToClan}
              onCheckedChange={setPostToClan}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1"
            onClick={handlePublish}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            Publicar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PublishPostModal;
