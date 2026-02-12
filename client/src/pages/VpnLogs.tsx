import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft, Download, Clock, HardDrive, MapPin } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

export default function VpnLogs() {
  const [limit] = useState(50);
  const [offset, setOffset] = useState(0);
  
  const { data: logs, isLoading } = trpc.vpn.getConnectionLogs.useQuery({ limit, offset });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return 'Active';
    const duration = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  const exportLogs = () => {
    if (!logs || logs.length === 0) {
      toast.error("No logs to export");
      return;
    }

    const csv = [
      ['Date', 'Server', 'Protocol', 'Duration', 'Uploaded', 'Downloaded', 'Total'].join(','),
      ...logs.map(log => [
        new Date(log.connectedAt).toLocaleString(),
        log.server,
        log.protocol,
        formatDuration(log.connectedAt, log.disconnectedAt),
        formatBytes(log.bytesUploaded || 0),
        formatBytes(log.bytesDownloaded || 0),
        formatBytes(log.bytesTransferred || 0),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vpn-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success("Logs exported successfully");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/vpn">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">VPN Connection Logs</h1>
            <p className="text-muted-foreground">View your VPN connection history and data usage</p>
          </div>
          <Button onClick={exportLogs} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connection History</CardTitle>
            <CardDescription>
              {logs?.length || 0} connections recorded
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading logs...
              </div>
            ) : !logs || logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No connection logs yet
              </div>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.server}</span>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                            {log.protocol}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.connectedAt).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {formatDuration(log.connectedAt, log.disconnectedAt)}
                        </div>
                        <div className="text-xs text-muted-foreground">Duration</div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <HardDrive className="h-3 w-3" />
                          {formatBytes(log.bytesTransferred || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ↑ {formatBytes(log.bytesUploaded || 0)} / ↓ {formatBytes(log.bytesDownloaded || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {logs && logs.length >= limit && (
              <div className="flex justify-center gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setOffset(offset + limit)}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
