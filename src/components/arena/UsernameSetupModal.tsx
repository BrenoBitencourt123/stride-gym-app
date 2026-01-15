// src/components/arena/UsernameSetupModal.tsx
// Modal for setting up username on first Arena visit

import { useState, useEffect } from "react";
import { Check, Loader2, X, AtSign } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUsernameSetup } from "@/hooks/useUsernameSetup";

interface UsernameSetupModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const UsernameSetupModal = ({ open, onOpenChange }: UsernameSetupModalProps) => {
  const [completed, setCompleted] = useState(false);
  const {
    username,
    setUsername,
    isValid,
    isAvailable,
    isChecking,
    error,
    submitUsername,
    submitting,
  } = useUsernameSetup();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await submitUsername();
    if (success) {
      setCompleted(true);
      onOpenChange?.(false);
    }
  };

  // Don't render if completed
  if (completed) return null;

  const getStatusIcon = () => {
    if (!username) return null;
    if (isChecking) return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    if (isAvailable === true) return <Check className="w-4 h-4 text-green-500" />;
    if (isAvailable === false) return <X className="w-4 h-4 text-destructive" />;
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AtSign className="w-5 h-5 text-primary" />
            Escolha seu username
          </DialogTitle>
          <DialogDescription>
            Seu username será único e usado para encontrar você na Arena.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                @
              </span>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="seu_username"
                className="pl-8 pr-10"
                autoComplete="off"
                autoFocus
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {getStatusIcon()}
              </span>
            </div>
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            
            {isAvailable === true && username && (
              <p className="text-sm text-green-500">Username disponível!</p>
            )}
            
            <p className="text-xs text-muted-foreground">
              3-20 caracteres. Apenas letras minúsculas, números e underscore (_).
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar username'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameSetupModal;
