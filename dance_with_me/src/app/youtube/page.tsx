'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { extractYouTubeId, isValidYouTubeUrl, DEFAULT_VIDEO_URL } from '@/lib/youtube-utils';
import AppLayout from '@/components/AppLayout';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function YouTubePage() {
  const router = useRouter();
  const [youtubeUrl, setYoutubeUrl] = useState(DEFAULT_VIDEO_URL);

  useEffect(() => {
    document.title = 'Dance With Me - Select Video';
  }, []);

  const handleYouTubeValidate = (url: string) => {
    const videoId = extractYouTubeId(url);
    if (videoId) {
      // Save to localStorage
      localStorage.setItem('selectedVideoId', videoId);
      localStorage.setItem('youtubeUrl', url);
      localStorage.setItem('youtubeValidated', 'true');

      router.push('/');
    }
  };

  const goToMain = () => router.push('/');

    return (
    <AppLayout stepIndicator="🎵 Step 1/2">
      <section className="max-w-2xl mx-auto">
        <Card className="p-8">
          <CardHeader>
            <CardTitle className="text-2xl text-center">🎵 Select YouTube Video</CardTitle>
          </CardHeader>

          <div className="space-y-6">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube URL
              </label>
              <input
                id="youtube-url"
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="Paste YouTube URL here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {youtubeUrl && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-blue-800 font-medium">Preview:</div>
                <div className="text-blue-700 text-sm break-all">{youtubeUrl}</div>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={() => handleYouTubeValidate(youtubeUrl)}
                disabled={!isValidYouTubeUrl(youtubeUrl)}
                variant="success"
                className="flex-1"
              >
                ✓ Validate & Continue
              </Button>
              <Button
                onClick={goToMain}
                variant="secondary"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </AppLayout>
  );
}