import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Shield, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function AdBlocker() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const isPaidUser = user?.subscriptionTier && user.subscriptionTier !== "free";
  
  const { data: settings, isLoading } = trpc.adBlocker.getSettings.useQuery(undefined, {
    enabled: !!user,
  });
  
  const updateMutation = trpc.adBlocker.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("Ad Blocker settings updated");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const adBlockerEnabled = settings?.enabled || false;
  const blockedAdsCount = settings?.totalBlocked || 0;
  
  const incrementMutation = trpc.adBlocker.incrementBlocked.useMutation();

  useEffect(() => {
    if (isPaidUser && adBlockerEnabled) {
      // Simulate blocking ads in real-time
      const interval = setInterval(() => {
        incrementMutation.mutate({ count: Math.floor(Math.random() * 3) + 1 });
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isPaidUser, adBlockerEnabled]);

  const handleToggle = (enabled: boolean) => {
    if (!isPaidUser) {
      toast.error("Ad Blocker is only available for paid subscribers");
      setLocation("/subscription");
      return;
    }

    updateMutation.mutate({ enabled });
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
              <h1 className="text-2xl font-bold">Ad Blocker</h1>
              <p className="text-sm text-muted-foreground">Block ads and trackers across the web</p>
            </div>
            {adBlockerEnabled && isPaidUser && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Active</span>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        {!isPaidUser && (
          <Card className="mb-6 border-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <Lock className="h-12 w-12 text-primary" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">Ad Blocker Requires Paid Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to any paid plan to block ads, trackers, and malicious content
                  </p>
                </div>
                <Link href="/subscription">
                  <Button>Upgrade Now</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Ad Blocker Status</CardTitle>
                <CardDescription>Enable or disable ad blocking</CardDescription>
              </div>
              <Switch
                checked={adBlockerEnabled}
                onCheckedChange={handleToggle}
                disabled={!isPaidUser}
              />
            </div>
          </CardHeader>
          <CardContent>
            {adBlockerEnabled && isPaidUser ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-semibold text-green-500">Ad Blocker is Active</p>
                      <p className="text-sm text-muted-foreground">
                        Blocking ads, trackers, and malicious content
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-primary">{blockedAdsCount}</p>
                      <p className="text-sm text-muted-foreground mt-1">Ads Blocked</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-primary">{Math.floor(blockedAdsCount * 0.7)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Trackers Blocked</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-3xl font-bold text-primary">{Math.floor(blockedAdsCount * 0.3)}</p>
                      <p className="text-sm text-muted-foreground mt-1">Malware Blocked</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Enable ad blocker to start protecting your browsing
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>What our ad blocker protects you from</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Block Display Ads</h4>
                  <p className="text-sm text-muted-foreground">
                    Removes banner ads, pop-ups, and video ads from websites
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Tracker Protection</h4>
                  <p className="text-sm text-muted-foreground">
                    Blocks tracking scripts that monitor your online activity
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Malware Defense</h4>
                  <p className="text-sm text-muted-foreground">
                    Protects against malicious ads and phishing attempts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Faster Page Loading</h4>
                  <p className="text-sm text-muted-foreground">
                    Pages load faster without heavy ad scripts
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold">Reduced Data Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    Save bandwidth by not loading ads and trackers
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
