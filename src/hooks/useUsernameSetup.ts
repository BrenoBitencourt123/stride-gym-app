// src/hooks/useUsernameSetup.ts
// Hook for username setup flow

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as socialRepo from '@/lib/arena/socialRepo';
import { getArenaProfile } from '@/lib/arena/arenaFirestore';

interface UseUsernameSetupResult {
  needsUsername: boolean;
  loading: boolean;
  username: string;
  setUsername: (value: string) => void;
  isValid: boolean;
  isAvailable: boolean | null;
  isChecking: boolean;
  error: string | null;
  submitUsername: () => Promise<boolean>;
  submitting: boolean;
}

// Validate username format
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username) {
    return { valid: false, error: undefined };
  }
  
  if (username.length < 3) {
    return { valid: false, error: 'Mínimo 3 caracteres' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Máximo 20 caracteres' };
  }
  
  if (!/^[a-z0-9_]+$/.test(username.toLowerCase())) {
    return { valid: false, error: 'Apenas letras, números e _' };
  }
  
  return { valid: true };
}

export function useUsernameSetup(): UseUsernameSetupResult {
  const { user } = useAuth();
  const [needsUsername, setNeedsUsername] = useState(false);
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState<string | undefined>();
  const [avatarId, setAvatarId] = useState<string | undefined>();

  // Check if user needs to set up username
  useEffect(() => {
    const checkUsername = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        const hasUser = await socialRepo.hasUsername(user.uid);
        setNeedsUsername(!hasUser);
        
        // Get display name for profile creation
        const profile = await getArenaProfile(user.uid);
        if (profile) {
          setDisplayName(profile.displayName || user.displayName || 'Atleta');
          setPhotoURL(profile.photoURL);
          setAvatarId(profile.avatarId);
        } else {
          setDisplayName(user.displayName || 'Atleta');
        }
      } catch (err) {
        console.error('Error checking username:', err);
        setNeedsUsername(true);
      } finally {
        setLoading(false);
      }
    };
    
    checkUsername();
  }, [user]);

  // Validate and check availability (debounced)
  useEffect(() => {
    const validation = validateUsername(username);
    
    if (!validation.valid) {
      setError(validation.error || null);
      setIsAvailable(null);
      return;
    }
    
    setError(null);
    setIsChecking(true);
    
    const timer = setTimeout(async () => {
      try {
        const available = await socialRepo.isUsernameAvailable(username.toLowerCase());
        setIsAvailable(available);
        if (!available) {
          setError('Este username já está em uso');
        }
      } catch (err) {
        console.error('Error checking availability:', err);
        setIsAvailable(null);
      } finally {
        setIsChecking(false);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [username]);

  const isValid = validateUsername(username).valid && isAvailable === true;

  const submitUsername = useCallback(async (): Promise<boolean> => {
    if (!user || !isValid) return false;
    
    setSubmitting(true);
    setError(null);
    
    try {
      // Get current arena profile for elo
      const arenaProfile = await getArenaProfile(user.uid);
      
      await socialRepo.initializePublicProfile(
        user.uid,
        username.toLowerCase(),
        displayName,
        photoURL,
        avatarId,
        arenaProfile?.elo
      );
      
      setNeedsUsername(false);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar username');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [user, username, displayName, photoURL, avatarId, isValid]);

  return {
    needsUsername,
    loading,
    username,
    setUsername,
    isValid,
    isAvailable,
    isChecking,
    error,
    submitUsername,
    submitting,
  };
}
