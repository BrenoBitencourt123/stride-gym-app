import { storage, ref, uploadBytes, getDownloadURL } from '@/services/firebase';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 400;

export async function uploadProfilePhoto(
  userId: string, 
  file: File
): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Arquivo deve ser uma imagem');
  }
  
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Arquivo muito grande (máximo 2MB)');
  }

  // Compress and resize image
  const compressed = await compressImage(file, MAX_DIMENSION, MAX_DIMENSION);
  
  // Generate unique filename with timestamp
  const timestamp = Date.now();
  const extension = file.type === 'image/png' ? 'png' : 'jpg';
  const storageRef = ref(storage, `avatars/${userId}/profile_${timestamp}.${extension}`);
  
  // Upload to Firebase Storage
  await uploadBytes(storageRef, compressed);
  
  // Return public URL
  return getDownloadURL(storageRef);
}

async function compressImage(
  file: File, 
  maxWidth: number, 
  maxHeight: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    img.onload = () => {
      let { width, height } = img;
      
      // Calculate new dimensions maintaining aspect ratio
      if (width > height) {
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }
      
      // Make it square (crop to center)
      const size = Math.min(width, height);
      canvas.width = size;
      canvas.height = size;
      
      // Calculate crop position (center)
      const sx = (img.width - img.width * (size / width)) / 2;
      const sy = (img.height - img.height * (size / height)) / 2;
      const sWidth = img.width * (size / width);
      const sHeight = img.height * (size / height);
      
      if (ctx) {
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erro ao processar imagem'));
            }
          },
          'image/jpeg',
          0.85 // Quality
        );
      } else {
        reject(new Error('Erro ao criar canvas'));
      }
    };
    
    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
}
