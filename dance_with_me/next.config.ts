import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Enable WebAssembly support for MediaPipe
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: any) => {
    config.experiments = {
      asyncWebAssembly: true,
      layers: true,
    };

    // Handle MediaPipe files
    config.module.rules.push({
      test: /\.(wasm|tflite)$/,
      type: 'asset/resource',
    });

    // Fix for MediaPipe in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };

    return config;
  },

  // Headers for MediaPipe WASM loading
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Image domains for YouTube thumbnails
  images: {
    domains: ['img.youtube.com', 'i.ytimg.com'],
  },
};

export default nextConfig;
