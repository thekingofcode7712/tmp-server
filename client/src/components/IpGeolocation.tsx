import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, MapPin, Wifi, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";

interface IpGeolocationProps {
  selectedServer?: string;
  isConnected: boolean;
}

export function IpGeolocation({ selectedServer, isConnected }: IpGeolocationProps) {
  const [refreshing, setRefreshing] = useState(false);
  
  const { data: myIp, refetch: refetchMyIp, isLoading: loadingMyIp } = trpc.vpn.getMyIp.useQuery();
  
  const { data: proxyIp, refetch: refetchProxyIp, isLoading: loadingProxyIp } = trpc.vpn.getProxyIp.useQuery(
    { server: selectedServer || 'us-east' },
    { enabled: isConnected && !!selectedServer }
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchMyIp();
      if (isConnected) {
        await refetchProxyIp();
      }
      toast.success("IP information refreshed");
    } catch (error) {
      toast.error("Failed to refresh IP information");
    } finally {
      setRefreshing(false);
    }
  };

  const getCountryFlag = (countryCode: string) => {
    if (!countryCode || countryCode === 'XX') return '🌍';
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              IP Geolocation
            </CardTitle>
            <CardDescription>Your current IP address and location</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loadingMyIp || loadingProxyIp}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Current IP (without VPN) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-muted-foreground' : 'text-foreground'}`}>
                <XCircle className="h-4 w-4 text-destructive" />
                <span className="font-semibold">Without VPN</span>
              </div>
            </div>
            
            {loadingMyIp ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : myIp ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">IP Address:</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">{myIp.ip}</code>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">
                    {getCountryFlag(myIp.countryCode)} {myIp.city}, {myIp.country}
                  </span>
                </div>
                {myIp.isp && myIp.isp !== 'Unknown' && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">ISP:</span>
                    <span className="text-sm">{myIp.isp}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-destructive">Failed to load IP information</div>
            )}
          </div>

          {/* VPN IP (through proxy) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b">
              <div className={`flex items-center gap-2 ${isConnected ? 'text-foreground' : 'text-muted-foreground'}`}>
                {isConnected ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-semibold">With VPN</span>
              </div>
            </div>
            
            {!isConnected ? (
              <div className="text-sm text-muted-foreground">
                Connect to VPN to see your protected IP
              </div>
            ) : loadingProxyIp ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : proxyIp ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">IP Address:</span>
                  <code className="text-sm bg-muted px-2 py-0.5 rounded">{proxyIp.ip}</code>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Location:</span>
                  <span className="text-sm">
                    {getCountryFlag(proxyIp.countryCode)} {proxyIp.city}, {proxyIp.country}
                  </span>
                </div>
                {proxyIp.isp && proxyIp.isp !== 'Unknown' && (
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">ISP:</span>
                    <span className="text-sm">{proxyIp.isp}</span>
                  </div>
                )}
                {myIp && proxyIp.ip !== myIp.ip && (
                  <div className="mt-3 p-2 bg-green-500/10 border border-green-500/20 rounded text-sm text-green-600 dark:text-green-400">
                    ✓ VPN is working - Your IP is masked
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-destructive">Failed to load proxy IP information</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
