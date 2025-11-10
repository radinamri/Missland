// hooks/useCameraStream.ts
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCameraStreamOptions {
  facingMode?: 'user' | 'environment';
  resolution?: {
    width: number;
    height: number;
  };
  frameRate?: number;
}

export interface CameraStats {
  active: boolean;
  facingMode: 'user' | 'environment';
  resolution: { width: number; height: number };
  actualFrameRate: number;
  permissionDenied: boolean;
  error?: string;
}

export function useCameraStream(options: UseCameraStreamOptions = {}) {
  const {
    facingMode = 'user',
    resolution = { width: 640, height: 480 },
    frameRate = 25,
  } = options;

  const [stats, setStats] = useState<CameraStats>({
    active: false,
    facingMode,
    resolution,
    actualFrameRate: 0,
    permissionDenied: false,
  });

  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsCheckRef = useRef(Date.now());

  // Initialize video element
  useEffect(() => {
    if (!videoRef.current) {
      const video = document.createElement('video');
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      videoRef.current = video;
    }
  }, []);

  const getStream = useCallback(async () => {
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: resolution.width },
          height: { ideal: resolution.height },
          frameRate: { ideal: frameRate },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Get actual resolution
      const videoTrack = stream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      setStats({
        active: true,
        facingMode: settings.facingMode as 'user' | 'environment',
        resolution: {
          width: settings.width || resolution.width,
          height: settings.height || resolution.height,
        },
        actualFrameRate: settings.frameRate || frameRate,
        permissionDenied: false,
      });

      console.log('[Camera] Stream started:', settings);
    } catch (error: any) {
      console.error('[Camera] Failed to get stream:', error);
      
      const permissionDenied = error.name === 'NotAllowedError' || 
                               error.name === 'PermissionDeniedError';
      
      setStats((prev) => ({
        ...prev,
        active: false,
        permissionDenied,
        error: error.message,
      }));
    }
  }, [facingMode, resolution, frameRate]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStats((prev) => ({
      ...prev,
      active: false,
    }));

    console.log('[Camera] Stream stopped');
  }, []);

  const switchCamera = useCallback(async () => {
    stopStream();
    const newFacingMode = stats.facingMode === 'user' ? 'environment' : 'user';
    
    setStats((prev) => ({
      ...prev,
      facingMode: newFacingMode,
    }));

    // Re-initialize with new facing mode
    await getStream();
  }, [stats.facingMode, stopStream, getStream]);

  const captureFrame = useCallback(
    async (format: 'webp' | 'jpeg' = 'webp', quality = 0.75): Promise<Blob | null> => {
      if (!videoRef.current || !stats.active) {
        console.warn('[Camera] Cannot capture: stream not active');
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.width = stats.resolution.width;
      canvas.height = stats.resolution.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      return new Promise((resolve) => {
        canvas.toBlob(
          (blob) => {
            // Update FPS counter
            frameCountRef.current++;
            const now = Date.now();
            if (now - lastFpsCheckRef.current >= 1000) {
              const fps = frameCountRef.current;
              frameCountRef.current = 0;
              lastFpsCheckRef.current = now;
              
              setStats((prev) => ({
                ...prev,
                actualFrameRate: fps,
              }));
            }

            resolve(blob);
          },
          `image/${format}`,
          quality
        );
      });
    },
    [stats.active, stats.resolution]
  );

  // Request wake lock to prevent screen from sleeping
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && stats.active) {
        try {
          wakeLock = await (navigator as any).wakeLock.request('screen');
          console.log('[Camera] Wake lock acquired');
        } catch (error) {
          console.warn('[Camera] Wake lock failed:', error);
        }
      }
    };

    requestWakeLock();

    return () => {
      if (wakeLock) {
        wakeLock.release();
        console.log('[Camera] Wake lock released');
      }
    };
  }, [stats.active]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  return {
    getStream,
    stopStream,
    switchCamera,
    captureFrame,
    videoElement: videoRef.current,
    stats,
  };
}
