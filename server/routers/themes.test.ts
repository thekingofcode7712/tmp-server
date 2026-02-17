import { describe, it, expect } from 'vitest';
import {
  getTheme,
  getAllThemes,
  getDefaultTheme,
  validateThemeColors,
  generateThemeCSS,
  BUILT_IN_THEMES,
} from '../themes';

describe('Themes System', () => {
  describe('getTheme', () => {
    it('should return theme by ID', () => {
      const theme = getTheme('dark');
      expect(theme).toBeDefined();
      expect(theme?.id).toBe('dark');
      expect(theme?.name).toBe('Dark');
    });

    it('should return null for non-existent theme', () => {
      const theme = getTheme('non-existent');
      expect(theme).toBeNull();
    });

    it('should return all built-in themes', () => {
      const darkTheme = getTheme('dark');
      const lightTheme = getTheme('light');
      const oceanTheme = getTheme('ocean');
      const forestTheme = getTheme('forest');
      const sunsetTheme = getTheme('sunset');
      const midnightTheme = getTheme('midnight');

      expect(darkTheme).toBeDefined();
      expect(lightTheme).toBeDefined();
      expect(oceanTheme).toBeDefined();
      expect(forestTheme).toBeDefined();
      expect(sunsetTheme).toBeDefined();
      expect(midnightTheme).toBeDefined();
    });
  });

  describe('getAllThemes', () => {
    it('should return all themes', () => {
      const themes = getAllThemes();
      expect(themes.length).toBeGreaterThan(0);
      expect(themes.length).toBe(Object.keys(BUILT_IN_THEMES).length);
    });

    it('should include at least 6 themes', () => {
      const themes = getAllThemes();
      expect(themes.length).toBeGreaterThanOrEqual(6);
    });

    it('should have unique IDs', () => {
      const themes = getAllThemes();
      const ids = themes.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getDefaultTheme', () => {
    it('should return dark theme as default', () => {
      const defaultTheme = getDefaultTheme();
      expect(defaultTheme.id).toBe('dark');
      expect(defaultTheme.isDefault).toBe(true);
    });
  });

  describe('validateThemeColors', () => {
    it('should validate complete color object', () => {
      const theme = getTheme('dark');
      expect(validateThemeColors(theme!.colors)).toBe(true);
    });

    it('should reject incomplete color object', () => {
      const incompleteColors = { primary: '#3b82f6' };
      expect(validateThemeColors(incompleteColors)).toBe(false);
    });
  });

  describe('generateThemeCSS', () => {
    it('should generate CSS variables', () => {
      const theme = getTheme('dark');
      const css = generateThemeCSS(theme!);

      expect(css).toContain(':root');
      expect(css).toContain('--color-primary');
      expect(css).toContain('--color-background');
      expect(css).toContain('--color-foreground');
    });

    it('should include all color variables', () => {
      const theme = getTheme('dark');
      const css = generateThemeCSS(theme!);

      Object.keys(theme!.colors).forEach(colorName => {
        expect(css).toContain(`--color-${colorName}`);
      });
    });
  });

  describe('New Themes in Latest Update', () => {
    it('should have Ocean theme', () => {
      const oceanTheme = getTheme('ocean');
      expect(oceanTheme).toBeDefined();
      expect(oceanTheme?.name).toBe('Ocean');
      expect(oceanTheme?.description).toContain('ocean');
    });

    it('should have Forest theme', () => {
      const forestTheme = getTheme('forest');
      expect(forestTheme).toBeDefined();
      expect(forestTheme?.name).toBe('Forest');
      expect(forestTheme?.description).toContain('Nature');
    });

    it('should have Sunset theme', () => {
      const sunsetTheme = getTheme('sunset');
      expect(sunsetTheme).toBeDefined();
      expect(sunsetTheme?.name).toBe('Sunset');
      expect(sunsetTheme?.description).toContain('sunset');
    });

    it('should have Midnight theme', () => {
      const midnightTheme = getTheme('midnight');
      expect(midnightTheme).toBeDefined();
      expect(midnightTheme?.name).toBe('Midnight');
      expect(midnightTheme?.description).toContain('purple');
    });

    it('should have correct version for new themes', () => {
      const newThemes = ['ocean', 'forest', 'sunset', 'midnight'];
      newThemes.forEach(themeId => {
        const theme = getTheme(themeId);
        expect(theme?.version).toBe('1.0.0');
      });
    });
  });

  describe('Theme Color Validation', () => {
    it('should have valid hex colors', () => {
      const themes = getAllThemes();
      const hexColorRegex = /^#[0-9A-F]{6}$/i;

      themes.forEach(theme => {
        Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
          expect(hexColorRegex.test(colorValue)).toBe(
            true,
            `Theme ${theme.id} has invalid color ${colorName}: ${colorValue}`
          );
        });
      });
    });

    it('should have all required color properties', () => {
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

      const themes = getAllThemes();
      themes.forEach(theme => {
        requiredColors.forEach(colorName => {
          expect(theme.colors).toHaveProperty(colorName);
        });
      });
    });
  });

  describe('Theme Metadata', () => {
    it('should have unique names', () => {
      const themes = getAllThemes();
      const names = themes.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });

    it('should have descriptions', () => {
      const themes = getAllThemes();
      themes.forEach(theme => {
        expect(theme.description).toBeTruthy();
        expect(theme.description.length).toBeGreaterThan(0);
      });
    });

    it('should have creation dates', () => {
      const themes = getAllThemes();
      themes.forEach(theme => {
        expect(theme.createdAt).toBeInstanceOf(Date);
      });
    });
  });
});
