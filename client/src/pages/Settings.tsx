import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user } = useAuth();
  const [customLogo, setCustomLogo] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated!");
      utils.auth.me.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editName,
      email: editEmail,
    });
  };

  const handleSaveCustomization = () => {
    toast.success("Settings saved!");
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
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-4xl">
        <Tabs defaultValue="account">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="subscription">Subscription</TabsTrigger>
            <TabsTrigger value="customization">Customization</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    type="email"
                  />
                </div>
                <div>
                  <Label>Login Method</Label>
                  <Input value={user?.loginMethod || ""} disabled />
                </div>
                <div>
                  <Label>Member Since</Label>
                  <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} disabled />
                </div>
                <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="w-full">
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Current Plan</Label>
                  <Input value={user?.subscriptionTier || "free"} disabled className="capitalize" />
                </div>
                <div>
                  <Label>Storage Used</Label>
                  <Input
                    value={`${((user?.storageUsed || 0) / (1024 ** 3)).toFixed(2)} GB / ${((user?.storageLimit || 5368709120) / (1024 ** 3)).toFixed(2)} GB`}
                    disabled
                  />
                </div>
                <div>
                  <Label>AI Credits</Label>
                  <Input value={user?.aiCredits || 0} disabled />
                </div>
                <Link href="/subscription">
                  <Button className="w-full">Manage Subscription</Button>
                </Link>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customization">
            <Card>
              <CardHeader>
                <CardTitle>Customization</CardTitle>
                <CardDescription>
                  {user?.hasCustomization
                    ? "Customize your TMP Server experience"
                    : "Purchase customization feature for £19.99"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {user?.hasCustomization ? (
                  <>
                    <div>
                      <Label>Custom Logo URL</Label>
                      <Input
                        placeholder="https://example.com/logo.png"
                        value={customLogo}
                        onChange={(e) => setCustomLogo(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Custom Theme</Label>
                      <Input
                        placeholder="dark, light, or custom"
                        value={customTheme}
                        onChange={(e) => setCustomTheme(e.target.value)}
                      />
                    </div>
                    <Button onClick={handleSaveCustomization} className="w-full">
                      Save Customization
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Unlock customization features to personalize your TMP Server
                    </p>
                    <Link href="/subscription">
                      <Button>Purchase Customization - £19.99</Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Configure your preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Notifications</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Email notifications are enabled by default
                  </p>
                </div>
                <div>
                  <Label>Privacy</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your data is encrypted and secure
                  </p>
                </div>
                <div>
                  <Label>Language</Label>
                  <Input value="English" disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
