import { useState } from "react";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { EloTier, getEloFrameStyles } from "@/lib/arena/eloUtils";
import { getAvatarById, AVATAR_OPTIONS } from "@/data/avatars";
import EditAvatarModal from "./EditAvatarModal";

interface UserAvatarProps {
  photoURL?: string;
  avatarId?: string;
  displayName: string;
  eloTier?: EloTier;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  editable?: boolean;
  onAvatarChange?: (photoURL: string, avatarId?: string) => Promise<void>;
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const editButtonSizeClasses = {
  xs: 'w-3 h-3 -bottom-0.5 -right-0.5',
  sm: 'w-4 h-4 -bottom-0.5 -right-0.5',
  md: 'w-5 h-5 -bottom-0.5 -right-0.5',
  lg: 'w-6 h-6 -bottom-1 -right-1',
  xl: 'w-7 h-7 -bottom-1 -right-1',
};

const UserAvatar = ({ 
  photoURL, 
  avatarId,
  displayName, 
  eloTier = 'iron',
  size = 'md',
  editable = false,
  onAvatarChange,
  className,
}: UserAvatarProps) => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const eloStyles = getEloFrameStyles(eloTier);
  
  // Check if using a pre-defined avatar
  const predefinedAvatar = avatarId ? getAvatarById(avatarId) : null;
  
  const handleSaveAvatar = async (newPhotoURL: string, newAvatarId?: string) => {
    if (onAvatarChange) {
      await onAvatarChange(newPhotoURL, newAvatarId);
    }
    setEditModalOpen(false);
  };

  const renderAvatarContent = () => {
    // If has uploaded photo URL (not a predefined avatar)
    if (photoURL && !avatarId) {
      return (
        <img 
          src={photoURL} 
          alt={displayName}
          className="w-full h-full object-cover rounded-full"
        />
      );
    }
    
    // If using a pre-defined avatar icon
    if (predefinedAvatar) {
      const IconComponent = predefinedAvatar.icon;
      return (
        <div 
          className={cn(
            "w-full h-full rounded-full flex items-center justify-center",
            sizeClasses[size]
          )}
          style={{ background: predefinedAvatar.bgGradient }}
        >
          <IconComponent className={cn("text-white", iconSizeClasses[size])} />
        </div>
      );
    }
    
    // Fallback: initial with Elo gradient
    return (
      <div 
        className={cn(
          "w-full h-full rounded-full flex items-center justify-center font-bold text-white",
          textSizeClasses[size]
        )}
        style={{ background: eloStyles.gradient }}
      >
        {displayName.charAt(0).toUpperCase()}
      </div>
    );
  };

  return (
    <>
      <div 
        className={cn(
          "relative rounded-full overflow-hidden",
          sizeClasses[size],
          editable && "cursor-pointer",
          className
        )}
        onClick={editable ? () => setEditModalOpen(true) : undefined}
      >
        {renderAvatarContent()}
        
        {editable && (
          <div 
            className={cn(
              "absolute bg-primary rounded-full flex items-center justify-center border-2 border-background",
              editButtonSizeClasses[size]
            )}
          >
            <Camera className="w-2/3 h-2/3 text-primary-foreground" />
          </div>
        )}
      </div>
      
      {editable && (
        <EditAvatarModal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          currentPhotoURL={photoURL}
          currentAvatarId={avatarId}
          onSave={handleSaveAvatar}
        />
      )}
    </>
  );
};

export default UserAvatar;
