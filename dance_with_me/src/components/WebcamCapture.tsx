'use client';

import { useEffect, forwardRef, useImperativeHandle } from 'react';
import { PoseLandmarkerResult } from '@/lib/mediapipe-config';
import { useCamera } from '@/hooks/useCamera';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { usePoseVisualization } from '@/hooks/usePoseVisualization';

interface WebcamCaptureProps {
  onPoseDetected?: (results: PoseLandmarkerResult) => void;
  showOverlay?: boolean;
  width?: number;
  height?: number;
  onCameraReady?: () => void;
}

interface WebcamCaptureRef {
  activatePoseDetection: () => Promise<void>;
  deactivatePoseDetection: () => void;
  isPoseActive: boolean;
}

const WebcamCapture = forwardRef<WebcamCaptureRef, WebcamCaptureProps>(({
  onPoseDetected,
  showOverlay = true,
  width = 640,
  height = 480,
  onCameraReady
}, ref) => {


  const {
    videoRef,
    isInitialized: isCameraReady,
    error: cameraError,
    initializeCamera,
    retryCamera
  } = useCamera({ width, height });

  const { canvasRef, drawPoseResults } = usePoseVisualization({
    videoRef,
    width,
    height,
    showOverlay
  });

  const handlePoseDetection = (results: PoseLandmarkerResult) => {
    drawPoseResults(results);
    if (onPoseDetected) {
      onPoseDetected(results);
    }
  };

  const {
    activate,
    deactivate,
    isDetecting: isPoseActive,
    error: poseError,
  } = usePoseDetection({
    videoRef,
    onPoseDetected: handlePoseDetection,
  });

  useEffect(() => {
    initializeCamera();
  }, [initializeCamera]);

  useEffect(() => {
    if (isCameraReady && onCameraReady) {
      onCameraReady();
    }
  }, [isCameraReady, onCameraReady]);

  useImperativeHandle(ref, () => ({
    activatePoseDetection: activate,
    deactivatePoseDetection: deactivate,
    isPoseActive
  }), [activate, deactivate, isPoseActive]);

  const error = cameraError || poseError;

  const handleRetry = () => {
    if (cameraError) retryCamera();
    if (poseError) activate();
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        className="absolute opacity-0 pointer-events-none"
        playsInline
        muted
        autoPlay
        width={width}
        height={height}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="border border-gray-300 rounded-lg shadow-lg"
        style={{ transform: 'scaleX(-1)' }}
      />
      {isPoseActive && (
        <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded text-xs">
          👤 Pose Active
        </div>
      )}
      {error && (
        <div className="absolute inset-0 bg-red-100 border border-red-400 rounded-lg p-4 text-center">
          <div className="text-red-700 font-medium mb-2">
            ❌ {cameraError ? 'Camera Error' : 'Pose Error'}
          </div>
          <div className="text-red-600 text-sm mb-3">{error}</div>
          <button
            onClick={handleRetry}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry
          </button>
        </div>
      )}
      {!isCameraReady && !error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-2xl mb-2">🔄</div>
            <div>Initializing camera...</div>
          </div>
        </div>
      )}
    </div>
  );
});

WebcamCapture.displayName = 'WebcamCapture';
export default WebcamCapture;