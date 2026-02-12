import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

export function AlertHistory() {
  const { isAuthenticated } = useAuth();
  
  const { data: history = [], isLoading } = trpc.alertPreferences.getHistory.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const getAlertIcon = (alertType: string) => {
    if (alertType === 'storage_95') return <AlertCircle className="h-4 w-4 text-red-500" />;
    if (alertType === 'storage_80') return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    if (alertType === 'ai_credits_low') return <Info className="h-4 w-4 text-blue-500" />;
    return <Info className="h-4 w-4 text-muted-foreground" />;
  };

  const getAlertTitle = (alertType: string) => {
    if (alertType === 'storage_95') return 'Storage Critical (95%)';
    if (alertType === 'storage_80') return 'Storage Warning (80%)';
    if (alertType === 'ai_credits_low') return 'AI Credits Low';
    return alertType;
  };

  const formatMetadata = (metadata: any) => {
    if (!metadata) return '';
    if (metadata.storagePercent) return `${metadata.storagePercent.toFixed(1)}% used`;
    if (metadata.aiCredits) return `${metadata.aiCredits} credits remaining`;
    return '';
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading alert history...</div>;
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        No alert history yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((alert: any) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
        >
          <div className="mt-0.5">{getAlertIcon(alert.alertType)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{getAlertTitle(alert.alertType)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {formatMetadata(alert.metadata)}
                </p>
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {new Date(alert.sentAt).toLocaleDateString()} {new Date(alert.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
