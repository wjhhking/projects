'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PoseLandmarkerResult } from '@/lib/mediapipe-config';
import WebcamCapture from '@/components/WebcamCapture';
import AppLayout from '@/components/AppLayout';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WebcamCaptureRef {
  activatePoseDetection: () => Promise<void>;
  deactivatePoseDetection: () => void;
  isPoseActive: boolean;
}

export default function CameraPage() {
  const router = useRouter();
  const [hasPose, setHasPose] = useState(false);
  const [landmarks, setLandmarks] = useState(0);
  const [isDetecting, setIsDetecting] = useState(false);
  const [isCameraReady, setCameraReady] = useState(false);
  const webcamRef = useRef<WebcamCaptureRef | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    document.title = 'Dance With Me - Camera Test';
  }, []);

  const handlePoseDetected = useCallback((results: PoseLandmarkerResult) => {
    const now = Date.now();
    if (now - lastUpdate.current > 500) { // Throttle updates
      setHasPose(results.landmarks && results.landmarks.length > 0);
      setLandmarks(results.landmarks?.[0]?.length || 0);
      lastUpdate.current = now;
    }
  }, []);

  const handleStart = async () => {
    if (webcamRef.current) {
      await webcamRef.current.activatePoseDetection();
      setIsDetecting(true);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('cameraValidated', 'true');
    router.push('/');
  };

  return (
    <AppLayout stepIndicator="📹 Step 2/2">
      <section className="max-w-3xl mx-auto">
        <Card className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">📹 Camera Test</h1>
            {isCameraReady && (
              <Button onClick={handleStart} variant="purple" disabled={isDetecting}>
                {isDetecting ? '🤖 Pose Detection Active' : '🤖 Start Pose Detection'}
              </Button>
            )}
          </div>

          <div className="space-y-6">
            <div className="relative flex justify-center">
              <WebcamCapture
                ref={webcamRef}
                onPoseDetected={handlePoseDetected}
                onCameraReady={() => setCameraReady(true)}
              />
            </div>

            {isDetecting && hasPose && (
              <div className="p-3 bg-green-50 text-center">
                <div className="text-green-800 font-medium">✅ Pose Detected!</div>
                <div className="text-green-700 text-sm">Found {landmarks}/33 landmarks</div>
              </div>
            )}

            <div className="flex justify-center">
              <Button
                onClick={handleContinue}
                variant={isCameraReady ? "success" : "secondary"}
                disabled={!isCameraReady}
              >
                {isCameraReady ? "✓ Continue" : "⏳ Verifying Camera..."}
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </AppLayout>
  );
}
