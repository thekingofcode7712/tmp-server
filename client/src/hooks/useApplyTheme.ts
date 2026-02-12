import { useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { THEMES } from '@/lib/themes';

export function useApplyTheme() {
  const { data: userTheme } = trpc.user.getTheme.useQuery();

  useEffect(() => {
    if (!userTheme) return;

    const mode = userTheme.themeMode || 'dark';
    const themeId = userTheme.selectedTheme || 'default-dark';
    
    // Find theme matching both ID and mode, or fallback to default for that mode
    let theme = THEMES.find(t => t.id === themeId && t.mode === mode);
    if (!theme) {
      // Fallback to default theme for the selected mode
      theme = THEMES.find(t => t.id === `default-${mode}`);
    }
    if (!theme) return;

    // Apply theme colors to CSS variables
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      // Convert camelCase to kebab-case
      const cssVar = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      root.style.setProperty(`--${cssVar}`, value);
    });
  }, [userTheme?.selectedTheme, userTheme?.themeMode]);
}
