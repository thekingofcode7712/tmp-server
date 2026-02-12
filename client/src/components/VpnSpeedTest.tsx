import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Zap, ArrowDown, ArrowUp, Clock } from "lucide-react";

interface SpeedTestProps {
  server: string;
  serverName: string;
}

function formatSpeed(bytesPerSecond: number) {
  const mbps = (bytesPerSecond * 8) / 1000000;
  return `${mbps.toFixed(2)} Mbps`;
}

export function VpnSpeedTest({ server, serverName }: SpeedTestProps) {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<{
    latency: number;
    downloadSpeed: number;
    uploadSpeed: number;
  } | null>(null);

  const { data: history } = trpc.vpn.getSpeedTests.useQuery({ server });

  const speedTestMutation = trpc.vpn.runSpeedTest.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setTesting(false);
      toast.success("Speed test completed");
    },
    onError: (error) => {
      setTesting(false);
      toast.error(error.message);
    },
  });

  const handleTest = () => {
    setTesting(true);
    setResult(null);
    speedTestMutation.mutate({ server });
  };

  const latestTest = history?.[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Speed Test - {serverName}
        </CardTitle>
        <CardDescription>Test connection speed to this VPN server</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTest}
          disabled={testing}
          className="w-full"
        >
          {testing ? "Testing..." : "Run Speed Test"}
        </Button>

        {(result || latestTest) && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-muted rounded-lg text-center">
                <Clock className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Latency</p>
                <p className="text-lg font-bold">
                  {(result?.latency || latestTest?.latency)}ms
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <ArrowDown className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                <p className="text-xs text-muted-foreground">Download</p>
                <p className="text-lg font-bold">
                  {formatSpeed(result?.downloadSpeed || latestTest?.downloadSpeed || 0)}
                </p>
              </div>
              <div className="p-3 bg-muted rounded-lg text-center">
                <ArrowUp className="h-4 w-4 mx-auto mb-1 text-green-500" />
                <p className="text-xs text-muted-foreground">Upload</p>
                <p className="text-lg font-bold">
                  {formatSpeed(result?.uploadSpeed || latestTest?.uploadSpeed || 0)}
                </p>
              </div>
            </div>

            {latestTest && !result && (
              <p className="text-xs text-muted-foreground text-center">
                Last tested: {new Date(latestTest.testedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {history && history.length > 1 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Recent Tests</h4>
            <div className="space-y-1">
              {history.slice(1, 4).map((test, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded"
                >
                  <span className="text-muted-foreground">
                    {new Date(test.testedAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-3">
                    <span>{test.latency}ms</span>
                    <span className="text-blue-500">↓ {formatSpeed(test.downloadSpeed)}</span>
                    <span className="text-green-500">↑ {formatSpeed(test.uploadSpeed)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
