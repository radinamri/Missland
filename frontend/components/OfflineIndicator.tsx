'use client';

import { useEffect, useState } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  showNotification: boolean;
}

export default function OfflineIndicator() {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: true,
    showNotification: false,
  });

  useEffect(() => {
    const handleOnline = () => {
      setStatus({ isOnline: true, showNotification: true });
      setTimeout(() => {
        setStatus((prev) => ({ ...prev, showNotification: false }));
      }, 3000);
    };

    const handleOffline = () => {
      setStatus({ isOnline: false, showNotification: true });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial status
    setStatus({
      isOnline: navigator.onLine,
      showNotification: false,
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!status.showNotification) return null;

  return (
    <div
      className={`fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-full shadow-lg transition-all ${
        status.isOnline
          ? 'bg-green-500 text-white'
          : 'bg-gray-800 text-white'
      }`}
    >
      <div className="flex items-center gap-2">
        {status.isOnline ? (
          <>
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
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-sm font-medium">Back online</span>
          </>
        ) : (
          <>
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
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            <span className="text-sm font-medium">
              You&apos;re offline - Some features may be limited
            </span>
          </>
        )}
      </div>
    </div>
  );
}
