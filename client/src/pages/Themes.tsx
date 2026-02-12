import { useState } from 'react';
import { trpc } from '../lib/trpc';
import DashboardLayout from '../components/DashboardLayout';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Lock, Check, Palette } from 'lucide-react';
import { toast } from 'sonner';

export function Themes() {
  const { data: allThemes, isLoading: themesLoading } = trpc.themes.getAll.useQuery();
  const { data: userThemes, isLoading: userThemesLoading } = trpc.themes.getUserThemes.useQuery();
  const purchaseTheme = trpc.themes.purchaseTheme.useMutation();
  const purchaseAllThemes = trpc.themes.purchaseAllThemes.useMutation();
  const setActiveTheme = trpc.user.setActiveTheme.useMutation();
  const { data: user } = trpc.auth.me.useQuery();

  const [purchasing, setPurchasing] = useState(false);
  const [activating, setActivating] = useState(false);

  const activeThemeId = user?.customTheme ? parseInt(user.customTheme) : null;

  const hasTheme = (themeId: number) => {
    return userThemes?.some(ut => ut.theme.id === themeId) || false;
  };

  const handlePurchaseTheme = async (themeId: number, themeName: string) => {
    try {
      setPurchasing(true);
      const result = await purchaseTheme.mutateAsync({ themeId });
      if (result.checkoutUrl) {
        toast.info(`Redirecting to checkout for ${themeName}...`);
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchaseAll = async () => {
    try {
      setPurchasing(true);
      const result = await purchaseAllThemes.mutateAsync();
      if (result.checkoutUrl) {
        toast.info('Redirecting to checkout for All Themes Bundle...');
        window.location.href = result.checkoutUrl;
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setPurchasing(false);
    }
  };

  const handleActivateTheme = async (themeId: number, themeName: string) => {
    try {
      setActivating(true);
      await setActiveTheme.mutateAsync({ themeId });
      toast.success(`${themeName} activated! Refreshing...`);
      // Reload page to apply new theme
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to activate theme');
    } finally {
      setActivating(false);
    }
  };

  const handleResetTheme = async () => {
    try {
      setActivating(true);
      // Set theme to 'default' to reset
      await setActiveTheme.mutateAsync({ themeId: 0 }); // 0 or null means default
      toast.success('Reset to default theme! Refreshing...');
      setTimeout(() => window.location.reload(), 1000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset theme');
    } finally {
      setActivating(false);
    }
  };

  if (themesLoading || userThemesLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading themes...</div>
        </div>
      </DashboardLayout>
    );
  }

  const ownedCount = userThemes?.length || 0;
  const totalCount = allThemes?.length || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Palette className="h-8 w-8" />
              Theme Marketplace
            </h1>
            <p className="text-muted-foreground mt-2">
              Customize your experience with premium color schemes
            </p>
          </div>
          {activeThemeId && activeThemeId !== 0 && (
            <Button
              variant="outline"
              onClick={handleResetTheme}
              disabled={activating}
            >
              Reset to Default Theme
            </Button>
          )}
        </div>

        {/* Stats & Bundle Offer */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-6">
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Your Themes</div>
              <div className="text-3xl font-bold">{ownedCount} / {totalCount}</div>
              <div className="text-sm text-muted-foreground">
                {ownedCount === totalCount ? 'You own all themes!' : `${totalCount - ownedCount} themes remaining`}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-primary/5 border-primary">
            <div className="space-y-3">
              <div className="font-semibold text-lg">All Themes Bundle</div>
              <div className="text-2xl font-bold">£34.99</div>
              <div className="text-sm text-muted-foreground">
                Save £34! Get all {totalCount} themes instead of £{totalCount * 3}
              </div>
              <Button 
                onClick={handlePurchaseAll}
                disabled={purchasing || ownedCount === totalCount}
                className="w-full"
              >
                {ownedCount === totalCount ? 'Already Own All' : 'Buy All Themes'}
              </Button>
            </div>
          </Card>
        </div>

        {/* Theme Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {allThemes?.map((theme) => {
            const owned = hasTheme(theme.id);
            const colors = theme.colors as { primary: string; secondary: string; accent: string; background: string; foreground: string; card: string; muted: string };
            
            return (
              <Card key={theme.id} className={`p-6 relative ${owned ? 'border-primary' : ''}`}>
                {owned && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-1">
                      <Check className="h-4 w-4" />
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Theme Preview */}
                  <div className="h-24 rounded-lg overflow-hidden flex">
                    <div 
                      className="flex-1" 
                      style={{ backgroundColor: `hsl(${colors.primary})` }}
                    />
                    <div 
                      className="flex-1" 
                      style={{ backgroundColor: `hsl(${colors.secondary})` }}
                    />
                    <div 
                      className="flex-1" 
                      style={{ backgroundColor: `hsl(${colors.accent})` }}
                    />
                  </div>

                  {/* Theme Info */}
                  <div>
                    <h3 className="font-semibold text-lg">{theme.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {theme.description}
                    </p>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex gap-2">
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: `hsl(${colors.primary})` }}
                      title="Primary"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: `hsl(${colors.secondary})` }}
                      title="Secondary"
                    />
                    <div 
                      className="w-8 h-8 rounded-full border-2 border-border"
                      style={{ backgroundColor: `hsl(${colors.accent})` }}
                      title="Accent"
                    />
                  </div>

                  {/* Purchase/Activate Button */}
                  {owned ? (
                    activeThemeId === theme.id ? (
                      <Button variant="outline" className="w-full" disabled>
                        <Check className="h-4 w-4 mr-2" />
                        Active
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleActivateTheme(theme.id, theme.name)}
                        disabled={activating}
                        className="w-full"
                      >
                        Activate Theme
                      </Button>
                    )
                  ) : (
                    <Button
                      onClick={() => handlePurchaseTheme(theme.id, theme.name)}
                      disabled={purchasing}
                      className="w-full"
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      Unlock for £3
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
