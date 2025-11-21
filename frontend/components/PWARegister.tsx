'use client';

import { useEffect } from 'react';

export default function PWARegister() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // Register service worker
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
          // Check for updates every hour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Listen for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'installed' &&
                  navigator.serviceWorker.controller
                ) {
                  // New content available, show update notification
                  if (confirm('New version available! Reload to update?')) {
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch(() => {
          // Service Worker registration failed
        });

      // Handle offline/online events
      window.addEventListener('online', () => {
        // Trigger background sync if supported
        navigator.serviceWorker.ready.then((reg) => {
          if ('sync' in reg) {
            const syncReg = reg as ServiceWorkerRegistration & {
              sync: { register: (tag: string) => Promise<void> };
            };
            syncReg.sync.register('sync-saves').catch(() => {});
          }
        });
      });

      window.addEventListener('offline', () => {
        // User went offline
      });

      // Request notification permission for engagement
      if ('Notification' in window && Notification.permission === 'default') {
        // Don't request immediately, wait for user interaction
        const requestNotificationPermission = () => {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              console.log('Notification permission granted');
            }
          });
        };

        // Request after 30 seconds of engagement
        setTimeout(requestNotificationPermission, 30000);
      }
    }
  }, []);

  return null;
}
