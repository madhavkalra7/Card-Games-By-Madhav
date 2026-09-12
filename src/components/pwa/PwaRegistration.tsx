'use client';

import { useEffect } from 'react';

export const PwaRegistration: React.FC = () => {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            // Check for updates periodically
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    console.log('New Card Games update available.');
                  }
                };
              }
            };
          })
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      });
    }
  }, []);

  return null;
};
