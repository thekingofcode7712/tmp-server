import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Calendar, CreditCard, X } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageSubscription() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: payments } = trpc.payment.getPaymentHistory.useQuery();
  const { data: subscription } = trpc.payment.getSubscription.useQuery();

  const cancelSubscriptionMutation = trpc.payment.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription cancelled and downgraded to free plan");
      utils.payment.getSubscription.invalidate();
      utils.auth.me.invalidate();
      utils.dashboard.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const reactivateSubscriptionMutation = trpc.payment.reactivateSubscription.useMutation({
    onSuccess: (data: any) => {
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const pauseSubscriptionMutation = trpc.payment.pauseSubscription.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Subscription paused until ${formatDate(data.pausedUntil)}`);
      utils.payment.getSubscription.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const resumeSubscriptionMutation = trpc.payment.resumeSubscription.useMutation({
    onSuccess: () => {
      toast.success("Subscription resumed successfully");
      utils.payment.getSubscription.invalidate();
      utils.auth.me.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/subscription">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Manage Subscription</h1>
              <p className="text-sm text-muted-foreground">View and manage your subscription</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Plan</p>
                <p className="text-lg font-semibold capitalize">{user?.subscriptionTier || "Free"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">
                  {subscription?.status === "active" ? (
                    <span className="text-green-500">Active</span>
                  ) : subscription?.status === "paused" ? (
                    <span className="text-yellow-500">Paused</span>
                  ) : (
                    <span className="text-muted-foreground">Inactive</span>
                  )}
                </p>
                {subscription?.status === "paused" && subscription?.pausedUntil && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Resumes in {Math.ceil((new Date(subscription.pausedUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="text-lg font-semibold">
                  {user?.storageLimit === Number.MAX_SAFE_INTEGER
                    ? "Unlimited"
                    : `${user?.storageLimit || 5} GB`}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renewal Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(subscription?.currentPeriodEnd || null)}
                </p>
              </div>
            </div>

            {subscription?.status === "cancelled" && user?.subscriptionTier === "free" && (
              <Button 
                onClick={() => reactivateSubscriptionMutation.mutate()}
                className="w-full"
              >
                Reactivate Previous Plan
              </Button>
            )}

            {subscription?.status === "paused" && (
              <Button 
                onClick={() => resumeSubscriptionMutation.mutate()}
                className="w-full"
              >
                Resume Subscription
              </Button>
            )}

            {subscription?.status === "active" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => pauseSubscriptionMutation.mutate({ months: 1 })}
                  >
                    Pause 1 Month
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => pauseSubscriptionMutation.mutate({ months: 2 })}
                  >
                    Pause 2 Months
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => pauseSubscriptionMutation.mutate({ months: 3 })}
                  >
                    Pause 3 Months
                  </Button>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <X className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will immediately cancel your subscription and downgrade you to the free plan (5GB storage). You can reactivate anytime.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => cancelSubscriptionMutation.mutate()}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Downgrade to Free
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Billing History
            </CardTitle>
            <CardDescription>Your payment history and invoices</CardDescription>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border"
                  >
                    <div>
                      <p className="font-medium">{payment.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatAmount(payment.amount, payment.currency)}
                      </p>
                      <p className="text-sm text-green-500 capitalize">{payment.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No payment history yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
