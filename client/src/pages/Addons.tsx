import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Gamepad2, Palette, HardDrive, Zap, Check, ShoppingCart } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

const ADDONS = [
  {
    id: "games_pack",
    name: "Premium Games Pack",
    description: "10 fully working games: Snake, Tetris, 2048, Flappy Bird, Pong, Breakout, Space Invaders, Pac-Man, Tic-Tac-Toe, Memory Match",
    price: 3,
    icon: Gamepad2,
    features: ["10 classic games", "High score tracking", "Leaderboards", "Offline play"],
  },
  {
    id: "premium_themes",
    name: "Premium Themes Pack",
    description: "5 beautiful custom themes with unique color schemes and animations",
    price: 3,
    icon: Palette,
    features: ["5 premium themes", "Custom colors", "Smooth animations", "Dark/Light variants"],
  },
  {
    id: "extra_storage",
    name: "Extra Storage (50GB)",
    description: "Add 50GB of additional cloud storage to your account",
    price: 3,
    icon: HardDrive,
    features: ["50GB extra space", "Faster uploads", "Priority support", "Lifetime access"],
  },
  {
    id: "ai_boost",
    name: "AI Credits Boost",
    description: "1000 extra AI credits for advanced features",
    price: 3,
    icon: Zap,
    features: ["1000 AI credits", "Never expires", "Use anytime", "Instant delivery"],
  },
];

export default function Addons() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: userAddons } = trpc.addons.getUserAddons.useQuery();
  
  // Handle success/cancel redirects from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success('Add-on purchased successfully! Your purchase has been activated.');
      utils.addons.getUserAddons.invalidate();
      // Clean up URL
      window.history.replaceState({}, '', '/addons');
    } else if (params.get('canceled') === 'true') {
      toast.error('Purchase canceled. You can try again anytime.');
      window.history.replaceState({}, '', '/addons');
    }
  }, [utils]);
  
  const purchaseAddon = trpc.addons.purchase.useMutation({
    onSuccess: () => {
      toast.success("Add-on purchased successfully!");
      utils.addons.getUserAddons.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handlePurchase = async (addonId: string) => {
    const result = await purchaseAddon.mutateAsync({ addonId });
    if (result.checkoutUrl) {
      window.location.href = result.checkoutUrl;
    }
  };

  const hasAddon = (addonId: string) => {
    return userAddons?.some((item: any) => {
      const name = item.addon.name.toLowerCase().replace(/\s+/g, '_');
      return name === addonId;
    });
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Add-ons Marketplace</h1>
          <p className="text-muted-foreground">Enhance your experience with premium add-ons - only £3 each!</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {ADDONS.map((addon) => {
            const Icon = addon.icon;
            const owned = hasAddon(addon.id);

            return (
              <Card key={addon.id} className={owned ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {addon.name}
                          {owned && <Badge variant="default"><Check className="w-3 h-3 mr-1" />Owned</Badge>}
                        </CardTitle>
                        <CardDescription className="mt-1">{addon.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      {addon.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <Check className="w-4 h-4 text-primary" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="text-2xl font-bold">£{addon.price}</div>
                      <Button
                        onClick={() => handlePurchase(addon.id)}
                        disabled={owned || purchaseAddon.isPending}
                        size="lg"
                      >
                        {owned ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Purchased
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {purchaseAddon.isPending ? "Processing..." : "Buy Now"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
