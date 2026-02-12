import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { ArrowDown, ArrowUp, Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function formatBytes(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export function VpnBandwidthUsage() {
  const { data: dailyUsage } = trpc.vpn.getBandwidthUsage.useQuery(
    { period: "daily" },
    { refetchInterval: 10000 }
  );
  
  const { data: monthlyUsage } = trpc.vpn.getBandwidthUsage.useQuery(
    { period: "monthly" },
    { refetchInterval: 10000 }
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bandwidth Usage</CardTitle>
        <CardDescription>Track your VPN data consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="daily">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
          
          <TabsContent value="daily" className="space-y-4">
            {dailyUsage && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">
                      {formatBytes(dailyUsage.total)} / {formatBytes(dailyUsage.limit)}
                    </span>
                  </div>
                  <Progress value={dailyUsage.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {dailyUsage.percentage.toFixed(1)}% used
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ArrowDown className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Downloaded</p>
                      <p className="text-sm font-medium">{formatBytes(dailyUsage.downloaded)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uploaded</p>
                      <p className="text-sm font-medium">{formatBytes(dailyUsage.uploaded)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="monthly" className="space-y-4">
            {monthlyUsage && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Usage</span>
                    <span className="font-medium">
                      {formatBytes(monthlyUsage.total)} / {formatBytes(monthlyUsage.limit)}
                    </span>
                  </div>
                  <Progress value={monthlyUsage.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">
                    {monthlyUsage.percentage.toFixed(1)}% used
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ArrowDown className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Downloaded</p>
                      <p className="text-sm font-medium">{formatBytes(monthlyUsage.downloaded)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <ArrowUp className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uploaded</p>
                      <p className="text-sm font-medium">{formatBytes(monthlyUsage.uploaded)}</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
