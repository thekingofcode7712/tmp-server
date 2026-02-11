import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useEffect } from "react";

export default function Status() {
  const { data: status, isLoading, refetch } = trpc.system.status.useQuery();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const getStatusIcon = (isOperational: boolean | undefined) => {
    if (isOperational === undefined) {
      return <AlertCircle className="h-6 w-6 text-yellow-500" />;
    }
    return isOperational ? (
      <CheckCircle2 className="h-6 w-6 text-green-500" />
    ) : (
      <XCircle className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusText = (isOperational: boolean | undefined) => {
    if (isOperational === undefined) return "Checking...";
    return isOperational ? "Operational" : "Down";
  };

  const getStatusColor = (isOperational: boolean | undefined) => {
    if (isOperational === undefined) return "text-yellow-500";
    return isOperational ? "text-green-500" : "text-red-500";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">System Status</h1>
                <p className="text-sm text-muted-foreground">Real-time service monitoring</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {/* Overall Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon(status?.overall)}
              <span>Overall System Status</span>
            </CardTitle>
            <CardDescription>
              Last updated: {new Date().toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${getStatusColor(status?.overall)}`}>
              {getStatusText(status?.overall)}
            </p>
            {status?.uptime && (
              <p className="text-sm text-muted-foreground mt-2">
                Server uptime: {Math.floor(status.uptime / 3600)}h {Math.floor((status.uptime % 3600) / 60)}m
              </p>
            )}
          </CardContent>
        </Card>

        {/* Service Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Web Server</span>
                {getStatusIcon(status?.server)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.server)}`}>
                {getStatusText(status?.server)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Express + tRPC API
              </p>
            </CardContent>
          </Card>

          {/* Database */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Database</span>
                {getStatusIcon(status?.database)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.database)}`}>
                {getStatusText(status?.database)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                MySQL/TiDB connection
              </p>
            </CardContent>
          </Card>

          {/* Cloud Storage */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Cloud Storage</span>
                {getStatusIcon(status?.storage)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.storage)}`}>
                {getStatusText(status?.storage)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                S3-compatible storage
              </p>
            </CardContent>
          </Card>

          {/* Email Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Email Service</span>
                {getStatusIcon(status?.email)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.email)}`}>
                {getStatusText(status?.email)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                SMTP/IMAP connectivity
              </p>
            </CardContent>
          </Card>

          {/* AI Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>AI Service</span>
                {getStatusIcon(status?.ai)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.ai)}`}>
                {getStatusText(status?.ai)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                LLM API availability
              </p>
            </CardContent>
          </Card>

          {/* Payment Service */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Payment Service</span>
                {getStatusIcon(status?.payment)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`font-semibold ${getStatusColor(status?.payment)}`}>
                {getStatusText(status?.payment)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Stripe integration
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status Legend */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">Status Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm"><strong>Operational:</strong> Service is running normally</span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <span className="text-sm"><strong>Checking:</strong> Status is being verified</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm"><strong>Down:</strong> Service is unavailable or experiencing issues</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
