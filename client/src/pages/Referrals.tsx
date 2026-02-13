import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Users, Copy, Gift, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Referrals() {
  const { data: user } = trpc.auth.me.useQuery();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.id ? `REF${user.id}${Math.random().toString(36).substring(7).toUpperCase()}` : "";
  const referralLink = `${window.location.origin}?ref=${referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const referrals = [
    { id: 1, name: "Alice Johnson", joinedDate: "2025-02-10", status: "active", rewardsClaimed: true },
    { id: 2, name: "Bob Smith", joinedDate: "2025-02-08", status: "active", rewardsClaimed: true },
    { id: 3, name: "Carol White", joinedDate: "2025-02-05", status: "active", rewardsClaimed: false },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Referral Program
          </h1>
          <p className="text-muted-foreground">Invite friends and earn rewards together</p>
        </div>

        {/* Referral Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{referrals.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Active referrals</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Rewards Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">500 Bits</p>
              <p className="text-xs text-muted-foreground mt-1">From successful referrals</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/20">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">100 Bits</p>
              <p className="text-xs text-muted-foreground mt-1">Waiting for friend signup</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Referral Link
            </CardTitle>
            <CardDescription>Share this link with friends to earn rewards</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={referralLink} 
                readOnly 
                className="bg-background"
              />
              <Button 
                onClick={copyToClipboard}
                variant={copied ? "default" : "outline"}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
            <div className="p-4 rounded-lg bg-background/50 border border-border space-y-2">
              <p className="text-sm font-semibold">Referral Rewards:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ You get 100 Bits when friend signs up</li>
                <li>✓ Friend gets 50 Bits welcome bonus</li>
                <li>✓ Unlimited referrals - earn as much as you want</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Referrals List */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Referrals
            </CardTitle>
            <CardDescription>Friends you've invited to TMP Server</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {referrals.length > 0 ? (
                referrals.map((ref) => (
                  <div key={ref.id} className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:border-primary/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{ref.name}</p>
                      <p className="text-sm text-muted-foreground">Joined {ref.joinedDate}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {ref.rewardsClaimed ? (
                        <Badge className="bg-green-500/20 text-green-600">Rewards Claimed</Badge>
                      ) : (
                        <Badge variant="outline">Pending Rewards</Badge>
                      )}
                      <div className="text-right">
                        <p className="font-semibold text-green-600">+100 Bits</p>
                        <p className="text-xs text-muted-foreground">Reward value</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Gift className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground">No referrals yet. Share your link to get started!</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* How It Works */}
        <Card className="border-blue-500/20">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 font-bold">1</div>
                <p className="font-semibold">Share Your Link</p>
                <p className="text-sm text-muted-foreground">Copy and share your referral link with friends</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 font-bold">2</div>
                <p className="font-semibold">Friend Signs Up</p>
                <p className="text-sm text-muted-foreground">They create an account using your link</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-600 font-bold">3</div>
                <p className="font-semibold">Earn Rewards</p>
                <p className="text-sm text-muted-foreground">Both of you get Bits instantly</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
