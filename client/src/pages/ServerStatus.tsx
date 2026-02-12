import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Activity, Cpu, HardDrive, Network, Users, Clock, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

export default function ServerStatus() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const { data: status, refetch, isLoading } = trpc.system.getServerStatus.useQuery(undefined, {
    refetchInterval: autoRefresh ? 5000 : false, // Refresh every 5 seconds if enabled
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Server Status</h1>
            <p className="text-muted-foreground">Real-time server analytics and metrics</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              onClick={() => setAutoRefresh(!autoRefresh)}
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </Button>
            <Button onClick={() => refetch()} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Now
            </Button>
          </div>
        </div>

        {isLoading && !status ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading server status...</p>
          </div>
        ) : status ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* CPU Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                <Cpu className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.cpu.usage.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  {status.cpu.cores} cores available
                </p>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(status.cpu.usage, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Memory Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((status.memory.used / status.memory.total) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(status.memory.used)} / {formatBytes(status.memory.total)}
                </p>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(status.memory.used / status.memory.total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Disk Usage */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
                <HardDrive className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((status.disk.used / status.disk.total) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatBytes(status.disk.used)} / {formatBytes(status.disk.total)}
                </p>
                <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${(status.disk.used / status.disk.total) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Network Traffic */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network Traffic</CardTitle>
                <Network className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">↓ Download</span>
                    <span className="text-sm font-medium">{formatBytes(status.network.rx)}/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">↑ Upload</span>
                    <span className="text-sm font-medium">{formatBytes(status.network.tx)}/s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Connections */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{status.connections.active}</div>
                <p className="text-xs text-muted-foreground">
                  {status.connections.total} total connections
                </p>
              </CardContent>
            </Card>

            {/* Uptime */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server Uptime</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatUptime(status.uptime)}</div>
                <p className="text-xs text-muted-foreground">
                  Since {new Date(Date.now() - status.uptime * 1000).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load server status</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
