/**
 * Storage Analytics Router
 * Provides analytics and cost breakdown for storage operations
 */

import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import { z } from 'zod';
import { calculateStorageCost } from '../storage';

/**
 * Calculate storage analytics for a user
 */
export const storageAnalyticsRouter = router({
  /**
   * Get comprehensive storage analytics
   */
  getAnalytics: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        timeRange: z.enum(['week', 'month', 'year']).default('month'),
      })
    )
    .query(async ({ ctx, input }) => {
      // Use authenticated user ID if not specified
      const userId = input.userId || ctx.user?.id || 0;

      // Placeholder: In production, fetch from database
      // For now, return mock data
      const totalFiles = 601;
      const totalSize = 1.99 * 1024 * 1024 * 1024; // 1.99 GB
      const totalCost = calculateStorageCost(totalSize);
      const profitMargin = Math.max(2.0, totalCost * 0.15); // 15% profit or £2 minimum

      return {
        totalFiles,
        totalSize,
        totalCost,
        costPerFile: totalCost / totalFiles,
        costPerGB: totalCost / (totalSize / (1024 * 1024 * 1024)),
        profitMargin,
        storageBreakdown: [
          { category: 'Documents', size: 500 * 1024 * 1024, cost: calculateStorageCost(500 * 1024 * 1024) },
          { category: 'Images', size: 800 * 1024 * 1024, cost: calculateStorageCost(800 * 1024 * 1024) },
          { category: 'Videos', size: 600 * 1024 * 1024, cost: calculateStorageCost(600 * 1024 * 1024) },
          { category: 'Archives', size: 90 * 1024 * 1024, cost: calculateStorageCost(90 * 1024 * 1024) },
        ],
        costTrend: [
          { date: '2026-02-10', cost: 2.15, savings: 0.85 },
          { date: '2026-02-11', cost: 2.18, savings: 0.82 },
          { date: '2026-02-12', cost: 2.20, savings: 0.80 },
          { date: '2026-02-13', cost: 2.22, savings: 0.78 },
          { date: '2026-02-14', cost: 2.24, savings: 0.76 },
          { date: '2026-02-15', cost: 2.26, savings: 0.74 },
          { date: '2026-02-16', cost: 2.28, savings: 0.72 },
          { date: '2026-02-17', cost: 2.30, savings: 0.70 },
        ],
      };
    }),

  /**
   * Get cost breakdown by category
   */
  getCostBreakdown: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        groupBy: z.enum(['fileType', 'folder', 'date']).default('fileType'),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user?.id || 0;

      // Placeholder: In production, fetch from database and calculate
      const breakdown = [
        {
          name: 'Documents (.pdf, .docx, .xlsx)',
          fileCount: 150,
          totalSize: 500 * 1024 * 1024,
          cost: calculateStorageCost(500 * 1024 * 1024),
          percentage: 25,
        },
        {
          name: 'Images (.jpg, .png, .gif)',
          fileCount: 300,
          totalSize: 800 * 1024 * 1024,
          cost: calculateStorageCost(800 * 1024 * 1024),
          percentage: 40,
        },
        {
          name: 'Videos (.mp4, .mov, .avi)',
          fileCount: 80,
          totalSize: 600 * 1024 * 1024,
          cost: calculateStorageCost(600 * 1024 * 1024),
          percentage: 30,
        },
        {
          name: 'Archives (.zip, .tar, .rar)',
          fileCount: 71,
          totalSize: 90 * 1024 * 1024,
          cost: calculateStorageCost(90 * 1024 * 1024),
          percentage: 5,
        },
      ];

      const totalCost = breakdown.reduce((sum, item) => sum + item.cost, 0);
      const totalSize = breakdown.reduce((sum, item) => sum + item.totalSize, 0);

      return {
        breakdown,
        totalCost,
        totalSize,
        averageCostPerFile: totalCost / breakdown.reduce((sum, item) => sum + item.fileCount, 0),
      };
    }),

  /**
   * Get storage cost trend over time
   */
  getStorageTrend: protectedProcedure
    .input(
      z.object({
        userId: z.number().optional(),
        days: z.number().min(1).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user?.id || 0;

      // Generate trend data for the specified number of days
      const trend = [];
      const baseSize = 1.5 * 1024 * 1024 * 1024; // 1.5 GB base
      const now = new Date();

      for (let i = input.days; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);

        // Simulate gradual growth
        const size = baseSize + (i * 10 * 1024 * 1024); // +10MB per day
        const cost = calculateStorageCost(size);
        const savings = Math.max(0, cost * 0.25); // Estimate 25% savings vs S3

        trend.push({
          date: date.toISOString().split('T')[0],
          size,
          cost,
          savings,
          fileCount: Math.floor(600 + i * 0.5),
        });
      }

      return {
        trend,
        currentSize: trend[trend.length - 1].size,
        currentCost: trend[trend.length - 1].cost,
        averageDailyCost: trend.reduce((sum, item) => sum + item.cost, 0) / trend.length,
        projectedMonthlyCost: (trend.reduce((sum, item) => sum + item.cost, 0) / trend.length) * 30,
      };
    }),

  /**
   * Get storage optimization recommendations
   */
  getRecommendations: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user?.id || 0;

      return {
        recommendations: [
          {
            title: 'Archive Old Files',
            description: 'You have 45 files older than 6 months that could be archived',
            potentialSavings: 0.35,
            priority: 'high',
          },
          {
            title: 'Compress Large Videos',
            description: 'Compressing 12 video files could reduce storage by 200MB',
            potentialSavings: 0.15,
            priority: 'medium',
          },
          {
            title: 'Remove Duplicates',
            description: 'Detected 8 duplicate files totaling 50MB',
            potentialSavings: 0.05,
            priority: 'low',
          },
        ],
        totalPotentialSavings: 0.55,
      };
    }),

  /**
   * Get migration status
   */
  getMigrationStatus: protectedProcedure
    .input(z.object({ userId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.user?.id || 0;

      // Placeholder: In production, fetch from migration job status
      return {
        status: 'completed',
        migratedFiles: 601,
        totalFiles: 601,
        progress: 100,
        startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
        totalCost: 2.30,
        totalSavings: 0.70,
      };
    }),
});

export default storageAnalyticsRouter;
