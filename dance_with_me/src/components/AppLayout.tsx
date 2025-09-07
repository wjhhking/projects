'use client';

import { useRouter } from 'next/navigation';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle?: React.ReactNode;
  stepIndicator?: string;
}

export default function AppLayout({
  children,
  pageTitle,
  stepIndicator
}: AppLayoutProps) {
  const router = useRouter();

  const goToMain = () => router.push('/');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 flex justify-between items-center">
            <button
              onClick={goToMain}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <h1 className="text-3xl font-bold text-gray-900">
                🕺 Dance With Me
              </h1>
              <p className="text-gray-600 mt-1">
                Real-time dance pose matching with AI-powered scoring
              </p>
            </button>
            {(pageTitle || stepIndicator) && (
              <div className="text-right">
                {pageTitle && (
                  <h2 className="text-xl font-semibold text-gray-800">{pageTitle}</h2>
                )}
                {stepIndicator && (
                  <span className="text-sm text-gray-500 block mt-1">{stepIndicator}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p>
              🚀 Powered by MediaPipe.js + Next.js |
              Built with ❤️ for dancers everywhere
            </p>
            <p className="mt-1">
              5-10x faster than desktop apps, accessible anywhere on the web
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}