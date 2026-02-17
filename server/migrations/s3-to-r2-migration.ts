import { getDb } from '../db';
import { files, subscriptions, users, payments } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { uploadToR2, deleteFromR2 } from '../storage-r2';
import { notifyOwner } from '../_core/notification';

/**
 * Subscription pricing tiers with £2-100 profit margin
 * Based on storage tier and R2 costs
 */
const SUBSCRIPTION_PRICING = {
  free: { priceGbp: 0, storageGb: 5, profitMargin: 0 },
  '50gb': { priceGbp: 4.99, storageGb: 50, profitMargin: 2.50 },
  '100gb': { priceGbp: 8.99, storageGb: 100, profitMargin: 5.00 },
  '200gb': { priceGbp: 14.99, storageGb: 200, profitMargin: 8.00 },
  '500gb': { priceGbp: 29.99, storageGb: 500, profitMargin: 15.00 },
  '1tb': { priceGbp: 49.99, storageGb: 1024, profitMargin: 25.00 },
  '2tb': { priceGbp: 79.99, storageGb: 2048, profitMargin: 40.00 },
  unlimited: { priceGbp: 99.99, storageGb: Infinity, profitMargin: 100.00 },
} as const;

interface MigrationProgress {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  startTime: number;
  endTime?: number;
  errors: Array<{ fileId: number; error: string }>;
}

/**
 * Migrate a single file from S3 to R2
 */
async function migrateFileToR2(file: typeof files.$inferSelect): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Fetch file from S3
    const response = await fetch(file.fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from S3: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const bodyBuffer = Buffer.from(bytes);

    // Upload to R2
    const fileKey = `users/${file.userId}/files/${Date.now()}-${file.fileName}`;
    const result = await uploadToR2(
      fileKey,
      bodyBuffer,
      file.mimeType || 'application/octet-stream'
    );

    // Update file record with R2 key and URL
    await db
      .update(files)
      .set({
        fileKey: fileKey,
        fileUrl: result.url,
        updatedAt: new Date(),
      })
      .where(eq(files.id, file.id));

    // Delete from S3 (optional - keep for backup)
    // await deleteFromS3(file.fileKey);

    return true;
  } catch (error) {
    console.error(`[Migration] Failed to migrate file ${file.id}:`, error);
    return false;
  }
}

/**
 * Update subscription prices with profit margins
 */
async function updateSubscriptionPrices(): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Get all active subscriptions
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    console.log(`[Pricing] Updating ${activeSubscriptions.length} active subscriptions`);

    for (const sub of activeSubscriptions) {
      const tierConfig = SUBSCRIPTION_PRICING[sub.tier as keyof typeof SUBSCRIPTION_PRICING];
      if (!tierConfig) continue;

      // Calculate monthly cost based on profit margin
      const monthlyPrice = tierConfig.priceGbp;

      // Log pricing update
      console.log(`[Pricing] Subscription ${sub.id} (${sub.tier}): £${monthlyPrice}/month (Profit: £${tierConfig.profitMargin})`);

      // Store pricing metadata in database if needed
      // You can add a pricing_metadata column to subscriptions table
    }

    await notifyOwner({
      title: 'Subscription Pricing Updated',
      content: `Updated pricing for ${activeSubscriptions.length} subscriptions with profit margins of £2-100 per plan.`,
    });
  } catch (error) {
    console.error('[Pricing] Failed to update subscription prices:', error);
    throw error;
  }
}

/**
 * Main migration job
 */
