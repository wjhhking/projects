import { useRef, useCallback, useEffect } from 'react';
import { PoseLandmarkerResult } from '@/lib/mediapipe-config';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';

// Simple pose connections
const POSE_CONNECTIONS = [
  [11, 13], [13, 15], // Left arm
  [12, 14], [14, 16], // Right arm
  [11, 12], [11, 23], [12, 24], [23, 24], // Torso
  [23, 25], [25, 27], // Left leg
  [24, 26], [26, 28], // Right leg
];

interface UsePoseVisualizationOptions {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  width: number;
  height: number;
  showOverlay?: boolean;
}

export function usePoseVisualization({
  videoRef,
  width,
  height,
  showOverlay = true
}: UsePoseVisualizationOptions) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Simple video drawing loop
  const drawVideoFrame = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      animationRef.current = requestAnimationFrame(drawVideoFrame);
      return;
    }

    const ctx = canvasRef.current.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, width, height);
    }

    animationRef.current = requestAnimationFrame(drawVideoFrame);
  }, [width, height, videoRef]);

  // Draw pose results immediately
  const drawPoseResults = useCallback((results: PoseLandmarkerResult | null) => {
    if (!canvasRef.current || !showOverlay || !results?.landmarks?.[0]) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const landmarks = results.landmarks[0];

    // Draw skeleton
    ctx.strokeStyle = '#00FF00';
    ctx.lineWidth = 2;
    POSE_CONNECTIONS.forEach(([start, end]) => {
      if (landmarks[start] && landmarks[end]) {
        ctx.beginPath();
        ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height);
        ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height);
        ctx.stroke();
      }
    });

    // Draw points
    ctx.fillStyle = '#FF0000';
    landmarks.forEach((landmark: NormalizedLandmark) => {
      if (landmark.visibility > 0.5) {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    });
  }, [width, height, showOverlay]);

  // Start video loop
  useEffect(() => {
    drawVideoFrame();
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [drawVideoFrame]);

  // Set canvas size
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = width;
      canvasRef.current.height = height;
    }
  }, [width, height]);

  const clearCanvas = useCallback(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, width, height);
    }
  }, [width, height]);

  return {
    canvasRef,
    drawPoseResults,
    clearCanvas
  };
}