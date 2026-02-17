/**
 * Themes Router
 * Manages theme selection and customization
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import {
  getTheme,
  getAllThemes,
  getDefaultTheme,
  validateThemeColors,
  generateThemeCSS,
  BUILT_IN_THEMES,
} from '../themes';

export const themesRouter = router({
  /**
   * Get all available themes
   */
  getAll: publicProcedure.query(async () => {
    return {
      themes: getAllThemes(),
      total: Object.keys(BUILT_IN_THEMES).length,
    };
  }),

  /**
   * Get a specific theme by ID
   */
  getById: publicProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ input }) => {
      const theme = getTheme(input.themeId);
      if (!theme) {
        throw new Error(`Theme "${input.themeId}" not found`);
      }
      return theme;
    }),

  /**
   * Get default theme
   */
  getDefault: publicProcedure.query(async () => {
    return getDefaultTheme();
  }),

  /**
   * Get CSS variables for a theme
   */
  getCSS: publicProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ input }) => {
      const theme = getTheme(input.themeId);
      if (!theme) {
        throw new Error(`Theme "${input.themeId}" not found`);
      }
      return {
        themeId: input.themeId,
        css: generateThemeCSS(theme),
      };
    }),

  /**
   * Save user's theme preference
   */
  savePreference: protectedProcedure
    .input(z.object({ themeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const theme = getTheme(input.themeId);
      if (!theme) {
        throw new Error(`Theme "${input.themeId}" not found`);
      }

      // In production, save to database
      console.log(`[Themes] User ${ctx.user?.id} selected theme: ${input.themeId}`);

      return {
        success: true,
        message: `Theme "${theme.name}" applied successfully`,
        theme,
      };
    }),

  /**
   * Get theme metadata
   */
  getMetadata: publicProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ input }) => {
      const theme = getTheme(input.themeId);
      if (!theme) {
        throw new Error(`Theme "${input.themeId}" not found`);
      }

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        version: theme.version,
        createdAt: theme.createdAt,
        isDefault: theme.isDefault,
        colorCount: Object.keys(theme.colors).length,
      };
    }),

  /**
   * List new themes added in latest update
   */
  getNewThemes: publicProcedure.query(async () => {
    const newThemes = Object.values(BUILT_IN_THEMES).filter(
      theme => theme.createdAt > new Date('2026-02-17')
    );

    return {
      newThemes,
      count: newThemes.length,
      message: `${newThemes.length} new themes added in the latest update`,
    };
  }),

  /**
   * Preview theme colors
   */
  preview: publicProcedure
    .input(z.object({ themeId: z.string() }))
    .query(async ({ input }) => {
      const theme = getTheme(input.themeId);
      if (!theme) {
        throw new Error(`Theme "${input.themeId}" not found`);
      }

      return {
        themeId: theme.id,
        name: theme.name,
        colors: theme.colors,
        preview: {
          primary: theme.colors.primary,
          secondary: theme.colors.secondary,
          accent: theme.colors.accent,
          background: theme.colors.background,
          foreground: theme.colors.foreground,
        },
      };
    }),
});

export default themesRouter;
