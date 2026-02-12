import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Globe, Loader2 } from "lucide-react";

interface ProxyBrowserProps {
  server: string;
  serverName: string;
}

export function ProxyBrowser({ server, serverName }: ProxyBrowserProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);

  const proxyMutation = trpc.vpn.proxyRequest.useMutation({
    onSuccess: (data) => {
      setResponse(data);
      setLoading(false);
      toast.success(`Request completed through ${serverName}`);
    },
    onError: (error) => {
      setLoading(false);
      toast.error(error.message);
    },
  });

  const handleRequest = () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    let fullUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      fullUrl = 'https://' + url;
    }

    setLoading(true);
    setResponse(null);
    proxyMutation.mutate({
      server,
      url: fullUrl,
      method: 'GET',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Proxy Browser
        </CardTitle>
        <CardDescription>
          Browse through {serverName} - Your IP will be masked
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter URL (e.g., example.com)"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRequest()}
          />
          <Button onClick={handleRequest} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Go'}
          </Button>
        </div>

        {response && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm p-2 bg-muted rounded">
              <span className="text-muted-foreground">Status</span>
              <span className={`font-medium ${response.status === 200 ? 'text-green-500' : 'text-red-500'}`}>
                {response.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm p-2 bg-muted rounded">
              <span className="text-muted-foreground">Data Transferred</span>
              <span className="font-medium">
                {(response.bytesTransferred / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="p-3 bg-muted rounded text-xs font-mono max-h-40 overflow-auto">
              <pre>{JSON.stringify(response.headers, null, 2)}</pre>
            </div>
            <p className="text-xs text-muted-foreground">
              ✓ Request routed through {serverName}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
