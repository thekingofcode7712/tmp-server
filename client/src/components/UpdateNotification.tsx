/**
 * Update Notification Component
 * Displays update notifications and handles auto-refresh
 */

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UpdateNotificationProps {
  currentVersion?: string;
}

export function UpdateNotification({ currentVersion }: UpdateNotificationProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [checkInterval, setCheckInterval] = useState<NodeJS.Timeout | null>(null);

  // Get current version from localStorage
  const getStoredVersion = () => {
    if (currentVersion) return currentVersion;
    return localStorage.getItem('appVersion') || 'unknown';
  };

  // Check for updates
  const checkForUpdates = async () => {
    try {
      const storedVersion = getStoredVersion();
      const response = await fetch('/api/trpc/version.getUpdateNotification?input=' + 
        encodeURIComponent(JSON.stringify({ clientVersion: storedVersion })));
      
      if (response.ok) {
        const data = await response.json();
        if (data.result?.data) {
          setUpdateInfo(data.result.data);
          setShowNotification(true);
        }
      }
    } catch (error) {
      console.error('[UpdateNotification] Failed to check for updates:', error);
    }
  };

  // Initialize update checking
  useEffect(() => {
    // Check immediately
    checkForUpdates();

    // Set up periodic checks (every 5 minutes)
    const interval = setInterval(checkForUpdates, 5 * 60 * 1000);
    setCheckInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleUpdate = () => {
    // Store new version
    if (updateInfo?.version) {
      localStorage.setItem('appVersion', updateInfo.version);
    }

    // Reload the page
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !updateInfo) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="p-4 bg-card border-border shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-card-foreground mb-1">
              {updateInfo.title || 'Update Available'}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {updateInfo.message || 'A new version is available.'}
            </p>

            {updateInfo.features && updateInfo.features.length > 0 && (
              <div className="mb-3 text-xs text-muted-foreground">
                <p className="font-medium mb-1">New Features:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {updateInfo.features.slice(0, 3).map((feature: string, idx: number) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}

            {updateInfo.breakingChanges && (
              <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                ⚠️ This update includes breaking changes. Please review carefully.
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-primary hover:bg-primary/90"
              >
                Update Now
              </Button>
              <Button
                onClick={handleDismiss}
                size="sm"
                variant="outline"
              >
                Later
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            ✕
          </button>
        </div>
      </Card>
    </div>
  );
}

export default UpdateNotification;
