/**
 * Custom UI Scheme Editor
 * Allows users to create and purchase custom UI color schemes
 * Price: £4.99 per scheme (one-time payment)
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

const DEFAULT_COLORS = {
  primary: '#3B82F6',
  secondary: '#10B981',
  accent: '#F59E0B',
  background: '#FFFFFF',
  foreground: '#000000',
  muted: '#E5E7EB',
  ring: '#3B82F6',
};

export function CustomUISchemeEditor() {
  const [schemeName, setSchemeName] = useState('');
  const [schemeDescription, setSchemeDescription] = useState('');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [selectedColorKey, setSelectedColorKey] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createSchemeMutation = trpc.customUISchemes.createScheme.useMutation();
  const checkoutMutation = trpc.customUISchemes.createCheckout.useMutation();
  const pricingQuery = trpc.customUISchemes.getPricing.useQuery();

  const handleColorChange = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleCreateScheme = async () => {
    if (!schemeName.trim()) {
      alert('Please enter a scheme name');
      return;
    }

    setIsCreating(true);
    try {
      const scheme = await createSchemeMutation.mutateAsync({
        name: schemeName,
        description: schemeDescription,
        colors,
      });

      // Proceed to checkout
      const checkout = await checkoutMutation.mutateAsync({
        schemeId: scheme.id,
      });

      if (checkout.checkoutUrl) {
        window.open(checkout.checkoutUrl, '_blank');
      }
    } catch (error) {
      console.error('Error creating scheme:', error);
      alert('Failed to create scheme. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleResetColors = () => {
    setColors(DEFAULT_COLORS);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Custom UI Color Schemes</h1>
          <p className="text-muted-foreground">
            Create your own custom color scheme for the server interface. {pricingQuery.data && (
              <span className="font-semibold">£{(pricingQuery.data.price / 100).toFixed(2)} per scheme</span>
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          <div className="lg:col-span-2">
            <Card className="p-6 bg-card border-border">
              <h2 className="text-2xl font-semibold text-card-foreground mb-6">Create New Scheme</h2>

              {/* Scheme Details */}
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Scheme Name
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g., Ocean Blue, Forest Green"
                    value={schemeName}
                    onChange={(e) => setSchemeName(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Description (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="Describe your color scheme"
                    value={schemeDescription}
                    onChange={(e) => setSchemeDescription(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Color Picker Grid */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-card-foreground mb-4">Colors</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(colors).map(([key, value]) => (
                    <div key={key} className="flex flex-col items-center gap-2">
                      <div
                        className="w-16 h-16 rounded-lg border-2 border-border cursor-pointer hover:border-ring transition-colors"
                        style={{ backgroundColor: value }}
                        onClick={() => setSelectedColorKey(key)}
                      />
                      <label className="text-xs font-medium text-muted-foreground capitalize">
                        {key}
                      </label>
                      <Input
                        type="text"
                        value={value}
                        onChange={(e) => handleColorChange(key, e.target.value)}
                        placeholder="#000000"
                        className="w-full text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Color Picker Input */}
              {selectedColorKey && (
                <div className="mb-8 p-4 bg-muted rounded-lg">
                  <label className="block text-sm font-medium text-card-foreground mb-2">
                    Edit {selectedColorKey.toUpperCase()}
                  </label>
                  <input
                    type="color"
                    value={colors[selectedColorKey as keyof typeof colors]}
                    onChange={(e) => handleColorChange(selectedColorKey, e.target.value)}
                    className="w-full h-12 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handleResetColors}
                  variant="outline"
                  className="flex-1"
                >
                  Reset to Default
                </Button>
                <Button
                  onClick={handleCreateScheme}
                  disabled={isCreating || !schemeName.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {isCreating ? 'Creating...' : 'Create & Purchase'}
                </Button>
              </div>
            </Card>
          </div>

          {/* Preview Panel */}
          <div>
            <Card className="p-6 bg-card border-border sticky top-6">
              <h3 className="text-lg font-semibold text-card-foreground mb-4">Preview</h3>

              {/* Color Swatches */}
              <div className="space-y-2 mb-6">
                {Object.entries(colors).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded border border-border"
                      style={{ backgroundColor: value }}
                    />
                    <span className="text-xs text-muted-foreground capitalize flex-1">{key}</span>
                    <span className="text-xs font-mono text-muted-foreground">{value}</span>
                  </div>
                ))}
              </div>

              {/* UI Preview */}
              <div className="space-y-3 p-4 rounded-lg border border-border" style={{ backgroundColor: colors.background }}>
                <div
                  className="px-3 py-2 rounded text-sm font-medium"
                  style={{ backgroundColor: colors.primary, color: colors.foreground }}
                >
                  Primary Button
                </div>
                <div
                  className="px-3 py-2 rounded text-sm"
                  style={{ backgroundColor: colors.muted, color: colors.foreground }}
                >
                  Muted Background
                </div>
                <div
                  className="text-sm"
                  style={{ color: colors.foreground }}
                >
                  Foreground Text
                </div>
              </div>

              {/* Pricing Info */}
              {pricingQuery.data && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">
                    <strong>Price:</strong> £{(pricingQuery.data.price / 100).toFixed(2)}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {pricingQuery.data.features.map((feature: string, idx: number) => (
                      <li key={idx}>✓ {feature}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomUISchemeEditor;
