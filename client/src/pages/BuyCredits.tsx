import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

const creditPacks = [
  { id: "credits_1000", credits: 1000, price: "£4.99", popular: false },
  { id: "credits_3000", credits: 3000, price: "£5.99", popular: true },
  { id: "credits_10000", credits: 10000, price: "£12.99", popular: false },
];

export default function BuyCredits() {
  const { user } = useAuth();

  const createCheckoutMutation = trpc.payment.createCheckout.useMutation({
    onSuccess: (data: any) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });

  const handlePurchase = (packId: string) => {
    createCheckoutMutation.mutate({ planId: packId });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container py-4">
          <div className="flex items-center gap-4">
            <Link href="/ai-chat">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Buy AI Credits</h1>
              <p className="text-sm text-muted-foreground">Purchase additional credits for AI chat</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Sparkles className="h-5 w-5" />
            <span className="font-semibold">{user?.aiCredits || 0} Credits Available</span>
          </div>
          <p className="text-muted-foreground">
            Each AI message uses approximately 1-5 credits depending on length and complexity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPacks.map((pack) => (
            <Card key={pack.id} className={pack.popular ? "border-primary shadow-lg" : ""}>
              {pack.popular && (
                <div className="bg-primary text-primary-foreground text-center py-1 text-sm font-semibold rounded-t-lg">
                  Best Value
                </div>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-3xl">{pack.credits.toLocaleString()}</CardTitle>
                <CardDescription>AI Credits</CardDescription>
                <div className="text-4xl font-bold mt-4">{pack.price}</div>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => handlePurchase(pack.id)} 
                  className="w-full"
                  variant={pack.popular ? "default" : "outline"}
                  disabled={createCheckoutMutation.isPending}
                >
                  {createCheckoutMutation.isPending ? "Loading..." : "Purchase"}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-3">
                  ~{Math.floor(pack.credits / 3)} AI conversations
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How Credits Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Credits are used for AI chat conversations</p>
            <p>• Simple questions use 1-2 credits</p>
            <p>• Complex requests use 3-5 credits</p>
            <p>• Credits never expire</p>
            <p>• Unused credits roll over indefinitely</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
