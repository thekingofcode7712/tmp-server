import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { THEMES } from '@/lib/themes';

export function useApplyTheme() {
  const { data: userTheme } = trpc.user.getTheme.useQuery();

  useEffect(() => {
    if (!userTheme?.selectedTheme) return;

    const theme = THEMES.find(t => t.id === userTheme.selectedTheme);
    if (!theme) return;

    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });
  }, [userTheme?.selectedTheme]);
}
