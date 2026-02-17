import { Button } from '@/components/ui/button';
import { X, RefreshCw } from 'lucide-react';
import { useAppUpdate } from '@/hooks/useAppUpdate';

export default function AppUpdateNotification() {
  const { updateAvailable, handleUpdate, handleDismiss } = useAppUpdate();

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:max-w-sm bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg shadow-lg p-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <RefreshCw className="h-5 w-5 flex-shrink-0 mt-0.5 animate-spin" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1">App Update Available</h3>
          <p className="text-xs text-green-100 mb-3">
            A new version of TMP Server is ready. Update now to get the latest features and improvements.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={handleUpdate}
              className="bg-white text-green-600 hover:bg-green-50 h-8 text-xs"
            >
              Update Now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="text-white hover:bg-green-600 h-8 text-xs"
            >
              Later
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-green-100 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
