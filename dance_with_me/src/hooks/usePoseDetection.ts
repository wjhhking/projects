import { useRef, useState, useCallback, useEffect } from 'react';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { PoseLandmarkerResult, createPoseLandmarker } from '@/lib/mediapipe-config';

interface UsePoseDetectionOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onPoseDetected?: (results: PoseLandmarkerResult) => void;
}

interface UsePoseDetectionReturn {
  poseLandmarker: PoseLandmarker | null;
  isActive: boolean;
  isDetecting: boolean;
  error: string | null;
  activate: () => Promise<void>;
  deactivate: () => void;
  latestPoseResults: PoseLandmarkerResult | null;
}

export function usePoseDetection({
  videoRef,
  onPoseDetected
}: UsePoseDetectionOptions): UsePoseDetectionReturn {
  const poseRef = useRef<PoseLandmarker | null>(null);
  const animationRef = useRef<number | null>(null);
  const latestResultsRef = useRef<PoseLandmarkerResult | null>(null);
  const isActiveRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  const [isActive, setIsActive] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFrame = useCallback(() => {
    if (!poseRef.current || !videoRef.current || !isActiveRef.current) {
      if (isActiveRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    // Skip if already processing to avoid overlapping calls
    if (isProcessingRef.current) {
      if (isActiveRef.current) {
        animationRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    isProcessingRef.current = true;

    try {
      // Perform pose detection using MediaPipe
      const videoElement = videoRef.current;
      const timestamp = performance.now();
      const results = poseRef.current.detectForVideo(videoElement, timestamp);

      if (results && isActiveRef.current) {
        latestResultsRef.current = results;
        const hasPose = results.landmarks && results.landmarks.length > 0;
        setIsDetecting(hasPose);

        if (onPoseDetected) {
          onPoseDetected(results);
        }
      }
    } catch (err: unknown) {
      console.error('Pose detection error:', err);
    } finally {
      isProcessingRef.current = false;
    }

    // Continue the loop
    if (isActiveRef.current) {
      animationRef.current = requestAnimationFrame(processFrame);
    }
  }, [onPoseDetected, videoRef]);

  const activate = useCallback(async () => {
    try {
      setError(null);

      // Create MediaPipe Pose Landmarker
      const pose = await createPoseLandmarker();

      poseRef.current = pose;
      isActiveRef.current = true;
      setIsActive(true);

      // Start processing frames
      processFrame();

    } catch (err: unknown) {
      console.error('Pose detection failed:', err);
      setError(err instanceof Error ? err.message : 'Pose detection failed');
    }
  }, [processFrame]);

  const deactivate = useCallback(() => {
    isActiveRef.current = false;
    setIsActive(false);
    setIsDetecting(false);
    latestResultsRef.current = null;
    isProcessingRef.current = false;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    poseRef.current = null;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      deactivate();
    };
  }, [deactivate]);

  return {
    poseLandmarker: poseRef.current,
    isActive,
    isDetecting,
    error,
    activate,
    deactivate,
    latestPoseResults: latestResultsRef.current
  };
}