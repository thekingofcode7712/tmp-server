import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ArrowLeft, Users, DollarSign, Trophy, Activity, Shield } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const ADMIN_PASSWORD = "8142627712";

export default function Admin() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  
  const { data: user } = trpc.auth.me.useQuery();
  const { data: allUsers } = trpc.admin.getAllUsers.useQuery(undefined, {
    enabled: isUnlocked && user?.id === 1,
  });
  const { data: stats } = trpc.admin.getStats.useQuery(undefined, {
    enabled: isUnlocked && user?.id === 1,
  });

  const distributePrizesMutation = trpc.leaderboards.distributePrizes.useMutation({
    onSuccess: () => {
      toast.success("Prizes distributed successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const updateUserMutation = trpc.admin.updateUser.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handleUnlock = () => {
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      toast.success("Admin panel unlocked!");
    } else {
      toast.error("Incorrect password");
    }
  };

  // Check if user is owner
  if (!user || user.id !== 1) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>This page is restricted to the owner account only.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/">
              <Button className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription>Enter password to access admin controls</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
            />
            <Button onClick={handleUnlock} className="w-full">
              Unlock Admin Panel
            </Button>
            <Link href="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="h-6 w-6 text-primary" />
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">Platform management and analytics</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => setIsUnlocked(false)}>
              Lock Panel
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Platform Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Total Users
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats?.totalUsers || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                Total Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">£{stats?.totalRevenue || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                Games Played
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-yellow-600">{stats?.totalGamesPlayed || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                Active Subscriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats?.activeSubscriptions || 0}</p>
            </CardContent>
          </Card>
        </div>

        {/* Prize Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Prize Distribution</CardTitle>
            <CardDescription>Distribute prizes to leaderboard winners</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => distributePrizesMutation.mutate({ period: "weekly" })}
                disabled={distributePrizesMutation.isPending}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Distribute Weekly Prizes
              </Button>
              <Button
                onClick={() => distributePrizesMutation.mutate({ period: "monthly" })}
                disabled={distributePrizesMutation.isPending}
                variant="outline"
              >
                <Trophy className="h-4 w-4 mr-2" />
                Distribute Monthly Prizes
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Prizes: 1st place - 500 AI Credits, 2nd place - 300 AI Credits, 3rd place - 100 AI Credits
            </p>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>View and manage all platform users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {allUsers && allUsers.length === 0 && (
                <p className="text-muted-foreground text-center py-8">No users found</p>
              )}
              
              {allUsers?.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        {u.subscriptionTier || "free"}
                      </span>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {((u.storageUsed || 0) / (1024 ** 3)).toFixed(2)} GB used
                      </span>
                      <span className="text-xs bg-cyan-500/10 text-cyan-600 px-2 py-1 rounded">
                        {u.aiCredits || 0} AI Credits
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const credits = prompt("Enter AI credits to add:");
                        if (credits) {
                          updateUserMutation.mutate({
                            userId: u.id,
                            aiCredits: parseInt(credits),
                          });
                        }
                      }}
                    >
                      Add Credits
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const tier = prompt("Enter subscription tier (free/50gb/100gb/200gb/500gb/1tb/2tb/unlimited):");
                        if (tier) {
                          updateUserMutation.mutate({
                            userId: u.id,
                            subscriptionTier: tier,
                          });
                        }
                      }}
                    >
                      Change Plan
                    </Button>
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
