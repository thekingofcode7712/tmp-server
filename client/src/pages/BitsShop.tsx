import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { ArrowLeft, ShoppingCart, Coins } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BitsShop() {
  const { user, isAuthenticated } = useAuth();
  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: shopItems, isLoading } = trpc.shop.getItems.useQuery();
  const purchaseMutation = trpc.shop.purchase.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Purchase successful!");
      } else {
        toast.error(data.message || "Purchase failed");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to purchase item");
    },
  });

  if (!isAuthenticated) {
    return <div>Please log in to access the shop</div>;
  }

  const bitsBalance = stats?.bitsBalance || 0;

  const categories = {
    powerup: shopItems?.filter((item: any) => item.category === 'powerup') || [],
    cosmetic: shopItems?.filter((item: any) => item.category === 'cosmetic') || [],
    exchange: shopItems?.filter((item: any) => item.category === 'exchange') || [],
    boost: shopItems?.filter((item: any) => item.category === 'boost') || [],
  };

  const handlePurchase = (itemId: number, price: number) => {
    if (bitsBalance < price) {
      toast.error("Insufficient Bits! Play more games to earn Bits.");
      return;
    }
    purchaseMutation.mutate({ itemId });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <header className="border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:backdrop-blur-sm shadow-sm">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  Bits Shop
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Spend your Bits on power-ups, cosmetics, and more
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Coins className="h-5 w-5 text-purple-600" />
              <span className="text-lg font-bold text-purple-600">
                {bitsBalance.toLocaleString()} Bits
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
            <TabsTrigger value="all">All Items</TabsTrigger>
            <TabsTrigger value="powerup">Power-ups</TabsTrigger>
            <TabsTrigger value="cosmetic">Cosmetics</TabsTrigger>
            <TabsTrigger value="exchange">Exchange</TabsTrigger>
            <TabsTrigger value="boost">Boosts</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                shopItems?.map((item: any) => (
                  <Card key={item.id} className="border-primary/20 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{item.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription className="text-xs capitalize">
                              {item.category}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-purple-600 font-bold">
                          <Coins className="h-4 w-4" />
                          <span>{item.price}</span>
                        </div>
                        <Button
                          onClick={() => handlePurchase(item.id, item.price)}
                          disabled={bitsBalance < item.price || purchaseMutation.isPending}
                          size="sm"
                          className="gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {Object.entries(categories).map(([category, items]) => (
            <TabsContent key={category} value={category} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((item: any) => (
                  <Card key={item.id} className="border-primary/20 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-3xl">{item.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{item.name}</CardTitle>
                            <CardDescription className="text-xs capitalize">
                              {item.category}
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-purple-600 font-bold">
                          <Coins className="h-4 w-4" />
                          <span>{item.price}</span>
                        </div>
                        <Button
                          onClick={() => handlePurchase(item.id, item.price)}
                          disabled={bitsBalance < item.price || purchaseMutation.isPending}
                          size="sm"
                          className="gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
