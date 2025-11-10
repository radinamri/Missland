// utils/imageProcessing.ts

/**
 * Compress an image blob to WebP format
 */
export async function compressToWebP(
  blob: Blob,
  quality = 0.75,
  maxWidth?: number,
  maxHeight?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Resize if max dimensions provided
      if (maxWidth && width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (maxHeight && height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/webp',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Convert blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove data URL prefix
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Failed to convert blob to base64'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Parse frame metadata from binary message
 */
export function parseFrameMetadata(arrayBuffer: ArrayBuffer): any {
  const headerBytes = new Uint8Array(arrayBuffer, 0, 1024);
  const decoder = new TextDecoder();
  const jsonStr = decoder.decode(headerBytes).replace(/\0+$/, ''); // Remove null padding
  return JSON.parse(jsonStr);
}

/**
 * Create binary message with metadata header
 */
export function createBinaryMessage(
  metadata: Record<string, any>,
  imageData: ArrayBuffer
): ArrayBuffer {
  const metadataStr = JSON.stringify(metadata);
  const encoder = new TextEncoder();
  const metadataBytes = encoder.encode(metadataStr);

  // Create 1024-byte header (padded with nulls)
  const header = new Uint8Array(1024);
  header.set(metadataBytes);

  // Combine header and image data
  const message = new Uint8Array(1024 + imageData.byteLength);
  message.set(header, 0);
  message.set(new Uint8Array(imageData), 1024);

  return message.buffer;
}

/**
 * Extract image data from binary message (after 1024-byte header)
 */
export function extractImageData(arrayBuffer: ArrayBuffer): ArrayBuffer {
  return arrayBuffer.slice(1024);
}

/**
 * Create object URL from array buffer
 */
export function arrayBufferToObjectURL(
  arrayBuffer: ArrayBuffer,
  mimeType = 'image/webp'
): string {
  const blob = new Blob([arrayBuffer], { type: mimeType });
  return URL.createObjectURL(blob);
}

/**
 * Get image dimensions from blob
 */
export async function getImageDimensions(
  blob: Blob
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Calculate bandwidth usage
 */
export function calculateBandwidth(
  frameSize: number,
  fps: number
): { bytesPerSecond: number; mbPerMinute: number } {
  const bytesPerSecond = frameSize * fps;
  const mbPerMinute = (bytesPerSecond * 60) / (1024 * 1024);
  return { bytesPerSecond, mbPerMinute };
}

/**
 * Quality preset configurations
 */
export const QUALITY_PRESETS = {
  low: {
    resolution: { width: 480, height: 640 },
    quality: 0.6,
    fps: 15,
  },
  balanced: {
    resolution: { width: 640, height: 480 },
    quality: 0.75,
    fps: 25,
  },
  high: {
    resolution: { width: 1280, height: 720 },
    quality: 0.85,
    fps: 30,
  },
} as const;

export type QualityPreset = keyof typeof QUALITY_PRESETS;
