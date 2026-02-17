import { useState } from 'react';
import { useAuth } from '@/_core/hooks/useAuth';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Lock, Check, AlertCircle } from 'lucide-react';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  input: string;
  ring: string;
}

const DEFAULT_COLORS: ThemeColors = {
  primary: '#3b82f6',
  secondary: '#1e293b',
  accent: '#0ea5e9',
  background: '#0f172a',
  foreground: '#f1f5f9',
  muted: '#334155',
  mutedForeground: '#94a3b8',
  border: '#1e293b',
  input: '#1e293b',
  ring: '#3b82f6',
};

const COLOR_LABELS: Record<keyof ThemeColors, string> = {
  primary: 'Primary Color',
  secondary: 'Secondary Color',
  accent: 'Accent Color',
  background: 'Background',
  foreground: 'Foreground',
  muted: 'Muted',
  mutedForeground: 'Muted Foreground',
  border: 'Border',
  input: 'Input',
  ring: 'Ring',
};

export default function CustomThemeEditor() {
  const { user, loading: authLoading } = useAuth();
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [colors, setColors] = useState<ThemeColors>(DEFAULT_COLORS);
  const [loading, setLoading] = useState(false);
  const [purchased, setPurchased] = useState(false);

  const createCheckout = trpc.payment.createCheckout.useMutation();

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleResetColors = () => {
    setColors(DEFAULT_COLORS);
    alert('Theme colors have been reset to defaults.');
  };

  const handlePurchaseTheme = async () => {
    if (!user?.id) {
      alert('Please log in to purchase custom themes.');
      return;
    }

    setLoading(true);
    try {
      const session = await createCheckout.mutateAsync({
        planId: 'custom_theme',
        customAmount: 4.99,
      });

      if (session?.url) {
        window.open(session.url, '_blank');
        alert('Opening Stripe checkout in a new tab...');
      } else {
        alert('Checkout session created. Redirecting...');
      }
    } catch (error) {
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-white">Custom Theme Creator</h1>
          <p className="text-slate-400">Design your own theme with custom colors • £4.99 one-time purchase</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Theme Name */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Theme Name</CardTitle>
                <CardDescription className="text-slate-400">Give your theme a unique name</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  value={themeName}
                  onChange={(e) => setThemeName(e.target.value)}
                  placeholder="My Custom Theme"
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </CardContent>
            </Card>

            {/* Color Picker Grid */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Color Scheme</CardTitle>
                <CardDescription className="text-slate-400">Customize each color for your theme</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(colors).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-slate-300">
                        {COLOR_LABELS[key as keyof ThemeColors]}
                      </label>
                      <div className="flex gap-2">
                        <div
                          className="w-12 h-12 rounded border-2 border-slate-600 cursor-pointer hover:border-slate-500 transition"
                          style={{ backgroundColor: value }}
                          onClick={() => document.getElementById(`color-${key}`)?.click()}
                        />
                        <input
                          id={`color-${key}`}
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                          className="hidden"
                        />
                        <Input
                          value={value}
                          onChange={(e) => handleColorChange(key as keyof ThemeColors, e.target.value)}
                          placeholder="#000000"
                          className="bg-slate-700 border-slate-600 text-white font-mono text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  onClick={handleResetColors}
                  variant="outline"
                  className="w-full mt-6 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Reset to Defaults
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Purchase Panel */}
          <div className="space-y-6">
            {/* Live Preview */}
            <Card className="bg-slate-800 border-slate-700" style={{ backgroundColor: colors.background }}>
              <CardHeader>
                <CardTitle className="text-white" style={{ color: colors.foreground }}>
                  Preview
                </CardTitle>
                <CardDescription style={{ color: colors.mutedForeground }}>
                  Live theme preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sample Components */}
                <div
                  className="p-3 rounded border"
                  style={{
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }}
                >
                  <p className="text-sm font-semibold">Sample Card</p>
                  <p className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                    This is how your theme will look
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-2 rounded text-sm font-medium transition"
                    style={{
                      backgroundColor: colors.primary,
                      color: colors.foreground,
                    }}
                  >
                    Primary
                  </button>
                  <button
                    className="flex-1 px-3 py-2 rounded text-sm font-medium border"
                    style={{
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                      color: colors.foreground,
                    }}
                  >
                    Secondary
                  </button>
                </div>

                <div
                  className="p-2 rounded border"
                  style={{
                    backgroundColor: colors.input,
                    borderColor: colors.border,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Input field"
                    className="w-full bg-transparent text-sm outline-none"
                    style={{ color: colors.foreground }}
                  />
                </div>

                <div
                  className="p-2 rounded"
                  style={{
                    backgroundColor: colors.accent,
                    color: colors.foreground,
                  }}
                >
                  <p className="text-sm font-medium">Accent Color</p>
                </div>
              </CardContent>
            </Card>

            {/* Purchase Card */}
            <Card className="bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Premium Feature
                </CardTitle>
                <CardDescription className="text-blue-200">
                  Save and use your custom theme
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-blue-100">
                    ✓ Save custom theme permanently
                  </p>
                  <p className="text-sm text-blue-100">
                    ✓ Apply to your account
                  </p>
                  <p className="text-sm text-blue-100">
                    ✓ One-time payment
                  </p>
                </div>

                <div className="pt-4 border-t border-blue-700">
                  <p className="text-3xl font-bold text-white">£4.99</p>
                  <p className="text-xs text-blue-200 mt-1">one-time purchase</p>
                </div>

                <Button
                  onClick={handlePurchaseTheme}
                  disabled={loading || !themeName.trim()}
                  className="w-full bg-white text-blue-900 hover:bg-blue-50 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : purchased ? (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Purchased
                    </>
                  ) : (
                    'Purchase & Save Theme'
                  )}
                </Button>

                <p className="text-xs text-blue-200 text-center">
                  Secure payment powered by Stripe
                </p>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <AlertCircle className="h-4 w-4" />
                  How it Works
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-300">
                <p>1. Design your theme using the color picker</p>
                <p>2. Preview changes in real-time</p>
                <p>3. Purchase for £4.99 (one-time)</p>
                <p>4. Theme is saved to your account</p>
                <p>5. Apply anytime from settings</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
