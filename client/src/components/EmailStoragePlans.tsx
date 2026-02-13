import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Check, Loader2, Mail, Zap } from 'lucide-react';
import { useAuth } from '@/_core/hooks/useAuth';

const PLANS = [
  {
    tier: 'free' as const,
    name: 'Free',
    storage: '15GB',
    price: '£0',
    priceId: null,
    features: ['15GB email storage', 'Basic email features', 'Standard support'],
  },
  {
    tier: '50gb' as const,
    name: '50GB Plan',
    storage: '50GB',
    price: '£2.99',
    priceId: 'price_email_50gb',
    features: ['50GB email storage', 'All email features', 'Priority support', 'Advanced filters'],
  },
  {
    tier: '100gb' as const,
    name: '100GB Plan',
    storage: '100GB',
    price: '£3.99',
    priceId: 'price_email_100gb',
    features: ['100GB email storage', 'All email features', 'Priority support', 'Advanced filters', 'Custom domains'],
  },
  {
    tier: '200gb' as const,
    name: '200GB Plan',
    storage: '200GB',
    price: '£10.99',
    priceId: 'price_email_200gb',
    features: ['200GB email storage', 'All premium features', 'Priority support', 'Advanced filters', 'Custom domains', 'API access'],
  },
  {
    tier: 'unlimited' as const,
    name: 'Unlimited',
    storage: 'Unlimited',
    price: '£100',
    priceId: 'price_email_unlimited',
    features: ['Unlimited email storage', 'All premium features', '24/7 Support', 'Advanced filters', 'Custom domains', 'API access'],
  },
];

export function EmailStoragePlans() {
  const { user, isAuthenticated } = useAuth();
  const { data: plan, isLoading, error } = trpc.email.getStoragePlan.useQuery(undefined, {
    enabled: isAuthenticated,
    retry: 1,
  });
  const createCheckout = trpc.email.createStorageCheckout.useMutation();

  const handleUpgrade = async (tier: '50gb' | '100gb' | '200gb' | 'unlimited') => {
    try {
      const { url } = await createCheckout.mutateAsync({ tier });
      window.location.href = url;
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2 text-sm text-muted-foreground">Loading plans...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Unable to load storage plans. Please try refreshing the page.
        </CardContent>
      </Card>
    );
  }

  const currentTier = plan?.tier || 'free';
  const emailStorageUsed = user?.emailStorageUsed || 0;
  const emailStorageLimit = user?.emailStorageLimit || 16106127360; // 15GB default

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Storage Plans
        </CardTitle>
        <CardDescription>
          Current usage: {(emailStorageUsed / (1024 ** 3)).toFixed(2)}GB / {(emailStorageLimit / (1024 ** 3)).toFixed(0)}GB
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((planOption) => {
            const isCurrentPlan = currentTier === planOption.tier;
            const isFreePlan = planOption.tier === 'free';

            return (
              <Card
                key={planOption.tier}
                className={`relative ${isCurrentPlan ? 'border-primary border-2' : ''}`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                    Current Plan
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-lg">{planOption.name}</CardTitle>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{planOption.price}</span>
                    {!isFreePlan && <span className="text-muted-foreground">/month</span>}
                  </div>
                  <CardDescription className="font-semibold text-base">
                    {planOption.storage} Storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {planOption.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {!isCurrentPlan && !isFreePlan && (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(planOption.tier)}
                      disabled={createCheckout.isPending}
                    >
                      {createCheckout.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Zap className="h-4 w-4 mr-2" />
                      )}
                      Upgrade to {planOption.name}
                    </Button>
                  )}
                  {isCurrentPlan && !isFreePlan && (
                    <Button variant="outline" className="w-full" disabled>
                      Active Subscription
                    </Button>
                  )}
                  {isFreePlan && !isCurrentPlan && (
                    <Button variant="outline" className="w-full" disabled>
                      Downgrade in Settings
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
