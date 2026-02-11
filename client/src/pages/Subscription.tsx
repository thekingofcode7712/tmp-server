import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const plans = [
  { id: "free", name: "Free", storage: "5GB", price: "£0", features: ["5GB Storage", "100 AI Credits", "Email Account", "All Games"] },
  { id: "50gb", name: "50GB", storage: "50GB", price: "£2.99/mo", features: ["50GB Storage", "500 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "100gb", name: "100GB", storage: "100GB", price: "£3.99/mo", features: ["100GB Storage", "1000 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "200gb", name: "200GB", storage: "200GB", price: "£10.99/mo", features: ["200GB Storage", "2000 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "500gb", name: "500GB", storage: "500GB", price: "£25.99/mo", features: ["500GB Storage", "5000 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "1tb", name: "1TB", storage: "1TB", price: "£50/mo", features: ["1TB Storage", "10000 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "2tb", name: "2TB", storage: "2TB", price: "£89.99/mo", features: ["2TB Storage", "20000 AI Credits/mo", "Priority Support", "All Features"] },
  { id: "unlimited", name: "Unlimited", storage: "Unlimited", price: "£100/mo", features: ["Unlimited Storage", "Unlimited AI Credits", "24/7 Support", "All Features"] },
];

export default function Subscription() {
  const { user } = useAuth();
  const [customAmount, setCustomAmount] = useState<string>("");

  const createCheckoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        // Open in same tab
        window.location.href = data.url;
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleUpgrade = (planId: string) => {
    if (planId === "free") {
      toast.info("Contact support to downgrade to free plan");
      return;
    }

    createCheckoutMutation.mutate({ planId });
  };

  const handleFlexibleSubscribe = () => {
    const amount = parseFloat(customAmount);
    if (isNaN(amount) || amount < 1) {
      toast.error("Please enter a valid amount (minimum £1.00)");
      return;
    }

    createCheckoutMutation.mutate({ planId: "flexible", customAmount: amount });
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
            <div>
              <h1 className="text-2xl font-bold">Subscription Plans</h1>
              <p className="text-sm text-muted-foreground">Choose the perfect plan for your needs</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold mb-2">Current Plan: {user?.subscriptionTier || "Free"}</h2>
          <p className="text-muted-foreground">
            {((user?.storageUsed || 0) / (1024 ** 3)).toFixed(2)} GB of {((user?.storageLimit || 5368709120) / (1024 ** 3)).toFixed(2)} GB used
          </p>
        </div>

        {/* Flexible Pay-What-You-Want Option */}
        <Card className="mb-8 border-2 border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Flexible Subscription
            </CardTitle>
            <CardDescription>Pay what you want - Choose your own monthly amount</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Support TMP Server with a custom monthly amount. Storage and AI credits scale with your contribution.
                </p>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">£</span>
                    <Input
                      type="number"
                      min="1"
                      step="0.01"
                      placeholder="Enter amount"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="pl-7"
                    />
                  </div>
                  <Button 
                    onClick={handleFlexibleSubscribe}
                    disabled={createCheckoutMutation.isPending || !customAmount}
                  >
                    {createCheckoutMutation.isPending ? "Loading..." : "Subscribe"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Minimum: £1.00/month • Storage: ~{customAmount ? Math.floor(parseFloat(customAmount) * 10) : 0}GB
                </p>
              </div>
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2 text-sm">What you get:</h4>
                <ul className="space-y-1 text-sm">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Storage scales with amount (~10GB per £1)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    AI Credits scale with amount (~1000 per £1)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    All premium features included
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" />
                    Priority support
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-xl font-bold mb-4">Or choose a preset plan:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {plans.map((plan) => (
            <Card key={plan.id} className={user?.subscriptionTier === plan.id ? "border-primary" : ""}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.storage} Storage</CardDescription>
                <div className="text-3xl font-bold mt-2">{plan.price}</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
                {user?.subscriptionTier === plan.id ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.id)} 
                    className="w-full"
                    disabled={createCheckoutMutation.isPending}
                  >
                    {createCheckoutMutation.isPending ? "Loading..." : plan.id === "free" ? "Downgrade" : "Upgrade"}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Customization Add-on</CardTitle>
            <CardDescription>One-time purchase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg">Custom Branding</h3>
                <p className="text-sm text-muted-foreground">
                  Customize logo, colors, and theme
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">£19.99</div>
                {user?.hasCustomization ? (
                  <Button variant="outline" disabled className="mt-2">
                    Purchased
                  </Button>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade("customization")} 
                    className="mt-2"
                    disabled={createCheckoutMutation.isPending}
                  >
                    {createCheckoutMutation.isPending ? "Loading..." : "Purchase"}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
