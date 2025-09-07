'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import YouTube, { YouTubePlayer, YouTubeEvent } from 'react-youtube';
import { PoseLandmarkerResult, createPoseLandmarker } from '@/lib/mediapipe-config';
import { PoseLandmarker } from '@mediapipe/tasks-vision';
import { extractYouTubeId } from '@/lib/youtube-utils';

interface VideoPlayerProps {
  onPoseDetected?: (results: PoseLandmarkerResult) => void;
  showOverlay?: boolean;
  width?: number;
  height?: number;
  videoId?: string; // External video ID control
}

export default function VideoPlayer({
  onPoseDetected,
  showOverlay = true,
  width = 640,
  height = 360,
  videoId: externalVideoId
}: VideoPlayerProps) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const poseRef = useRef<PoseLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [videoUrl, setVideoUrl] = useState('');
  const [internalVideoId, setInternalVideoId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing] = useState(false);

  // Use external videoId if provided, otherwise use internal state
  const videoId = externalVideoId || internalVideoId;
  const isExternallyControlled = !!externalVideoId;

  // YouTube player options
  const playerOptions = {
    height: height.toString(),
    width: width.toString(),
    playerVars: {
      autoplay: 0,
      controls: 1,
      rel: 0,
      modestbranding: 1,
      iv_load_policy: 3,
      fs: 1,
      cc_load_policy: 0,
      disablekb: 0,
      origin: typeof window !== 'undefined' ? window.location.origin : ''
    }
  };

  // Initialize MediaPipe pose detection
  useEffect(() => {
    const initPose = async () => {
      try {
        const pose = await createPoseLandmarker();
        poseRef.current = pose;
      } catch (err) {
        console.error('Failed to initialize pose detection:', err);
        setError('Failed to initialize pose detection');
      }
    };

    initPose();

    return () => {
      if (poseRef.current) {
        poseRef.current.close();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onPoseDetected, showOverlay]);

  const captureVideoFrame = useCallback(async () => {
    if (!playerRef.current || !frameCanvasRef.current || !poseRef.current || !isPlaying) {
      return;
    }

    try {

      // Note: Due to CORS restrictions, we can't directly capture YouTube iframe content
      // This is a limitation of browser security. In a production app, you'd need to:
      // 1. Download the video (server-side)
      // 2. Use a video element instead of YouTube iframe
      // 3. Or use YouTube's thumbnail API to get periodic frames

      // For now, we'll simulate frame processing
      // In the actual implementation, you'd process actual video frames here

      console.log('Frame capture attempted - CORS limitation prevents direct iframe capture');

    } catch (err) {
      console.error('Frame capture error:', err);
    }

    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(captureVideoFrame);
    }
  }, [isPlaying]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setVideoUrl(url);

    if (url) {
      const id = extractYouTubeId(url);
      if (id) {
        setInternalVideoId(id);
        setError(null);
      } else {
        setError('Invalid YouTube URL. Please enter a valid YouTube video URL.');
        setInternalVideoId(null);
      }
    } else {
      setInternalVideoId(null);
      setError(null);
    }
  };

  const onPlayerReady = (event: YouTubeEvent) => {
    playerRef.current = event.target;
    setIsReady(true);
    setError(null);
  };

  const onPlayerStateChange = (event: YouTubeEvent) => {
    const playerState = event.data;
    const isCurrentlyPlaying = playerState === 1; // YT.PlayerState.PLAYING

    setIsPlaying(isCurrentlyPlaying);

    if (isCurrentlyPlaying) {
      // Start frame capture when video plays
      captureVideoFrame();
    } else {
      // Stop frame capture when video pauses/stops
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }
  };

  const onPlayerError = (event: YouTubeEvent) => {
    setError(`YouTube player error: ${event.data}`);
    setIsReady(false);
  };

  return (
    <div className="space-y-4">
      {/* YouTube URL Input - only show when not externally controlled */}
      {!isExternallyControlled && (
        <div className="flex gap-2">
          <input
            type="url"
            value={videoUrl}
            onChange={handleInputChange}
            placeholder="Paste YouTube dance video URL here..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          ❌ {error}
        </div>
      )}

      {/* Video Player Container */}
      <div className="relative">
        {videoId ? (
          <>
            {/* YouTube Player */}
            <YouTube
              videoId={videoId}
              opts={playerOptions}
              onReady={onPlayerReady}
              onStateChange={onPlayerStateChange}
              onError={onPlayerError}
              className="rounded-lg overflow-hidden shadow-lg"
            />

            {/* Pose Overlay Canvas */}
            {showOverlay && (
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                className="absolute top-0 left-0 pointer-events-none"
                style={{ width: `${width}px`, height: `${height}px` }}
              />
            )}

            {/* Hidden canvas for frame capture */}
            <canvas
              ref={frameCanvasRef}
              width={width}
              height={height}
              className="hidden"
            />

            {/* Status indicators */}
            <div className="absolute top-2 right-2 flex gap-2">
              {isReady && (
                <div className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                  📺 Ready
                </div>
              )}

              {isPlaying && (
                <div className="bg-blue-500 text-white px-2 py-1 rounded text-xs">
                  ▶️ Playing
                </div>
              )}

              {isProcessing && (
                <div className="bg-purple-500 text-white px-2 py-1 rounded text-xs">
                  🤖 Detecting
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-2">📺</div>
            <div className="text-gray-600">
              Enter a YouTube dance video URL above to get started
            </div>
          </div>
        )}
      </div>
    </div>
  );
}