/**
 * Theme System
 * Manages application themes with color schemes and styling
 */

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: {
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
  };
  version: string;
  createdAt: Date;
  isDefault: boolean;
}

/**
 * Built-in themes
 */
export const BUILT_IN_THEMES: Record<string, Theme> = {
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Default dark theme with blue accents',
    colors: {
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
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-01'),
    isDefault: true,
  },

  light: {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme with gray accents',
    colors: {
      primary: '#2563eb',
      secondary: '#f3f4f6',
      accent: '#0284c7',
      background: '#ffffff',
      foreground: '#1f2937',
      muted: '#e5e7eb',
      mutedForeground: '#6b7280',
      border: '#e5e7eb',
      input: '#f3f4f6',
      ring: '#2563eb',
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-01'),
    isDefault: false,
  },

  ocean: {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calming ocean-inspired theme with teal and blue',
    colors: {
      primary: '#06b6d4',
      secondary: '#0c4a6e',
      accent: '#0891b2',
      background: '#082f49',
      foreground: '#ecf0f1',
      muted: '#164e63',
      mutedForeground: '#a8dadc',
      border: '#0c4a6e',
      input: '#0c4a6e',
      ring: '#06b6d4',
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-17'),
    isDefault: false,
  },

  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Nature-inspired theme with green and earth tones',
    colors: {
      primary: '#10b981',
      secondary: '#1f2937',
      accent: '#059669',
      background: '#0f172a',
      foreground: '#f0fdf4',
      muted: '#047857',
      mutedForeground: '#a7f3d0',
      border: '#1f2937',
      input: '#1f2937',
      ring: '#10b981',
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-17'),
    isDefault: false,
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm sunset theme with orange and pink gradients',
    colors: {
      primary: '#f97316',
      secondary: '#7c2d12',
      accent: '#ea580c',
      background: '#1c1410',
      foreground: '#fef3c7',
      muted: '#92400e',
      mutedForeground: '#fed7aa',
      border: '#7c2d12',
      input: '#7c2d12',
      ring: '#f97316',
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-17'),
    isDefault: false,
  },

  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep dark theme with purple and indigo accents',
    colors: {
      primary: '#8b5cf6',
      secondary: '#1e1b4b',
      accent: '#7c3aed',
      background: '#0f0a1a',
      foreground: '#f3e8ff',
      muted: '#4c1d95',
      mutedForeground: '#ddd6fe',
      border: '#1e1b4b',
      input: '#1e1b4b',
      ring: '#8b5cf6',
    },
    version: '1.0.0',
    createdAt: new Date('2026-02-17'),
    isDefault: false,
  },
};

/**
 * Get theme by ID
 */
export function getTheme(themeId: string): Theme | null {
  return BUILT_IN_THEMES[themeId] || null;
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(BUILT_IN_THEMES);
}

/**
 * Get default theme
 */
export function getDefaultTheme(): Theme {
  return BUILT_IN_THEMES.dark;
}

/**
 * Validate theme colors
 */
export function validateThemeColors(colors: Partial<Theme['colors']>): boolean {
  const requiredColors = [
    'primary',
    'secondary',
    'accent',
    'background',
    'foreground',
    'muted',
    'mutedForeground',
    'border',
    'input',
    'ring',
  ];

  return requiredColors.every(color => color in colors);
}

/**
 * Generate CSS variables from theme
 */
export function generateThemeCSS(theme: Theme): string {
  const cssVars = Object.entries(theme.colors)
    .map(([key, value]) => `--color-${key}: ${value};`)
    .join('\n  ');

  return `:root {\n  ${cssVars}\n}`;
}

export default {
  getTheme,
  getAllThemes,
  getDefaultTheme,
  validateThemeColors,
  generateThemeCSS,
  BUILT_IN_THEMES,
};
