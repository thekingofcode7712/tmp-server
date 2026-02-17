import { useEffect, useState } from 'react';

interface UpdateEvent extends Event {
  registration: ServiceWorkerRegistration;
}

export const useAppUpdate = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleServiceWorkerUpdate = (reg: ServiceWorkerRegistration) => {
      // Check for updates periodically
      const checkForUpdates = () => {
        reg.update().catch(err => console.log('Update check failed:', err));
      };

      // Check for updates every hour
      const interval = setInterval(checkForUpdates, 60 * 60 * 1000);

      // Listen for new service worker
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is ready
            setUpdateAvailable(true);
            setRegistration(reg);
            console.log('[App Update] New version available');
          }
        });
      });

      return () => clearInterval(interval);
    };

    navigator.serviceWorker.ready.then(handleServiceWorkerUpdate);
  }, []);

  const handleUpdate = () => {
    if (!registration?.waiting) return;

    // Tell the service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Reload the page once the new service worker is activated
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });

    setUpdateAvailable(false);
  };

  const handleDismiss = () => {
    setUpdateAvailable(false);
  };

  return {
    updateAvailable,
    handleUpdate,
    handleDismiss,
  };
};
