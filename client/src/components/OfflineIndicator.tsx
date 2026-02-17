import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Wifi, WifiOff } from 'lucide-react';

export default function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-yellow-900 px-4 py-2 flex items-center gap-2 z-50 animate-in slide-in-from-top duration-300">
      <WifiOff className="h-4 w-4 flex-shrink-0" />
      <span className="text-sm font-medium">You're offline - Some features may be limited</span>
      <div className="ml-auto flex items-center gap-2">
        <div className="h-2 w-2 bg-yellow-900 rounded-full animate-pulse" />
      </div>
    </div>
  );
}
