/**
 * Utility to compress an image file client-side and upload it to Cloudinary.
 */

export interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

// Detect configuration with a responsive mock fallback to allow trial runs.
export const getCloudinaryConfig = (): CloudinaryConfig => {
  const cloudName = (import.meta as any).env?.VITE_CLOUDINARY_CLOUD_NAME || '';
  const uploadPreset = (import.meta as any).env?.VITE_CLOUDINARY_UPLOAD_PRESET || '';
  return { cloudName, uploadPreset };
};

/**
 * Compresses an image file using HTML Canvas
 * @param file The source File object
 * @param maxWidth Max width of the output image
 * @param maxHeight Max height of the output image
 * @param quality Compression quality rating (from 0.0 to 1.0)
 */
export function compressImage(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.70
): Promise<{ blob: Blob; originalSize: number; compressedSize: number }> {
  return new Promise((resolve, reject) => {
    // Skip compression if not an image
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image.'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Aspect ratio handling
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

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to capture 2D canvas context for compression.'));
          return;
        }

        // Draw image keeping correct orientation bounds
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                blob,
                originalSize: file.size,
                compressedSize: blob.size,
              });
            } else {
              reject(new Error('Image canvas conversion to Blob yielded null.'));
            }
          },
          'image/jpeg', // Force compile format to standard Jpeg for better compression rates
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/**
 * Uploads a compressed image to Cloudinary (via unsigned preset endpoint)
 * @param file The original HTML input File object
 * @param onProgress Real-time progress update hook
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number, stats?: { originalSize: string; compressedSize: string; savings: string }) => void
): Promise<string> {
  const config = getCloudinaryConfig();
  
  // If no environment variables exist, throw a constructive configuration error that instructs the user.
  if (!config.cloudName || !config.uploadPreset) {
    throw new Error(
      `Variabel Cloudinary belum dikonfigurasi! Harap lengkapi file .env Anda:\nVITE_CLOUDINARY_CLOUD_NAME=...\nVITE_CLOUDINARY_UPLOAD_PRESET=...`
    );
  }

  // 1. Client-Side Compression
  const compression = await compressImage(file, 1200, 1200, 0.72);
  
  const originalSizeMB = (compression.originalSize / (1024 * 1024)).toFixed(2);
  const compressedSizeKB = (compression.compressedSize / 1024).toFixed(1);
  const savingsPct = Math.round((1 - compression.compressedSize / compression.originalSize) * 100);

  if (onProgress) {
    onProgress(15, {
      originalSize: `${originalSizeMB} MB`,
      compressedSize: `${compressedSizeKB} KB`,
      savings: `${savingsPct}%`
    });
  }

  // 2. Formulating request payload
  const formData = new FormData();
  formData.append('file', compression.blob, 'compressed_pesantren_image.jpg');
  formData.append('upload_preset', config.uploadPreset);

  const url = `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        // Range 15% to 98% during upload transfer, reserves 100% for completed response
        const progressPercent = Math.round((e.loaded / e.total) * 83) + 15;
        onProgress(progressPercent, {
          originalSize: `${originalSizeMB} MB`,
          compressedSize: `${compressedSizeKB} KB`,
          savings: `${savingsPct}%`
        });
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          const res = JSON.parse(xhr.responseText);
          if (res.secure_url) {
            if (onProgress) {
              onProgress(100, {
                originalSize: `${originalSizeMB} MB`,
                compressedSize: `${compressedSizeKB} KB`,
                savings: `${savingsPct}%`
              });
            }
            resolve(res.secure_url);
          } else {
            reject(new Error('Cloudinary response did not return a valid secure_url.'));
          }
        } catch (err) {
          reject(new Error('Failed to parse Cloudinary json response.'));
        }
      } else {
        try {
          const errorRes = JSON.parse(xhr.responseText);
          reject(new Error(errorRes.error?.message || `Upload failed with status code ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with status code ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network connectivity issue. Failed to connect to Cloudinary endpoint.'));
    };

    xhr.send(formData);
  });
}
