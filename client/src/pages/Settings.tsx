import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import { ArrowLeft, User, CreditCard, Palette, Bell, Settings as SettingsIcon, Lock } from "lucide-react";
import { THEMES } from "@/lib/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { AlertHistory } from "@/components/AlertHistory";

export default function Settings() {
  const { user } = useAuth();
  const [customLogo, setCustomLogo] = useState("");
  const [customTheme, setCustomTheme] = useState("");
  
  const { data: userAddons } = trpc.addons.getUserAddons.useQuery();
  const { data: userTheme } = trpc.user.getTheme.useQuery();
  const setThemeMutation = trpc.user.setTheme.useMutation({
    onSuccess: () => {
      toast.success("Theme updated!");
      // Reload page to apply theme
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
  
  const hasPremiumThemes = userAddons?.some((item: any) => 
    item.addon.name === 'Premium Themes'
  );
  const [editName, setEditName] = useState(user?.name || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const utils = trpc.useUtils();

  const updateProfileMutation = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated!");
      // Force refetch user data
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      // Update local state
      setEditName(editName);
      setEditEmail(editEmail);
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

      <div className="container py-8 max-w-5xl">
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 h-auto p-1.5 gap-1">
            <TabsTrigger value="account" className="flex items-center gap-2 py-3">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Account</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2 py-3">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Subscription</span>
            </TabsTrigger>
            <TabsTrigger value="customization" className="flex items-center gap-2 py-3">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Customization</span>
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2 py-3">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2 py-3">
              <SettingsIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Your name"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="your.email@example.com"
                        type="email"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Account Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Login Method</Label>
                      <Input value={user?.loginMethod || ""} disabled className="mt-1.5" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Member Since</Label>
                      <Input value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ""} disabled className="mt-1.5" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending} className="w-full">
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscription">
            <Card>
              <CardHeader>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>Manage your subscription plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Plan Details</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Current Plan</Label>
                      <Input value={user?.subscriptionTier || "free"} disabled className="capitalize mt-1.5" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6 space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Usage Statistics</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Storage Used</Label>
                      <Input
                        value={`${((user?.storageUsed || 0) / (1024 ** 3)).toFixed(2)} GB / ${((user?.storageLimit || 5368709120) / (1024 ** 3)).toFixed(2)} GB`}
                        disabled
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">AI Credits</Label>
                      <Input value={user?.aiCredits || 0} disabled className="mt-1.5" />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <Link href="/subscription">
                    <Button className="w-full">Manage Subscription</Button>
                  </Link>
                </div>
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
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Theme Selection</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Color Theme</Label>
                      <Select 
                        value={userTheme?.selectedTheme || 'default-dark'}
                        onValueChange={(value) => setThemeMutation.mutate({ themeId: value })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {THEMES.map((theme) => {
                            const isLocked = theme.id !== 'default-dark' && !hasPremiumThemes;
                            return (
                              <SelectItem 
                                key={theme.id} 
                                value={theme.id}
                                disabled={isLocked}
                              >
                                <div className="flex items-center gap-2">
                                  {isLocked && <Lock className="h-3 w-3" />}
                                  <span>{theme.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {!hasPremiumThemes && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Purchase Premium Themes add-on for £3 to unlock all themes
                        </p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {THEMES.map((theme) => {
                        const isLocked = theme.id !== 'default-dark' && !hasPremiumThemes;
                        const isSelected = userTheme?.selectedTheme === theme.id;
                        return (
                          <div
                            key={theme.id}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              isSelected ? 'border-primary' : 'border-border'
                            } ${isLocked ? 'opacity-50' : 'cursor-pointer hover:border-primary/50'}`}
                            onClick={() => !isLocked && setThemeMutation.mutate({ themeId: theme.id })}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-sm">{theme.name}</span>
                              {isLocked && <Lock className="h-3 w-3" />}
                            </div>
                            <p className="text-xs text-muted-foreground">{theme.description}</p>
                            <div className="flex gap-1 mt-2">
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${theme.colors.primary})` }} />
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${theme.colors.accent})` }} />
                              <div className="w-4 h-4 rounded" style={{ backgroundColor: `hsl(${theme.colors.background})` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {!hasPremiumThemes && (
                  <div className="border-t pt-6">
                    <Link href="/addons">
                      <Button className="w-full">
                        <Palette className="h-4 w-4 mr-2" />
                        Unlock Premium Themes - £3
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts">
            <Card>
              <CardHeader>
                <CardTitle>Alert Preferences</CardTitle>
                <CardDescription>Configure when and how you receive alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Storage Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when storage is running low</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="ml-6 space-y-2">
                    <div>
                      <Label className="text-sm">First Warning Threshold</Label>
                      <Input type="number" defaultValue="80" className="w-24" />%
                    </div>
                    <div>
                      <Label className="text-sm">Critical Warning Threshold</Label>
                      <Input type="number" defaultValue="95" className="w-24" />%
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>AI Credits Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when credits are running low</p>
                    </div>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="ml-6">
                    <Label className="text-sm">Alert When Credits Below</Label>
                    <Input type="number" defaultValue="10" className="w-24" />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label>Notification Channels</Label>
                    <p className="text-sm text-muted-foreground mb-3">Choose how you want to receive alerts</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Email Notifications</Label>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">In-App Notifications</Label>
                    <input type="checkbox" className="h-5 w-5" defaultChecked />
                  </div>
                </div>

                <Button className="w-full">Save Alert Preferences</Button>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Alert History</CardTitle>
                <CardDescription>View your past alert notifications</CardDescription>
              </CardHeader>
              <CardContent>
                <AlertHistory />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Configure your preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
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
