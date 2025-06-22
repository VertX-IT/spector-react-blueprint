import { storage, db } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';

// Upload profile picture to Firebase Storage with progress tracking
export const uploadProfilePicture = async (
  file: File, 
  userId: string, 
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Create a unique filename with timestamp
    const fileExtension = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `profile-pictures/${userId}/profile_${timestamp}.${fileExtension}`;
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
    // Use resumable upload for progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    // Track upload progress
    if (onProgress) {
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          throw error;
        }
      );
    }
    
    // Wait for upload to complete
    const snapshot = await uploadTask;
    
    // Get download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    // Update user document in Firestore with the new profile picture URL
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      profilePictureURL: downloadURL,
      profilePictureUpdatedAt: new Date().toISOString(),
    });
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw new Error('Failed to upload profile picture');
  }
};

// Delete profile picture from Firebase Storage
export const deleteProfilePicture = async (userId: string, currentProfilePictureURL?: string): Promise<void> => {
  try {
    // If there's a current profile picture, delete it from storage
    if (currentProfilePictureURL) {
      const storageRef = ref(storage, currentProfilePictureURL);
      await deleteObject(storageRef);
    }
    
    // Update user document to remove profile picture URL
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, {
      profilePictureURL: null,
      profilePictureUpdatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw new Error('Failed to delete profile picture');
  }
};

// Validate image file with improved validation
export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)'
    };
  }
  
  // Check file size (max 10MB for original, will be compressed)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file size must be less than 10MB'
    };
  }
  
  return { isValid: true };
};

// Optimized image compression with multiple quality levels and WebP support
export const compressImage = (
  file: File, 
  maxWidth: number = 300, 
  maxHeight: number = 300,
  quality: number = 0.85
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
        const newWidth = Math.round(img.width * ratio);
        const newHeight = Math.round(img.height * ratio);
        
        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;
        
        // Enable image smoothing for better quality
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
        }
        
        // Draw and compress image
        ctx?.drawImage(img, 0, 0, newWidth, newHeight);
        
        // Try WebP first, fallback to original format
        const tryWebP = () => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                  type: 'image/webp',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                // Fallback to original format
                canvas.toBlob(
                  (fallbackBlob) => {
                    if (fallbackBlob) {
                      const compressedFile = new File([fallbackBlob], file.name, {
                        type: file.type,
                        lastModified: Date.now(),
                      });
                      resolve(compressedFile);
                    } else {
                      reject(new Error('Failed to compress image'));
                    }
                  },
                  file.type,
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        };
        
        // Check if WebP is supported
        if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
          tryWebP();
        } else {
          // Fallback to original format
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            quality
          );
        }
      } catch (error) {
        reject(new Error('Failed to process image'));
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    
    // Create object URL and load image
    const objectURL = URL.createObjectURL(file);
    img.src = objectURL;
    
    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectURL);
      img.onload = null; // Prevent double execution
      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          const ratio = Math.min(maxWidth / img.width, maxHeight / img.height);
          const newWidth = Math.round(img.width * ratio);
          const newHeight = Math.round(img.height * ratio);
          
          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;
          
          // Enable image smoothing for better quality
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          }
          
          // Draw and compress image
          ctx?.drawImage(img, 0, 0, newWidth, newHeight);
          
          // Try WebP first, fallback to original format
          const tryWebP = () => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                    type: 'image/webp',
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  // Fallback to original format
                  canvas.toBlob(
                    (fallbackBlob) => {
                      if (fallbackBlob) {
                        const compressedFile = new File([fallbackBlob], file.name, {
                          type: file.type,
                          lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                      } else {
                        reject(new Error('Failed to compress image'));
                      }
                    },
                    file.type,
                    quality
                  );
                }
              },
              'image/webp',
              quality
            );
          };
          
          // Check if WebP is supported
          if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
            tryWebP();
          } else {
            // Fallback to original format
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const compressedFile = new File([blob], file.name, {
                    type: file.type,
                    lastModified: Date.now(),
                  });
                  resolve(compressedFile);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              file.type,
              quality
            );
          }
        } catch (error) {
          reject(new Error('Failed to process image'));
        }
      };
    };
  });
};

// Progressive image compression with multiple quality levels
export const compressImageProgressive = async (file: File): Promise<File> => {
  // Try different compression levels
  const compressionLevels = [
    { maxWidth: 200, maxHeight: 200, quality: 0.9 },
    { maxWidth: 300, maxHeight: 300, quality: 0.85 },
    { maxWidth: 400, maxHeight: 400, quality: 0.8 }
  ];
  
  for (const level of compressionLevels) {
    try {
      const compressed = await compressImage(file, level.maxWidth, level.maxHeight, level.quality);
      
      // Check if compressed size is reasonable (under 500KB)
      if (compressed.size < 500 * 1024) {
        return compressed;
      }
    } catch (error) {
      console.warn(`Compression level failed:`, level, error);
      continue;
    }
  }
  
  // If all compression levels fail, return original file
  return file;
}; 