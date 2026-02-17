/**
 * S3-to-R2 Migration Job
 * Migrates existing files from S3 to Cloudflare R2
 * Tracks progress and handles errors gracefully
 */

import { storagePut } from '../storage';
import { notifyOwner } from '../_core/notification';

export interface MigrationStats {
  totalFiles: number;
  migratedFiles: number;
  failedFiles: number;
  totalSize: number;
  totalCost: number;
  startTime: Date;
  endTime?: Date;
  errors: Array<{ fileKey: string; error: string }>;
}

/**
 * Migrate a single file from S3 to R2
 */
async function migrateFileToR2(fileKey: string): Promise<{ success: boolean; cost?: number; error?: string }> {
  try {
    // Fetch file from S3 (assuming it's stored at the old S3 URL)
    const s3Url = `https://s3.amazonaws.com/${process.env.AWS_BUCKET_NAME}/${fileKey}`;
    
    const response = await fetch(s3Url);
    if (!response.ok) {
      throw new Error(`Failed to fetch from S3: ${response.status}`);
    }

    const fileBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Upload to R2
    const result = await storagePut(fileKey, Buffer.from(fileBuffer), contentType);

    console.log(`[Migration] Migrated ${fileKey} to R2 - Cost: £${result.cost}`);

    return { success: true, cost: result.cost };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Migration] Failed to migrate ${fileKey}:`, errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Run the S3-to-R2 migration job
 * @param batchSize - Number of files to process in each batch
 * @param delayMs - Delay between batches in milliseconds
 */
export async function runS3ToR2Migration(
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<MigrationStats> {
  const stats: MigrationStats = {
    totalFiles: 0,
    migratedFiles: 0,
    failedFiles: 0,
    totalSize: 0,
    totalCost: 0,
    startTime: new Date(),
    errors: [],
  };

  try {
    console.log('[Migration] Starting S3 to R2 migration...');

    // Placeholder: In production, fetch files from database
    // For now, this job can be called with file list as parameter
    const files: any[] = [];
    stats.totalFiles = files.length;

    if (stats.totalFiles === 0) {
      console.log('[Migration] No files to migrate');
      stats.endTime = new Date();
      return stats;
    }

    console.log(`[Migration] Found ${stats.totalFiles} files to migrate`);

    // Process files in batches
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((file: any) => migrateFileToR2(file.fileKey))
      );

      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const file = batch[j] as any;

        if (result.success) {
          stats.migratedFiles++;
          stats.totalCost += result.cost || 0;
          stats.totalSize += (file.fileSize as number) || 0;
        } else {
          stats.failedFiles++;
          stats.errors.push({
            fileKey: file.fileKey,
            error: result.error || 'Unknown error',
          });
        }
      }

      // Log progress
      const progress = Math.round((i + batchSize) / stats.totalFiles * 100);
      console.log(`[Migration] Progress: ${progress}% (${stats.migratedFiles}/${stats.totalFiles} migrated)`);

      // Delay between batches
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    stats.endTime = new Date();

    // Send notification to owner
    const duration = Math.round((stats.endTime.getTime() - stats.startTime.getTime()) / 1000);
    await notifyOwner({
      title: 'S3 to R2 Migration Complete',
      content: `Migration completed in ${duration}s. Migrated: ${stats.migratedFiles}/${stats.totalFiles} files. Failed: ${stats.failedFiles}. Total cost: £${stats.totalCost.toFixed(2)}`,
    });

    console.log('[Migration] S3 to R2 migration completed', stats);
    return stats;
  } catch (error) {
    console.error('[Migration] Migration job failed:', error);
    await notifyOwner({
      title: 'S3 to R2 Migration Failed',
      content: `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
    });
    throw error;
  }
}

/**
 * Get migration status
 */
export async function getMigrationStatus(): Promise<{
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  stats?: MigrationStats;
}> {
  // This would typically check a database table tracking migration status
  // For now, return a placeholder
  return {
    status: 'pending',
  };
}

/**
 * Cancel ongoing migration
 */
export async function cancelMigration(): Promise<void> {
  console.log('[Migration] Migration cancellation requested');
  // Implement cancellation logic
}

export default {
  runS3ToR2Migration,
  getMigrationStatus,
  cancelMigration,
};
