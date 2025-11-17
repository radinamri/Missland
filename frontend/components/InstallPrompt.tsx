'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const INSTALL_PROMPT_STORAGE_KEY = 'missland-pwa-prompt-interacted';
const SHOW_DELAY_MS = 30000; // Show after 30 seconds of app usage

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if user has already interacted with the install prompt
  const hasUserInteracted = () => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(INSTALL_PROMPT_STORAGE_KEY) === 'true';
  };

  // Check if app is already installed (different on iOS vs Android/Desktop)
  const isAppInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return true;
    }
    
    // Check if iOS standalone mode
    if ((navigator as any).standalone === true) {
      return true;
    }
    
    return false;
  };

  useEffect(() => {
    // Don't show if user already interacted or app is installed
    if (hasUserInteracted() || isAppInstalled()) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after user has engaged with the app
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, SHOW_DELAY_MS);

      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User installed Missland PWA');
      } else {
        console.log('User declined install');
      }
    } catch (error) {
      console.error('Install prompt error:', error);
    } finally {
      // Mark interaction regardless of outcome
      markPromptInteraction();
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Mark that user has dismissed the prompt - never show again
    markPromptInteraction();
    setDeferredPrompt(null);
  };

  const markPromptInteraction = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(INSTALL_PROMPT_STORAGE_KEY, 'true');
    }
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-[#D98B99]/20 p-6 animate-slide-up backdrop-blur-sm">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss install prompt"
          title="Don't show again"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#D98B99] to-[#E8A5B4] rounded-2xl flex items-center justify-center shadow-lg">
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-[#3D5A6C] text-lg mb-1">
              Install Missland
            </h3>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Get the app for faster access, offline browsing, and a seamless experience right from your home screen.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-[#3D5A6C] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#314A5A] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                Install Now
              </button>
              <button
                onClick={handleDismiss}
                className="px-5 py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors"
                title="Don't show again"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