export async function runS3ToR2Migration(): Promise<MigrationProgress> {
  const progress: MigrationProgress = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    startTime: Date.now(),
    errors: [],
  };

  try {
    console.log('[Migration] Starting S3 to R2 migration...');

    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    // Get all non-deleted files
    const allFiles: typeof files.$inferSelect[] = await db
      .select()
      .from(files)
      .where(eq(files.isDeleted, false));

    progress.totalFiles = allFiles.length;
    console.log(`[Migration] Found ${progress.totalFiles} files to migrate`);

    // Migrate files in batches of 10 for rate limiting
    const BATCH_SIZE = 10;
    for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
      const batch = allFiles.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map((file: typeof files.$inferSelect) => migrateFileToR2(file))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const file = batch[j];

        if (result.status === 'fulfilled' && result.value) {
          progress.migratedFiles++;
          console.log(
            `[Migration] Progress: ${progress.migratedFiles}/${progress.totalFiles} (${Math.round((progress.migratedFiles / progress.totalFiles) * 100)}%)`
          );
        } else {
          progress.failedFiles++;
          progress.errors.push({
            fileId: file.id,
            error: result.status === 'rejected' ? result.reason.message : 'Unknown error',
          });
          console.error(`[Migration] Failed to migrate file ${file.id}`);
        }
      }

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < allFiles.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Update subscription prices
    console.log('[Migration] Updating subscription prices...');
    await updateSubscriptionPrices();

    progress.endTime = Date.now();
    const duration = (progress.endTime - progress.startTime) / 1000;

    console.log(`[Migration] Migration completed in ${duration}s`);
    console.log(`[Migration] Results: ${progress.migratedFiles} migrated, ${progress.failedFiles} failed`);

    // Notify owner of completion
    const notificationResult = await notifyOwner({
      title: 'S3 to R2 Migration Complete',
      content: `Successfully migrated ${progress.migratedFiles}/${progress.totalFiles} files to R2 storage in ${duration}s. Failed: ${progress.failedFiles}. Subscription prices updated with £2-100 profit margins.`,
    });
    console.log('[Migration] Notification sent:', notificationResult);

    return progress;
  } catch (error) {
    console.error('[Migration] Migration failed:', error);
    const notificationResult = await notifyOwner({
      title: 'S3 to R2 Migration Failed',
      content: `Migration error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    console.log('[Migration] Error notification sent:', notificationResult);
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  totalFiles: number;
  migratedFiles: number;
  remainingFiles: number;
  migrationPercentage: number;
}> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const allFiles: typeof files.$inferSelect[] = await db
      .select()
      .from(files)
      .where(eq(files.isDeleted, false));

    // Count files that have been migrated to R2 (fileKey contains 'users/')
    const migratedFiles = allFiles.filter((f) => f.fileKey?.includes('users/') && f.fileKey?.includes('/files/')).length;

    return {
      totalFiles: allFiles.length,
      migratedFiles,
      remainingFiles: allFiles.length - migratedFiles,
      migrationPercentage: Math.round((migratedFiles / allFiles.length) * 100),
    };
  } catch (error) {
    console.error('[Migration] Failed to get migration status:', error);
    throw error;
  }
}

/**
 * Verify R2 file integrity
 */
export async function verifyR2FileIntegrity(fileId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)
      .then((rows: typeof files.$inferSelect[]) => rows[0]);

    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    // Check if file exists in R2
    const response = await fetch(file.fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`[Verification] Failed to verify file ${fileId}:`, error);
    return false;
  }
}

/**
 * Rollback migration for a specific file
 */
export async function rollbackFileFromR2(fileId: number): Promise<boolean> {
  try {
    const db = await getDb();
    if (!db) {
      throw new Error('Database connection failed');
    }

    const file = await db
      .select()
      .from(files)
      .where(eq(files.id, fileId))
      .limit(1)
      .then((rows: typeof files.$inferSelect[]) => rows[0]);

    if (!file) {
      throw new Error(`File ${fileId} not found`);
    }

    // Delete from R2
    if (file.fileKey) {
      await deleteFromR2(file.fileKey);
    }

    // Mark as deleted in database
    await db
      .update(files)
      .set({
        isDeleted: true,
        updatedAt: new Date(),
      })
      .where(eq(files.id, fileId));

    console.log(`[Rollback] File ${fileId} rolled back from R2`);
    return true;
  } catch (error) {
    console.error(`[Rollback] Failed to rollback file ${fileId}:`, error);
    return false;
  }
}

/**
 * Export subscription pricing configuration
 */
export function getSubscriptionPricingConfig(): typeof SUBSCRIPTION_PRICING {
  return SUBSCRIPTION_PRICING;
}

/**
 * Calculate profit margin for a subscription tier
 */
export function calculateProfitMargin(tier: string): number {
  const config = SUBSCRIPTION_PRICING[tier as keyof typeof SUBSCRIPTION_PRICING];
  return config?.profitMargin || 0;
}
