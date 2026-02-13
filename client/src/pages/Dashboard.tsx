import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { 
  HardDrive, Mail, Gamepad2, Terminal, Bot, Link as LinkIcon, 
  Download, Settings, CreditCard, Database, LogOut, Shield, ShoppingCart, Palette,
  Activity, Trophy, Package, Target
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, setLocation] = useLocation();
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/login';
    return null;
  }

  const storagePercent = stats ? (stats.storageUsed / stats.storageLimit) * 100 : 0;
  const storageUsedGB = stats ? (stats.storageUsed / (1024 ** 3)).toFixed(2) : "0";
  const storageLimitGB = stats ? (stats.storageLimit / (1024 ** 3)).toFixed(2) : "5";
  
  const emailStoragePercent = stats ? (stats.emailStorageUsed / stats.emailStorageLimit) * 100 : 0;
  const emailStorageUsedGB = stats ? (stats.emailStorageUsed / (1024 ** 3)).toFixed(2) : "0";
  const emailStorageLimitGB = stats ? (stats.emailStorageLimit / (1024 ** 3)).toFixed(2) : "15";

  const menuItems = [
    { icon: HardDrive, label: "Cloud Storage", path: "/storage", color: "text-blue-500" },
    { icon: Download, label: "Video Downloader", path: "/video-downloader", color: "text-red-500" },
    { icon: LinkIcon, label: "Link Uploader", path: "/links", color: "text-green-500" },
    { icon: Gamepad2, label: "Games", path: "/games", color: "text-purple-500" },
    { icon: Trophy, label: "Game Stats", path: "/game-stats", color: "text-yellow-500" },
    { icon: Target, label: "Weekly Challenges", path: "/weekly-challenges", color: "text-orange-500" },
    { icon: Mail, label: "Email", path: "/email", color: "text-cyan-500" },
    { icon: Bot, label: "AI Chat", path: "/ai-chat", color: "text-pink-500" },
    { icon: Terminal, label: "CLI", path: "/cli", color: "text-gray-500" },
    { icon: Database, label: "Backups", path: "/backups", color: "text-indigo-500" },
    { icon: Shield, label: "VPN", path: "/vpn", color: "text-teal-500" },
    { icon: ShoppingCart, label: "Add-ons", path: "/addons", color: "text-amber-500" },
    { icon: Package, label: "My Add-ons", path: "/my-addons", color: "text-lime-500" },
    { icon: ShoppingCart, label: "Bits Shop", path: "/bits-shop", color: "text-purple-500" },
    { icon: Palette, label: "Themes", path: "/themes", color: "text-fuchsia-500" },
    { icon: Settings, label: "Settings", path: "/settings", color: "text-slate-500" },
    { icon: CreditCard, label: "Subscription", path: "/subscription", color: "text-emerald-500" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">TMP Server</h1>
              <p className="text-sm text-muted-foreground mt-1">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/server-status">
                <Button variant="outline" size="sm" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Server Status
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => logout()}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Pause Countdown Alert */}
      {stats?.subscriptionStatus === 'paused' && stats?.pausedUntil && (
        <div className="bg-yellow-500/10 border-b border-yellow-500/20">
          <div className="container py-3">
            <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
              <Shield className="h-5 w-5" />
              <p className="text-sm font-medium">
                Your subscription is paused and will automatically resume in{' '}
                <strong>
                  {Math.ceil((new Date(stats.pausedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                </strong>
                {' '}(on {new Date(stats.pausedUntil).toLocaleDateString()})
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="container py-8 space-y-8">
        {/* Storage & Email Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Storage Overview */}
          <Card className="border-primary/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-primary" />
                <CardTitle>Cloud Storage</CardTitle>
              </div>
              <CardDescription>
                {storageUsedGB} GB of {storageLimitGB} GB used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <Progress value={storagePercent} className="mb-2 h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-3">
                    <span>{stats?.fileCount || 0} files</span>
                    <span>{stats?.subscriptionTier || "free"} plan</span>
                  </div>
                  {storagePercent >= 90 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                      ⚠️ Storage almost full! <Link href="/subscription" className="underline font-semibold">Upgrade now</Link>
                    </div>
                  )}
                  {storagePercent >= 75 && storagePercent < 90 && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Storage is {storagePercent.toFixed(0)}% full
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Email Storage Overview */}
          <Card className="border-cyan-500/20 shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-cyan-500" />
                <CardTitle>Email Storage</CardTitle>
              </div>
              <CardDescription>
                {emailStorageUsedGB} GB of {emailStorageLimitGB} GB used
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <>
                  <Progress value={emailStoragePercent} className="mb-2 h-3" />
                  <div className="flex justify-between text-sm text-muted-foreground mt-3">
                    <span>Email storage</span>
                    <span>15GB free</span>
                  </div>
                  {emailStoragePercent >= 90 && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-600 dark:text-red-400">
                      ⚠️ Email storage almost full!
                    </div>
                  )}
                  {emailStoragePercent >= 75 && emailStoragePercent < 90 && (
                    <div className="mt-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm text-yellow-600 dark:text-yellow-400">
                      ⚠️ Email storage is {emailStoragePercent.toFixed(0)}% full
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Server Analytics */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <CardTitle>Server Analytics</CardTitle>
            </div>
            <CardDescription>Real-time server performance metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground mb-1">Total Files</p>
                <p className="text-2xl font-bold text-primary">{stats?.fileCount || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                <p className="text-sm text-muted-foreground mb-1">AI Credits</p>
                <p className="text-2xl font-bold text-cyan-600">{stats?.aiCredits || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-purple-500/5 border border-purple-500/10">
                <p className="text-sm text-muted-foreground mb-1">Bits Balance</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.bitsBalance?.toLocaleString() || 0}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-sm text-muted-foreground mb-1">Plan</p>
                <p className="text-2xl font-bold text-emerald-600 capitalize">{stats?.subscriptionTier || "Free"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Selection */}
        <Card className="border-primary/20 shadow-lg">
          <CardHeader>
            <CardTitle>Navigate to Feature</CardTitle>
            <CardDescription>Select a feature to access from the dropdown below</CardDescription>
          </CardHeader>
          <CardContent>
            <select
              onChange={(e) => e.target.value && setLocation(e.target.value)}
              className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              defaultValue=""
            >
              <option value="" disabled>Select a feature...</option>
              {menuItems.map((item) => (
                <option key={item.path} value={item.path}>
                  {item.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
