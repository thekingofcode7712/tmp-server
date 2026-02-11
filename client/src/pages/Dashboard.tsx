import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  HardDrive, Mail, Gamepad2, Terminal, Bot, Link as LinkIcon, 
  Download, Settings, CreditCard, Database, LogOut 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, loading, isAuthenticated, logout } = useAuth();
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">TMP Server</CardTitle>
            <CardDescription>Your complete cloud platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Access cloud storage, email, games, AI chat, and more
            </p>
            <Button asChild className="w-full" size="lg">
              <a href={getLoginUrl()}>Sign In to Continue</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const storagePercent = stats ? (stats.storageUsed / stats.storageLimit) * 100 : 0;
  const storageUsedGB = stats ? (stats.storageUsed / (1024 ** 3)).toFixed(2) : "0";
  const storageLimitGB = stats ? (stats.storageLimit / (1024 ** 3)).toFixed(2) : "5";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">TMP Server</h1>
              <p className="text-sm text-muted-foreground">Welcome back, {user?.name}</p>
            </div>
            <div className="flex items-center gap-2">
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

      <div className="container py-8">
        {/* Storage Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>
              {storageUsedGB} GB of {storageLimitGB} GB used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-4 w-full" />
            ) : (
              <>
                <Progress value={storagePercent} className="mb-2" />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{stats?.fileCount || 0} files</span>
                  <span>{stats?.subscriptionTier || "free"} plan</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">AI Credits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.aiCredits || 0}</div>
              <p className="text-xs text-muted-foreground">credits remaining</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Files Stored</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.fileCount || 0}</div>
              <p className="text-xs text-muted-foreground">total files</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Subscription</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{stats?.subscriptionTier || "Free"}</div>
              <p className="text-xs text-muted-foreground">current plan</p>
            </CardContent>
          </Card>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/storage">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <HardDrive className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Cloud Storage</CardTitle>
                <CardDescription>Upload and manage your files</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/email">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Email</CardTitle>
                <CardDescription>Send and receive emails</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/games">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Gamepad2 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Games</CardTitle>
                <CardDescription>Play 20 games with leaderboards</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/video-downloader">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Download className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Video Downloader</CardTitle>
                <CardDescription>Download videos from URLs</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/links">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <LinkIcon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Link Uploader</CardTitle>
                <CardDescription>Save music, video, and app links</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/ai-chat">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Bot className="h-8 w-8 text-primary mb-2" />
                <CardTitle>AI Chat</CardTitle>
                <CardDescription>Chat with AI assistant</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/cli">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Terminal className="h-8 w-8 text-primary mb-2" />
                <CardTitle>CLI Terminal</CardTitle>
                <CardDescription>200+ commands available</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/backups">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <Database className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Backups</CardTitle>
                <CardDescription>Backup and restore your data</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/subscription">
            <Card className="card-hover cursor-pointer">
              <CardHeader>
                <CreditCard className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your plan</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Files */}
        {stats?.recentFiles && stats.recentFiles.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Recent Files</CardTitle>
              <CardDescription>Your most recently uploaded files</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div className="flex-1">
                      <p className="font-medium">{file.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {((file.fileSize || 0) / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-12">
        <div className="container py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-semibold mb-2">TMP Server</h3>
              <p className="text-sm text-muted-foreground">
                Your complete cloud platform with storage, email, games, and more.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><Link href="/storage"><a className="hover:text-foreground">Cloud Storage</a></Link></li>
                <li><Link href="/email"><a className="hover:text-foreground">Email</a></Link></li>
                <li><Link href="/games"><a className="hover:text-foreground">Games</a></Link></li>
                <li><Link href="/subscription"><a className="hover:text-foreground">Subscription</a></Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Support</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            © 2026 TMP Server. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
