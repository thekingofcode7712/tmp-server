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
  const { data: bundles, isLoading: bundlesLoading } = trpc.themes.getAllBundles.useQuery();
  const purchaseTheme = trpc.themes.purchaseTheme.useMutation();
  const purchaseAllThemes = trpc.themes.purchaseAllThemes.useMutation();
  const purchaseBundle = trpc.themes.purchaseBundle.useMutation();
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

  const handlePurchaseBundle = async (bundleId: number, bundleName: string) => {
    try {
      setPurchasing(true);
      const result = await purchaseBundle.mutateAsync({ bundleId });
      if (result.checkoutUrl) {
        toast.info(`Redirecting to checkout for ${bundleName}...`);
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

        {/* Stats */}
        <Card className="p-6">
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">Your Themes</div>
            <div className="text-3xl font-bold">{ownedCount} / {totalCount}</div>
            <div className="text-sm text-muted-foreground">
              {ownedCount === totalCount ? 'You own all themes!' : `${totalCount - ownedCount} themes remaining`}
            </div>
          </div>
        </Card>

        {/* Theme Bundles */}
        {bundles && bundles.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Theme Bundles</h2>
            <div className="grid gap-4 md:grid-cols-3">
              {bundles.map((bundle) => {
                const themeIds = bundle.themeIds as number[];
                const bundleThemes = allThemes?.filter(t => themeIds.includes(t.id)) || [];
                const savingsPercent = Math.round((bundle.savings / (bundle.price + bundle.savings)) * 100);
                
                return (
                  <Card key={bundle.id} className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">{bundle.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{bundle.description}</p>
                      </div>
                      
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold">£{(bundle.price / 100).toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground line-through">
                          £{((bundle.price + bundle.savings) / 100).toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="inline-block px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                        Save {savingsPercent}% (£{(bundle.savings / 100).toFixed(2)})
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        Includes {themeIds.length} themes:
                        <div className="mt-2 flex flex-wrap gap-1">
                          {bundleThemes.slice(0, 3).map(t => (
                            <span key={t.id} className="px-2 py-1 bg-background/50 rounded text-xs">
                              {t.name}
                            </span>
                          ))}
                          {themeIds.length > 3 && (
                            <span className="px-2 py-1 bg-background/50 rounded text-xs">
                              +{themeIds.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => handlePurchaseBundle(bundle.id, bundle.name)}
                        disabled={purchasing}
                        className="w-full"
                        size="lg"
                      >
                        Purchase Bundle
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

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
