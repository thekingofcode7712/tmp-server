import { useEffect } from 'react';
import { trpc } from '../lib/trpc';

export function useApplyPurchasedTheme() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: allThemes } = trpc.themes.getAll.useQuery();

  useEffect(() => {
    if (!user?.customTheme || !allThemes) return;

    const themeId = parseInt(user.customTheme);
    const theme = allThemes.find(t => t.id === themeId);
    
    if (!theme) return;

    const colors = theme.colors as {
      primary: string;
      secondary: string;
      accent: string;
      background: string;
      foreground: string;
      card: string;
      muted: string;
      border: string;
      input: string;
      ring: string;
      destructive: string;
      'destructive-foreground': string;
      'muted-foreground': string;
      'accent-foreground': string;
      'popover': string;
      'popover-foreground': string;
      'card-foreground': string;
      'secondary-foreground': string;
      'primary-foreground': string;
    };

    // Apply colors to CSS variables
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });

    console.log(`[Theme] Applied theme: ${theme.name}`);
  }, [user?.customTheme, allThemes]);
}
