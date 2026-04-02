import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

export const useServiceWorker = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
    if (!('serviceWorker' in navigator)) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload();
            }
          });
        });
      } catch (_) {
        // registration failed silently
      }
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
    }
  }, []);
};

export const useInstallPrompt = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    let deferredPrompt: any;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;

      const installBanner = document.getElementById('install-banner');
      if (installBanner) {
        installBanner.style.display = 'block';
      }
    };

    const handleInstallClick = async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;

        const installBanner = document.getElementById('install-banner');
        if (installBanner) {
          installBanner.style.display = 'none';
        }
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    const installButton = document.getElementById('install-button');
    if (installButton) {
      installButton.addEventListener('click', handleInstallClick);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      if (installButton) {
        installButton.removeEventListener('click', handleInstallClick);
      }
    };
  }, []);
};
