import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "wouter";
import { CheckCircle2 } from "lucide-react";
import { useEffect } from "react";
import { trpc } from "@/lib/trpc";

export default function CheckoutSuccess() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  useEffect(() => {
    // Invalidate auth query to refresh user data
    utils.auth.me.invalidate();
    
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      setLocation("/");
    }, 3000);

    return () => clearTimeout(timer);
  }, [utils, setLocation]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your subscription has been activated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Thank you for subscribing to TMP Server. Your new plan is now active and you can start enjoying all the features.
          </p>
          <div className="text-center text-sm text-muted-foreground">
            Redirecting to dashboard in 3 seconds...
          </div>
          <Link href="/">
            <Button className="w-full">
              Go to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
