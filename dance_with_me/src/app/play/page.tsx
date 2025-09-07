'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PoseLandmarkerResult } from '@/lib/mediapipe-config';
import WebcamCapture from '@/components/WebcamCapture';
import VideoPlayer from '@/components/VideoPlayer';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';

export default function PlayPage() {
  const router = useRouter();
  const [userPose, setUserPose] = useState<PoseLandmarkerResult | undefined>();
  const [poseCount, setPoseCount] = useState(0);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Dance With Me - Dance Session';

    // Check if prerequisites are met
    const youtubeValidated = localStorage.getItem('youtubeValidated') === 'true';
    const cameraValidated = localStorage.getItem('cameraValidated') === 'true';
    const savedVideoId = localStorage.getItem('selectedVideoId');

    if (!youtubeValidated || !cameraValidated) {
      // Redirect to main if prerequisites not met
      router.push('/');
      return;
    }

    if (savedVideoId) {
      setSelectedVideoId(savedVideoId);
    }
  }, [router]);

  const handleUserPoseDetected = (results: PoseLandmarkerResult) => {
    setUserPose(results);
    if (results.landmarks && results.landmarks.length > 0) {
      setPoseCount(prev => prev + 1);
    }
  };



  return (
    <AppLayout stepIndicator="🚀 Dancing!">
      <div className="space-y-6">
        {/* Video Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>🎵 Dance Video</CardTitle>
            </CardHeader>
            <VideoPlayer
              videoId={selectedVideoId || undefined}
              onPoseDetected={handleUserPoseDetected}
              showOverlay={true}
              width={560}
              height={315}
            />
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📹 Your Dance</CardTitle>
            </CardHeader>
            <WebcamCapture
              onPoseDetected={handleUserPoseDetected}
              showOverlay={true}
              width={560}
              height={315}
            />
          </Card>
        </section>

        {/* Stats Panel */}
        <Card>
          <CardHeader>
            <CardTitle>📊 Live Stats</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg text-center">
              <div className="text-sm text-blue-600 mb-1">Poses Detected</div>
              <div className="text-2xl font-bold text-blue-700">{poseCount}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-center">
              <div className="text-sm text-green-600 mb-1">Status</div>
              <div className="text-sm font-medium text-green-700">
                {userPose?.landmarks && userPose.landmarks.length > 0 ? '✅ Tracking' : '⏳ Waiting'}
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-sm text-purple-600 mb-1">Landmarks</div>
              <div className="text-sm font-medium text-purple-700">
                {userPose?.landmarks?.[0]?.length || 0}/33
              </div>
            </div>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}