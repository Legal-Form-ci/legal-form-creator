/**
 * Face detection utility for automatic face cropping in photos
 * Uses a simple canvas-based approach with face detection API
 */

interface FaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Detect face in an image and return cropped/centered version
 */
export async function detectAndCropFace(file: File): Promise<{ 
  croppedDataUrl: string; 
  originalDataUrl: string;
  faceDetected: boolean;
}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = async () => {
      const originalDataUrl = img.src;
      
      try {
        // Try to use browser's FaceDetector API if available
        if ('FaceDetector' in window) {
          const faceDetector = new (window as any).FaceDetector({ fastMode: true });
          const faces = await faceDetector.detect(img);
          
          if (faces.length > 0) {
            const face = faces[0].boundingBox;
            const croppedDataUrl = cropToFace(img, {
              x: face.x,
              y: face.y,
              width: face.width,
              height: face.height
            });
            resolve({ croppedDataUrl, originalDataUrl, faceDetected: true });
            return;
          }
        }
        
        // Fallback: Use simple center-based cropping with face estimation
        const croppedDataUrl = smartCrop(img);
        resolve({ croppedDataUrl, originalDataUrl, faceDetected: false });
        
      } catch (error) {
        console.warn('Face detection failed, using smart crop:', error);
        const croppedDataUrl = smartCrop(img);
        resolve({ croppedDataUrl, originalDataUrl, faceDetected: false });
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Crop image centered on detected face
 */
function cropToFace(img: HTMLImageElement, face: FaceBox): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  // Output size (square for profile photos)
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  // Calculate crop area centered on face with some padding
  const padding = 0.6; // 60% extra space around face
  const faceSize = Math.max(face.width, face.height);
  const cropSize = faceSize * (1 + padding);
  
  // Center the crop on the face
  const faceCenterX = face.x + face.width / 2;
  const faceCenterY = face.y + face.height / 2;
  
  // Adjust for face being typically in upper part of photo
  const cropX = Math.max(0, Math.min(img.width - cropSize, faceCenterX - cropSize / 2));
  const cropY = Math.max(0, Math.min(img.height - cropSize, faceCenterY - cropSize * 0.4));
  
  // Ensure we don't go outside image bounds
  const finalCropSize = Math.min(
    cropSize,
    img.width - cropX,
    img.height - cropY
  );
  
  // Draw cropped and scaled image
  ctx.drawImage(
    img,
    cropX, cropY, finalCropSize, finalCropSize,
    0, 0, outputSize, outputSize
  );
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Smart crop that assumes face is in upper-center portion of image
 * Common for portrait photos
 */
function smartCrop(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  
  const outputSize = 400;
  canvas.width = outputSize;
  canvas.height = outputSize;
  
  const imgRatio = img.width / img.height;
  
  let cropX = 0;
  let cropY = 0;
  let cropSize: number;
  
  if (imgRatio > 1) {
    // Landscape image - crop to center
    cropSize = img.height;
    cropX = (img.width - cropSize) / 2;
    cropY = 0;
  } else {
    // Portrait image - crop from top (where face usually is)
    cropSize = img.width;
    cropX = 0;
    cropY = 0; // Start from top to keep face
  }
  
  // Draw cropped and scaled image
  ctx.drawImage(
    img,
    cropX, cropY, cropSize, cropSize,
    0, 0, outputSize, outputSize
  );
  
  return canvas.toDataURL('image/jpeg', 0.9);
}

/**
 * Convert data URL to File object for upload
 */
export function dataURLtoFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}
