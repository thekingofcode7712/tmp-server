import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Zap, Gift } from "lucide-react";
import { useLocation } from "wouter";

export default function SeasonalEvents() {
  const [, setLocation] = useLocation();
  const { data: user } = trpc.auth.me.useQuery();
  const claimReward = trpc.auth.claimDailyReward.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        alert(`Claimed! +${data.bitsReward} Bits, +${data.aiCreditsReward} AI Credits (Streak: ${data.streak})`);
      }
    },
  });

  const events = [
    {
      id: 1,
      name: "Valentine Madness",
      description: "Double points on all games for 7 days",
      mode: "double_points",
      rewards: { bits: 200, aiCredits: 50 },
      daysLeft: 5,
      active: true,
    },
    {
      id: 2,
      name: "Spring Speedrun",
      description: "Complete Snake in under 30 seconds for bonus rewards",
      mode: "speedrun",
      rewards: { bits: 300, aiCredits: 100 },
      daysLeft: 10,
      active: false,
    },
    {
      id: 3,
      name: "Summer Blitz",
      description: "Play 10 games daily to unlock exclusive cosmetics",
      mode: "daily_quest",
      rewards: { bits: 500, cosmetic: "summer_theme" },
      daysLeft: 15,
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Seasonal Events
          </h1>
          <p className="text-muted-foreground">Participate in limited-time events and earn exclusive rewards</p>
        </div>

        {/* Daily Login Reward */}
        <Card className="border-yellow-500/20 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-yellow-500" />
                <CardTitle>Daily Login Reward</CardTitle>
              </div>
              <Badge variant="outline" className="bg-yellow-500/20">Daily</Badge>
            </div>
            <CardDescription>Claim your daily reward and build your login streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Base Reward</p>
                <p className="text-2xl font-bold text-yellow-500">50 Bits</p>
                <p className="text-xs text-muted-foreground mt-1">+10 Bits per streak day</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">AI Credits</p>
                <p className="text-2xl font-bold text-cyan-500">10 Credits</p>
                <p className="text-xs text-muted-foreground mt-1">+5 Credits per streak day</p>
              </div>
              <div className="p-4 rounded-lg bg-background/50 border border-border">
                <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
                <p className="text-2xl font-bold text-orange-500">Day 1</p>
                <p className="text-xs text-muted-foreground mt-1">Come back tomorrow to continue</p>
              </div>
            </div>
            <Button 
              onClick={() => claimReward.mutate()} 
              disabled={claimReward.isPending}
              className="w-full"
            >
              {claimReward.isPending ? "Claiming..." : "Claim Daily Reward"}
            </Button>
          </CardContent>
        </Card>

        {/* Active Events */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Active Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.filter(e => e.active).map((event) => (
              <Card key={event.id} className="border-primary/20 hover:border-primary/50 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-yellow-500" />
                        {event.name}
                      </CardTitle>
                      <CardDescription className="mt-2">{event.description}</CardDescription>
                    </div>
                    <Badge className="bg-green-500/20 text-green-600">Active</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Bits Reward</p>
                      <p className="text-xl font-bold text-primary">{event.rewards.bits}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-xs text-muted-foreground mb-1">AI Credits</p>
                      <p className="text-xl font-bold text-cyan-600">{event.rewards.aiCredits}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{event.daysLeft} days remaining</span>
                  </div>
                  <Button onClick={() => setLocation("/games")} className="w-full">
                    Play Games
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {events.filter(e => !e.active).map((event) => (
              <Card key={event.id} className="border-border/50 opacity-75">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{event.name}</CardTitle>
                      <CardDescription className="mt-2">{event.description}</CardDescription>
                    </div>
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                      <p className="text-xs text-muted-foreground mb-1">Bits Reward</p>
                      <p className="text-xl font-bold text-primary">{event.rewards.bits}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
                      <p className="text-xs text-muted-foreground mb-1">AI Credits</p>
                      <p className="text-xl font-bold text-cyan-600">{event.rewards.aiCredits}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Starts in {event.daysLeft} days</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
