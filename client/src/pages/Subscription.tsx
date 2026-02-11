import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

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

  const handleUpgrade = (planId: string) => {
    toast.info("Stripe checkout will open here");
    // Stripe integration will be added
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
                  <Button onClick={() => handleUpgrade(plan.id)} className="w-full">
                    {plan.id === "free" ? "Downgrade" : "Upgrade"}
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
                  <Button onClick={() => handleUpgrade("customization")} className="mt-2">
                    Purchase
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
