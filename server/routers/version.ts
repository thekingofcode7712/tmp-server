/**
 * Version Router
 * Handles version checking and auto-update notifications
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { versionManager } from '../version-manager';

export const versionRouter = router({
  /**
   * Get current version
   */
  getCurrent: publicProcedure.query(async () => {
    const version = versionManager.getCurrentVersion();
    return {
      version: version.version,
      hash: version.hash,
      buildTime: version.buildTime,
      features: version.features,
      breakingChanges: version.breakingChanges,
    };
  }),

  /**
   * Check if update is available
   */
  checkUpdate: publicProcedure
    .input(z.object({ clientVersion: z.string() }))
    .query(async ({ input }) => {
      const updateInfo = versionManager.getUpdateInfo(input.clientVersion);
      return {
        updateAvailable: updateInfo.updateAvailable,
        currentVersion: updateInfo.version.version,
        currentHash: updateInfo.version.hash,
        buildTime: updateInfo.version.buildTime,
        features: updateInfo.version.features,
        breakingChanges: updateInfo.version.breakingChanges,
        message: updateInfo.updateAvailable
          ? 'A new version is available. Please refresh to update.'
          : 'You are running the latest version.',
      };
    }),

  /**
   * Get version history
   */
  getHistory: publicProcedure.query(async () => {
    const history = versionManager.getVersionHistory();
    return history.map(v => ({
      version: v.version,
      hash: v.hash,
      buildTime: v.buildTime,
      features: v.features,
    }));
  }),

  /**
   * Report client version (for analytics)
   */
  reportVersion: publicProcedure
    .input(
      z.object({
        clientVersion: z.string(),
        userAgent: z.string().optional(),
        timestamp: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      console.log('[Version] Client version report:', {
        clientVersion: input.clientVersion,
        currentVersion: versionManager.getCurrentVersion().version,
        isOutdated: versionManager.isUpdateAvailable(input.clientVersion),
        userAgent: input.userAgent,
      });

      return {
        success: true,
        message: 'Version reported successfully',
      };
    }),

  /**
   * Increment version (admin only - for deployment)
   */
  incrementVersion: protectedProcedure
    .input(
      z.object({
        features: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user is admin (in production, add proper authorization)
      if (ctx.user?.role !== 'admin') {
        throw new Error('Unauthorized: Admin access required');
      }

      const newVersion = versionManager.incrementVersion(input.features);
      return {
        success: true,
        version: newVersion.version,
        hash: newVersion.hash,
        message: `Version incremented to ${newVersion.version}`,
      };
    }),

  /**
   * Get update notification
   */
  getUpdateNotification: publicProcedure
    .input(z.object({ clientVersion: z.string() }))
    .query(async ({ input }) => {
      const updateInfo = versionManager.getUpdateInfo(input.clientVersion);

      if (!updateInfo.updateAvailable) {
        return null;
      }

      return {
        title: 'Update Available',
        message: 'A new version of TMP Server is available. Click to update.',
        version: updateInfo.version.version,
        buildTime: updateInfo.version.buildTime,
        features: updateInfo.version.features,
        breakingChanges: updateInfo.version.breakingChanges,
        action: 'reload', // 'reload' or 'install'
      };
    }),

  /**
   * Force version check (for testing)
   */
  forceCheck: publicProcedure.query(async () => {
    const version = versionManager.getCurrentVersion();
    return {
      version: version.version,
      hash: version.hash,
      timestamp: Date.now(),
      message: 'Version check completed',
    };
  }),
});
