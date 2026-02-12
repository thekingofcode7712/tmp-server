import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Shield } from "lucide-react";

/**
 * Active ad blocker component that blocks ads in real-time
 * This component should be added to the root layout when ad blocker is enabled
 */
export function AdBlockerActive() {
  const [blockedCount, setBlockedCount] = useState(0);
  const { data: settings } = trpc.adBlocker.getSettings.useQuery();
  const { data: blockedDomains } = trpc.adBlocker.getBlockedDomains.useQuery();
  const incrementMutation = trpc.adBlocker.incrementBlocked.useMutation();

  useEffect(() => {
    if (!settings?.enabled || !blockedDomains) return;

    // Block scripts from known ad domains
    const blockAds = () => {
      const scripts = document.querySelectorAll('script[src]');
      let blocked = 0;

      scripts.forEach((script) => {
        const src = script.getAttribute('src');
        if (src && blockedDomains.domains.some(domain => src.includes(domain))) {
          script.remove();
          blocked++;
        }
      });

      // Block iframes from ad domains
      const iframes = document.querySelectorAll('iframe[src]');
      iframes.forEach((iframe) => {
        const src = iframe.getAttribute('src');
        if (src && blockedDomains.domains.some(domain => src.includes(domain))) {
          iframe.remove();
          blocked++;
        }
      });

      // Block images from ad domains
      const images = document.querySelectorAll('img[src]');
      images.forEach((img) => {
        const src = img.getAttribute('src');
        if (src && blockedDomains.domains.some(domain => src.includes(domain))) {
          img.remove();
          blocked++;
        }
      });

      if (blocked > 0) {
        setBlockedCount(prev => prev + blocked);
        incrementMutation.mutate({ count: blocked });
      }
    };

    // Run immediately
    blockAds();

    // Run on DOM changes
    const observer = new MutationObserver(blockAds);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Intercept fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const url = args[0]?.toString() || '';
      
      if (blockedDomains.domains.some(domain => url.includes(domain))) {
        setBlockedCount(prev => prev + 1);
        incrementMutation.mutate({ count: 1 });
        return Promise.reject(new Error('Blocked by ad blocker'));
      }
      
      return originalFetch.apply(this, args);
    };

    return () => {
      observer.disconnect();
      window.fetch = originalFetch;
    };
  }, [settings?.enabled, blockedDomains]);

  if (!settings?.enabled) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-3 flex items-center gap-2">
      <Shield className="h-4 w-4 text-green-500" />
      <span className="text-sm font-medium">
        {blockedCount} ads blocked
      </span>
    </div>
  );
}
