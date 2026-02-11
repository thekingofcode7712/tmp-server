import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Shield, ShieldCheck, Globe, Lock } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const vpnServers = [
  { id: "us-east", name: "United States (East)", location: "New York", flag: "🇺🇸" },
  { id: "us-west", name: "United States (West)", location: "Los Angeles", flag: "🇺🇸" },
  { id: "uk", name: "United Kingdom", location: "London", flag: "🇬🇧" },
  { id: "germany", name: "Germany", location: "Frankfurt", flag: "🇩🇪" },
  { id: "japan", name: "Japan", location: "Tokyo", flag: "🇯🇵" },
  { id: "singapore", name: "Singapore", location: "Singapore", flag: "🇸🇬" },
  { id: "australia", name: "Australia", location: "Sydney", flag: "🇦🇺" },
  { id: "canada", name: "Canada", location: "Toronto", flag: "🇨🇦" },
];

export default function VPN() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [connected, setConnected] = useState(false);
  const [selectedServer, setSelectedServer] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isPaidUser = user?.subscriptionTier && user.subscriptionTier !== "free";

  const handleConnect = async (serverId: string) => {
    if (!isPaidUser) {
      toast.error("VPN is only available for paid subscribers");
      setLocation("/subscription");
      return;
    }

    setConnecting(true);
    setSelectedServer(serverId);

    // Simulate VPN connection
    setTimeout(() => {
      setConnected(true);
      setConnecting(false);
      toast.success(`Connected to ${vpnServers.find(s => s.id === serverId)?.name}`);
    }, 2000);
  };

  const handleDisconnect = () => {
    setConnected(false);
    setSelectedServer(null);
    toast.info("Disconnected from VPN");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">VPN Service</h1>
              <p className="text-sm text-muted-foreground">Secure your connection and protect your privacy</p>
            </div>
            {connected && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Connected</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-6xl">
        {!isPaidUser && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Lock className="h-12 w-12 text-primary" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">VPN Access Requires Paid Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to any paid plan to access our secure VPN service with servers worldwide
                  </p>
                </div>
                <Link href="/subscription">
                  <Button>Upgrade Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Shield className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Secure Connection</h3>
              <p className="text-sm text-muted-foreground">
                Military-grade encryption protects your data
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Globe className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">Global Servers</h3>
              <p className="text-sm text-muted-foreground">
                8 server locations across the world
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 text-center">
              <Lock className="h-12 w-12 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-2">No Logs Policy</h3>
              <p className="text-sm text-muted-foreground">
                We don't track or store your browsing data
              </p>
            </CardContent>
          </Card>
        </div>

        {connected && selectedServer && (
          <Card className="mb-6 bg-green-500/10 border-green-500/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-green-500" />
                    VPN Connected
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connected to {vpnServers.find(s => s.id === selectedServer)?.name}
                  </p>
                </div>
                <Button variant="destructive" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Available Servers</CardTitle>
            <CardDescription>Choose a server location to connect</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {vpnServers.map((server) => (
                <div
                  key={server.id}
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    selectedServer === server.id && connected
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{server.flag}</span>
                      <div>
                        <h4 className="font-semibold">{server.name}</h4>
                        <p className="text-sm text-muted-foreground">{server.location}</p>
                      </div>
                    </div>
                    {selectedServer === server.id && connected ? (
                      <Button variant="outline" size="sm" disabled>
                        Connected
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleConnect(server.id)}
                        disabled={connecting || connected || !isPaidUser}
                      >
                        {connecting && selectedServer === server.id ? "Connecting..." : "Connect"}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
