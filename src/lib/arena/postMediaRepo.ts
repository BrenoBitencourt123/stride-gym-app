// src/lib/arena/postMediaRepo.ts
// Post media upload and management

import { storage, ref, uploadBytes, getDownloadURL } from '@/services/firebase';
import { PostMedia } from './types';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 1200; // Max width/height for post images
const QUALITY = 0.85;

/**
 * Upload an image for a post
 */
export async function uploadPostImage(
  userId: string,
  postId: string,
  file: File
): Promise<PostMedia> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo deve ser uma imagem');
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande (máximo 2MB)');
  }
  
  // Compress and resize
  const { blob, width, height } = await compressImage(file, MAX_DIMENSION);
  
  // Generate filename
  const timestamp = Date.now();
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const storagePath = `posts/${userId}/${postId}/${timestamp}.${extension}`;
  const storageRef = ref(storage, storagePath);
  
  // Upload
  await uploadBytes(storageRef, blob);
  
  // Get download URL
  const url = await getDownloadURL(storageRef);
  
  return {
    type: 'image',
    storagePath,
    url,
    width,
    height,
  };
}

/**
 * Compress and resize an image
 */
async function compressImage(
  file: File,
  maxDimension: number
): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({ blob, width, height });
            } else {
              reject(new Error('Erro ao processar imagem'));
            }
          },
          'image/jpeg',
          QUALITY
        );
      } else {
        reject(new Error('Erro ao criar canvas'));
      }
    };
    
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generate a temporary post ID for uploads
 */
export function generatePostId(): string {
  return `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file.type.startsWith('image/')) {
    return { valid: false, error: 'Arquivo deve ser uma imagem' };
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'Arquivo muito grande (máximo 2MB)' };
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Formato não suportado. Use JPG, PNG, WebP ou GIF' };
  }
  
  return { valid: true };
}
