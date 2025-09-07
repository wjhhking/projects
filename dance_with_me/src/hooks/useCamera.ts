import { useRef, useState, useCallback, useEffect } from 'react';

interface UseCameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

interface UseCameraReturn {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  isInitialized: boolean;
  error: string | null;
  initializeCamera: () => Promise<void>;
  stopCamera: () => void;
  retryCamera: () => void;
}

export function useCamera({
  width = 640,
  height = 480,
  facingMode = 'user'
}: UseCameraOptions = {}): UseCameraReturn {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeCamera = useCallback(async () => {
    try {
      setError(null);

      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: 30 },
          facingMode
        },
        audio: false
      });

      // Wait for video element to be ready
      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not ready');
      }

      // Set stream and wait for it to load
      videoRef.current.srcObject = stream;
      streamRef.current = stream;

      return new Promise<void>((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element lost'));
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().then(() => {
              setIsInitialized(true);
              resolve();
            }).catch(reject);
          }
        };

        videoRef.current.onerror = () => {
          reject(new Error('Video failed to load'));
        };
      });

    } catch (err) {
      console.error('Camera initialization failed:', err);
      setError(err instanceof Error ? err.message : 'Camera initialization failed');
      throw err;
    }
  }, [width, height, facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsInitialized(false);
  }, []);

  const retryCamera = useCallback(() => {
    stopCamera();
    setError(null);
    setTimeout(() => {
      initializeCamera();
    }, 100);
  }, [stopCamera, initializeCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    stream: streamRef.current,
    isInitialized,
    error,
    initializeCamera,
    stopCamera,
    retryCamera
  };
}