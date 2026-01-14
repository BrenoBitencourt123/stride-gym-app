// Pre-defined avatar options using Lucide icons
import { 
  User, Sword, Shield, Flame, Dumbbell, 
  Zap, Target, Crown, Star, Trophy,
  Heart, Rocket, Mountain, Sun, Moon,
  Skull, Ghost, Cat, Dog, Bird
} from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface AvatarOption {
  id: string;
  name: string;
  icon: LucideIcon;
  category: 'warrior' | 'athlete' | 'animal' | 'abstract';
  bgGradient: string;
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  // Warriors
  { id: 'warrior-1', name: 'Guerreiro', icon: Sword, category: 'warrior', bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' },
  { id: 'warrior-2', name: 'Defensor', icon: Shield, category: 'warrior', bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' },
  { id: 'warrior-3', name: 'Fênix', icon: Flame, category: 'warrior', bgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  { id: 'warrior-4', name: 'Crânio', icon: Skull, category: 'warrior', bgGradient: 'linear-gradient(135deg, #374151 0%, #1f2937 100%)' },
  { id: 'warrior-5', name: 'Fantasma', icon: Ghost, category: 'warrior', bgGradient: 'linear-gradient(135deg, #a855f7 0%, #7c3aed 100%)' },
  
  // Athletes
  { id: 'athlete-1', name: 'Força', icon: Dumbbell, category: 'athlete', bgGradient: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' },
  { id: 'athlete-2', name: 'Energia', icon: Zap, category: 'athlete', bgGradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)' },
  { id: 'athlete-3', name: 'Foco', icon: Target, category: 'athlete', bgGradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' },
  { id: 'athlete-4', name: 'Campeão', icon: Trophy, category: 'athlete', bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
  { id: 'athlete-5', name: 'Foguete', icon: Rocket, category: 'athlete', bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' },
  
  // Animals
  { id: 'animal-1', name: 'Gato', icon: Cat, category: 'animal', bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' },
  { id: 'animal-2', name: 'Cão', icon: Dog, category: 'animal', bgGradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  { id: 'animal-3', name: 'Pássaro', icon: Bird, category: 'animal', bgGradient: 'linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)' },
  
  // Abstract
  { id: 'abstract-1', name: 'Coroa', icon: Crown, category: 'abstract', bgGradient: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' },
  { id: 'abstract-2', name: 'Estrela', icon: Star, category: 'abstract', bgGradient: 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)' },
  { id: 'abstract-3', name: 'Coração', icon: Heart, category: 'abstract', bgGradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' },
  { id: 'abstract-4', name: 'Montanha', icon: Mountain, category: 'abstract', bgGradient: 'linear-gradient(135deg, #64748b 0%, #475569 100%)' },
  { id: 'abstract-5', name: 'Sol', icon: Sun, category: 'abstract', bgGradient: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)' },
  { id: 'abstract-6', name: 'Lua', icon: Moon, category: 'abstract', bgGradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' },
  { id: 'abstract-7', name: 'Padrão', icon: User, category: 'abstract', bgGradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)' },
];

export const getAvatarById = (id: string): AvatarOption | undefined => {
  return AVATAR_OPTIONS.find(a => a.id === id);
};

export const getAvatarsByCategory = (category: AvatarOption['category']): AvatarOption[] => {
  return AVATAR_OPTIONS.filter(a => a.category === category);
};
