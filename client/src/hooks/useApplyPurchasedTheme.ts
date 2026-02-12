import { useEffect } from 'react';
import { trpc } from '../lib/trpc';

export function useApplyPurchasedTheme() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: allThemes } = trpc.themes.getAll.useQuery();

  useEffect(() => {
    const root = document.documentElement;
    
    // If no custom theme or set to default, reset to default theme
    if (!user?.customTheme || user.customTheme === 'default' || !allThemes) {
      // Reset to default by removing custom properties
      const defaultVars = [
        'primary', 'secondary', 'accent', 'background', 'foreground',
        'card', 'muted', 'border', 'input', 'ring', 'destructive',
        'destructive-foreground', 'muted-foreground', 'accent-foreground',
        'popover', 'popover-foreground', 'card-foreground',
        'secondary-foreground', 'primary-foreground'
      ];
      
      defaultVars.forEach(key => {
        root.style.removeProperty(`--${key}`);
      });
      
      console.log('[Theme] Reset to default theme');
      return;
    }

    const themeId = parseInt(user.customTheme);
    const theme = allThemes.find(t => t.id === themeId);
    
    if (!theme) {
      console.warn('[Theme] Theme not found:', themeId);
      return;
    }

    const colors = theme.colors as Record<string, string>;

    // Apply colors to CSS variables
    // Colors are stored as HSL values like "142 76% 36%"
    // Wrap them with hsl() for Tailwind CSS 4 compatibility
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, `hsl(${value})`);
    });

    console.log(`[Theme] Applied theme: ${theme.name}`, colors);
  }, [user?.customTheme, allThemes]);
}
