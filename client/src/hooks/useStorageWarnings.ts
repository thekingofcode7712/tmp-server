import { useEffect, useRef } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { notifyStorageWarning } from '@/lib/notifications';

export function useStorageWarnings() {
  const { user } = useAuth();
  const lastWarningRef = useRef<number>(0);

  useEffect(() => {
    if (!user) return;

    const storageUsed = user.storageUsed || 0;
    const storageLimit = user.storageLimit || 5368709120;
    const usedPercent = (storageUsed / storageLimit) * 100;

    // Only show warning once per session when crossing thresholds
    const now = Date.now();
    const timeSinceLastWarning = now - lastWarningRef.current;
    
    // Show warning max once every 10 minutes
    if (timeSinceLastWarning > 10 * 60 * 1000) {
      if (usedPercent >= 75) {
        notifyStorageWarning(usedPercent);
        lastWarningRef.current = now;
      }
    }
  }, [user?.storageUsed, user?.storageLimit]);
}
