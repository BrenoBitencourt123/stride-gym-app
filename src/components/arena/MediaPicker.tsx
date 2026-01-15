// src/components/arena/MediaPicker.tsx
// Component for selecting and previewing media files

import { useState, useRef } from "react";
import { Camera, Image, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface MediaPickerProps {
  value: File[];
  onChange: (files: File[]) => void;
  maxFiles?: number;
  accept?: 'image' | 'video' | 'both';
  className?: string;
}

const MediaPicker = ({
  value,
  onChange,
  maxFiles = 4,
  accept = 'image',
  className = "",
}: MediaPickerProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [previews, setPreviews] = useState<string[]>([]);

  const getAcceptString = () => {
    switch (accept) {
      case 'image':
        return 'image/*';
      case 'video':
        return 'video/*';
      default:
        return 'image/*,video/*';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length + value.length > maxFiles) {
      toast.error(`Máximo ${maxFiles} arquivos permitidos`);
      return;
    }

    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        toast.error(`${file.name} é muito grande (máximo 10MB)`);
        return;
      }
    }

    // Create previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      newPreviews.push(url);
    });

    setPreviews([...previews, ...newPreviews]);
    onChange([...value, ...files]);
    
    // Reset input
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleRemove = (index: number) => {
    // Revoke object URL to prevent memory leak
    URL.revokeObjectURL(previews[index]);
    
    const newFiles = [...value];
    newFiles.splice(index, 1);
    
    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    
    setPreviews(newPreviews);
    onChange(newFiles);
  };

  const isVideo = (file: File) => file.type.startsWith('video/');

  return (
    <div className={className}>
      {/* Previews Grid */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-3">
          {value.map((file, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
              {isVideo(file) ? (
                <video
                  src={previews[index]}
                  className="w-full h-full object-cover"
                  muted
                />
              ) : (
                <img
                  src={previews[index]}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              
              {/* Remove button */}
              <button
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              
              {/* Video indicator */}
              {isVideo(file) && (
                <div className="absolute bottom-1 left-1 px-2 py-0.5 rounded bg-black/60 text-white text-xs">
                  Vídeo
                </div>
              )}
            </div>
          ))}
          
          {/* Add more button */}
          {value.length < maxFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-primary/50 hover:bg-secondary/50 transition-colors"
            >
              <Plus className="w-8 h-8 text-muted-foreground" />
            </button>
          )}
        </div>
      )}

      {/* Initial buttons */}
      {value.length === 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="w-4 h-4 mr-2" />
            Câmera
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Image className="w-4 h-4 mr-2" />
            Galeria
          </Button>
        </div>
      )}

      {/* Hidden inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptString()}
        onChange={handleFileSelect}
        multiple={maxFiles > 1}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept={getAcceptString()}
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default MediaPicker;
