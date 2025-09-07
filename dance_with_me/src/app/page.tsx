'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { extractYouTubeId, DEFAULT_VIDEO_URL } from '@/lib/youtube-utils';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/Button';

interface StepButtonProps {
  onClick: () => void;
  validated: boolean;
  title: string;
  description: string;
  stepNumber: string;
  disabled?: boolean;
}

function StepButton({ onClick, validated, title, description, stepNumber, disabled = false }: StepButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-6 rounded-lg border-2 text-left transition-colors ${
        disabled
          ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
          : validated
            ? 'border-green-200 bg-green-50 hover:bg-green-100'
            : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          disabled
            ? 'bg-gray-300 text-gray-600'
            : validated
              ? 'bg-green-500 text-white'
              : 'bg-blue-500 text-white'
        }`}>
          {validated ? '✓' : stepNumber}
        </div>
      </div>
    </button>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [youtubeValidated, setYoutubeValidated] = useState(false);
  const [cameraValidated, setCameraValidated] = useState(false);

  useEffect(() => {
    document.title = 'Dance With Me - Setup';

    const savedYoutubeValidated = localStorage.getItem('youtubeValidated') === 'true';
    const savedCameraValidated = localStorage.getItem('cameraValidated') === 'true';

    setYoutubeValidated(savedYoutubeValidated);
    setCameraValidated(savedCameraValidated);

    // Set default video if no saved state
    if (!savedYoutubeValidated) {
      const defaultVideoId = extractYouTubeId(DEFAULT_VIDEO_URL);
      if (defaultVideoId) {
        localStorage.setItem('youtubeValidated', 'true');
        localStorage.setItem('selectedVideoId', defaultVideoId);
        localStorage.setItem('youtubeUrl', DEFAULT_VIDEO_URL);
        setYoutubeValidated(true);
      }
    }
  }, []);

  const resetProgress = () => {
    localStorage.clear();
    setYoutubeValidated(false);
    setCameraValidated(false);

    // Reset default video
    const defaultVideoId = extractYouTubeId(DEFAULT_VIDEO_URL);
    if (defaultVideoId) {
      localStorage.setItem('youtubeValidated', 'true');
      localStorage.setItem('selectedVideoId', defaultVideoId);
      localStorage.setItem('youtubeUrl', DEFAULT_VIDEO_URL);
      setYoutubeValidated(true);
    }
  };

  const canPlay = youtubeValidated && cameraValidated;

    return (
    <AppLayout
      pageTitle={
        (youtubeValidated || cameraValidated) ? (
          <Button variant="gray" size="sm" onClick={resetProgress}>
            🔄 Reset Progress
          </Button>
        ) : undefined
      }
    >
      <section className="max-w-lg mx-auto">
        <article className="bg-white rounded-lg shadow-lg p-8">
          <header className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">🎯 Dance Setup</h2>
          </header>

          <div className="space-y-4">
            <StepButton
              onClick={() => router.push('/youtube')}
              validated={youtubeValidated}
              title="🎵 Select YouTube Video"
              description={youtubeValidated ? 'Default video selected ✓' : 'Choose a dance video to follow'}
              stepNumber="1"
            />

            <StepButton
              onClick={() => router.push('/camera')}
              validated={cameraValidated}
              title="📹 Test Camera"
              description={cameraValidated ? 'Camera tested ✓' : 'Verify your camera works'}
              stepNumber="2"
            />

            <StepButton
              onClick={() => router.push('/play')}
              validated={canPlay}
              title="🚀 Play Now"
              description={canPlay ? 'Ready to start dancing!' : 'Complete steps 1 & 2 first'}
              stepNumber="3"
              disabled={!canPlay}
            />
          </div>
        </article>
      </section>
    </AppLayout>
  );
}
