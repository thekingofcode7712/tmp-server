import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Gamepad2, Palette, HardDrive, Zap, Calendar, CheckCircle2, ArrowRight } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Link } from "wouter";

const ADDON_ICONS: Record<string, any> = {
  "Premium Games Pack": Gamepad2,
  "Premium Themes Pack": Palette,
  "Extra Storage (50GB)": HardDrive,
  "AI Credits Boost": Zap,
};

const ADDON_BENEFITS: Record<string, string[]> = {
  "Premium Games Pack": ["10 classic games", "High score tracking", "Leaderboards", "Offline play"],
  "Premium Themes Pack": ["5 premium themes", "Custom colors", "Smooth animations", "Dark/Light variants"],
  "Extra Storage (50GB)": ["50GB extra space", "Faster uploads", "Priority support", "Lifetime access"],
  "AI Credits Boost": ["1000 AI credits", "Never expires", "Use anytime", "Instant delivery"],
};

export default function MyAddons() {
  const { user } = useAuth();
  const { data: userAddons, isLoading } = trpc.addons.getUserAddons.useQuery();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Add-ons</h1>
            <p className="text-muted-foreground">Loading your purchased add-ons...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!userAddons || userAddons.length === 0) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">My Add-ons</h1>
            <p className="text-muted-foreground">Manage and view your purchased add-ons</p>
          </div>

          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-muted rounded-full">
                  <Gamepad2 className="w-12 h-12 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">No Add-ons Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't purchased any add-ons yet. Browse the marketplace to enhance your experience!
                  </p>
                  <Link href="/addons">
                    <Button>
                      Browse Add-ons Marketplace
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">My Add-ons</h1>
          <p className="text-muted-foreground">
            You have {userAddons.length} active add-on{userAddons.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {userAddons.map((item: any) => {
            const Icon = ADDON_ICONS[item.addon.name] || Gamepad2;
            const benefits = ADDON_BENEFITS[item.addon.name] || [];
            const purchaseDate = new Date(item.purchasedAt);

            return (
              <Card key={item.id} className="border-primary/50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {item.addon.name}
                          <Badge variant="default" className="ml-2">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Active
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">{item.addon.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Benefits */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Features:</p>
                      {benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="w-4 h-4 text-primary" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Purchase Info */}
                    <div className="pt-4 border-t space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Purchased on {purchaseDate.toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      {item.addon.name === "Premium Games Pack" && (
                        <Link href="/games">
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Gamepad2 className="w-4 h-4 mr-2" />
                            Play Games
                          </Button>
                        </Link>
                      )}
                      {item.addon.name === "Premium Themes Pack" && (
                        <Link href="/themes">
                          <Button variant="outline" size="sm" className="w-full mt-2">
                            <Palette className="w-4 h-4 mr-2" />
                            Browse Themes
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Browse More */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold mb-1">Want more add-ons?</h3>
                <p className="text-sm text-muted-foreground">
                  Explore our marketplace for more premium features
                </p>
              </div>
              <Link href="/addons">
                <Button>
                  Browse Marketplace
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
