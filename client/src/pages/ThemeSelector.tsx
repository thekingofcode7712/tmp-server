/**
 * Theme Selector Page
 * Browse, preview, and apply purchased custom UI schemes in real-time
 */

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Theme {
  id: string;
  name: string;
  description?: string;
  colors: Record<string, string>;
  createdAt?: Date;
  isPurchased?: boolean;
}

export function ThemeSelector() {
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'purchased' | 'available'>('all');
  const [previewMode, setPreviewMode] = useState<'colors' | 'ui'>('colors');
  const [appliedThemeId, setAppliedThemeId] = useState<string | null>(null);

  // Fetch all themes
  const allThemesQuery = trpc.customUISchemes.getAll.useQuery();
  
  // Fetch user's purchased themes
  const userThemesQuery = trpc.customUISchemes.getUserSchemes.useQuery();
  
  // Apply theme mutation
  const applyThemeMutation = trpc.customUISchemes.applyScheme.useMutation();

  // Built-in themes
  const builtInThemes: Theme[] = [
    {
      id: 'ocean',
      name: 'Ocean',
      description: 'Cool blues and aqua tones',
      colors: {
        primary: '#0EA5E9',
        secondary: '#06B6D4',
        accent: '#14B8A6',
        background: '#F0F9FF',
        foreground: '#0C2340',
        muted: '#E0F2FE',
        ring: '#0EA5E9',
      },
    },
    {
      id: 'forest',
      name: 'Forest',
      description: 'Natural greens and earth tones',
      colors: {
        primary: '#16A34A',
        secondary: '#15803D',
        accent: '#22C55E',
        background: '#F0FDF4',
        foreground: '#15803D',
        muted: '#DCFCE7',
        ring: '#16A34A',
      },
    },
    {
      id: 'sunset',
      name: 'Sunset',
      description: 'Warm oranges and reds',
      colors: {
        primary: '#EA580C',
        secondary: '#DC2626',
        accent: '#F97316',
        background: '#FEF2F2',
        foreground: '#7C2D12',
        muted: '#FEE2E2',
        ring: '#EA580C',
      },
    },
    {
      id: 'midnight',
      name: 'Midnight',
      description: 'Dark purples and deep blues',
      colors: {
        primary: '#7C3AED',
        secondary: '#6366F1',
        accent: '#A855F7',
        background: '#1E1B4B',
        foreground: '#F3E8FF',
        muted: '#4C1D95',
        ring: '#7C3AED',
      },
    },
  ];

  // Combine themes
  const allThemes = useMemo(() => {
    const customThemes = allThemesQuery.data || [];
    const purchased = userThemesQuery.data || [];
    const purchasedIds = new Set(purchased.map(t => t.id));

    return [
      ...builtInThemes,
      ...customThemes.map(t => ({
        ...t,
        isPurchased: purchasedIds.has(t.id),
      })),
    ];
  }, [allThemesQuery.data, userThemesQuery.data]);

  // Filter themes
  const filteredThemes = useMemo(() => {
    let themes = allThemes;

    if (filterType === 'purchased') {
      themes = themes.filter(t => t.isPurchased || builtInThemes.some(bt => bt.id === t.id));
    } else if (filterType === 'available') {
      themes = themes.filter(t => !t.isPurchased && !builtInThemes.some(bt => bt.id === t.id));
    }

    if (searchQuery) {
      themes = themes.filter(
        t =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return themes;
  }, [allThemes, filterType, searchQuery]);

  const handleApplyTheme = async (theme: Theme) => {
    if (!theme.id) return;
    try {
      await applyThemeMutation.mutateAsync({ schemeId: theme.id });
      setAppliedThemeId(theme.id);
      alert(`Theme "${theme.name}" applied successfully!`);
    } catch (error) {
      console.error('Error applying theme:', error);
      alert('Failed to apply theme');
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Theme Selector</h1>
          <p className="text-muted-foreground">
            Browse and apply custom UI color schemes to personalize your interface
          </p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Search</label>
            <Input
              type="text"
              placeholder="Search themes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Filter</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="all">All Themes</option>
              <option value="purchased">Purchased</option>
              <option value="available">Available</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Preview Mode</label>
            <select
              value={previewMode}
              onChange={(e) => setPreviewMode(e.target.value as any)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="colors">Color Swatches</option>
              <option value="ui">UI Preview</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Theme Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredThemes.map((theme) => (
                <Card
                  key={theme.id}
                  className={`p-4 cursor-pointer transition-all border-2 ${
                    selectedTheme?.id === theme.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedTheme(theme)}
                >
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-foreground">{theme.name}</h3>
                    {theme.description && (
                      <p className="text-xs text-muted-foreground">{theme.description}</p>
                    )}
                  </div>

                  {/* Color Preview Dots */}
                  <div className="flex gap-2 mb-3">
                    {Object.values(theme.colors).slice(0, 5).map((color, idx) => (
                      <div
                        key={idx}
                        className="w-6 h-6 rounded-full border border-border"
                        style={{ backgroundColor: color } as any}
                        title={color as string}
                      />
                    ))}
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    {appliedThemeId === theme.id && (
                      <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded">
                        Applied
                      </span>
                    )}
                    {theme.isPurchased === false && !builtInThemes.some(bt => bt.id === theme.id) && (
                      <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        £4.99
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Preview Panel */}
          {selectedTheme && (
            <div className="lg:col-span-2">
              <Card className="p-6 bg-card border-border sticky top-6">
                <h2 className="text-2xl font-bold text-card-foreground mb-4">{selectedTheme.name}</h2>

                {selectedTheme.description && (
                  <p className="text-sm text-muted-foreground mb-6">{selectedTheme.description}</p>
                )}

                {/* Preview Content */}
                {previewMode === 'colors' ? (
                  <div className="space-y-3 mb-6">
                    {Object.entries(selectedTheme.colors).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded border border-border"
                          style={{ backgroundColor: value }}
                        />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-card-foreground capitalize">{key}</p>
                          <p className="text-xs text-muted-foreground font-mono">{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className="p-6 rounded-lg border border-border mb-6 space-y-3"
                    style={{
                      backgroundColor: (selectedTheme.colors as any).background,
                    } as any}
                  >
                    <div
                      className="px-4 py-2 rounded font-medium text-sm"
                      style={{
                        backgroundColor: (selectedTheme.colors as any).primary,
                        color: (selectedTheme.colors as any).foreground,
                      }}
                    >
                      Primary Button
                    </div>
                    <div
                      className="px-4 py-2 rounded text-sm"
                      style={{
                        backgroundColor: (selectedTheme.colors as any).muted,
                        color: (selectedTheme.colors as any).foreground,
                      }}
                    >
                      Muted Background
                    </div>
                    <div
                      className="text-sm"
                      style={{
                        color: (selectedTheme.colors as any).foreground,
                      }}
                    >
                      Regular Text Content
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {appliedThemeId === selectedTheme.id ? (
                    <Button disabled className="w-full">
                      ✓ Applied
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleApplyTheme(selectedTheme)}
                      disabled={applyThemeMutation.isPending}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {applyThemeMutation.isPending ? 'Applying...' : 'Apply Theme'}
                    </Button>
                  )}

                  {selectedTheme.isPurchased === false &&
                    !builtInThemes.some(bt => bt.id === selectedTheme.id) && (
                      <Button variant="outline" className="w-full">
                        Purchase for £4.99
                      </Button>
                    )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ThemeSelector;
