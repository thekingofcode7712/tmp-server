/**
 * Scheduled Migration Job Runner
 * Runs S3-to-R2 migration nightly with logging and error handling
 */

import { runS3ToR2Migration, MigrationStats } from './migrate-s3-to-r2';
import { notifyOwner } from '../_core/notification';

export interface ScheduledMigrationConfig {
  enabled: boolean;
  runTime: string; // HH:mm format (e.g., "02:00" for 2 AM)
  batchSize: number;
  delayMs: number;
  maxRetries: number;
}

let migrationInProgress = false;
let lastMigrationStats: MigrationStats | null = null;
let lastMigrationTime: Date | null = null;

/**
 * Get current migration status
 */
export function getMigrationStatus() {
  return {
    inProgress: migrationInProgress,
    lastStats: lastMigrationStats,
    lastRunTime: lastMigrationTime,
  };
}

/**
 * Execute migration job with error handling and retries
 */
export async function executeMigrationJob(
  config: ScheduledMigrationConfig
): Promise<MigrationStats | null> {
  if (migrationInProgress) {
    console.log('[Scheduled Migration] Migration already in progress, skipping');
    return null;
  }

  migrationInProgress = true;
  let retries = 0;

  try {
    console.log('[Scheduled Migration] Starting scheduled S3-to-R2 migration');

    while (retries < config.maxRetries) {
      try {
        const stats = await runS3ToR2Migration(config.batchSize, config.delayMs);
        lastMigrationStats = stats;
        lastMigrationTime = new Date();

        console.log('[Scheduled Migration] Migration completed successfully', stats);

        // Notify owner of successful migration
        await notifyOwner({
          title: 'Scheduled S3-to-R2 Migration Completed',
          content: `Successfully migrated ${stats.migratedFiles}/${stats.totalFiles} files. Cost: £${stats.totalCost.toFixed(2)}`,
        });

        return stats;
      } catch (error) {
        retries++;
        if (retries < config.maxRetries) {
          const delaySeconds = Math.pow(2, retries) * 60; // Exponential backoff
          console.warn(
            `[Scheduled Migration] Attempt ${retries} failed, retrying in ${delaySeconds}s:`,
            error
          );
          await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
        } else {
          throw error;
        }
      }
    }

    throw new Error(`Migration failed after ${config.maxRetries} retries`);
  } catch (error) {
    console.error('[Scheduled Migration] Migration job failed:', error);

    // Notify owner of failure
    await notifyOwner({
      title: 'Scheduled S3-to-R2 Migration Failed',
      content: `Migration failed after ${retries} retries: ${error instanceof Error ? error.message : String(error)}`,
    });

    return null;
  } finally {
    migrationInProgress = false;
  }
}

/**
 * Initialize scheduled migration job
 * This should be called during server startup
 */
export function initializeScheduledMigration(config: ScheduledMigrationConfig) {
  if (!config.enabled) {
    console.log('[Scheduled Migration] Scheduled migration is disabled');
    return;
  }

  console.log(`[Scheduled Migration] Initializing scheduled migration at ${config.runTime} daily`);

  // Parse run time
  const [hours, minutes] = config.runTime.split(':').map(Number);

  // Schedule job to run daily at specified time
  const scheduleNextRun = () => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If scheduled time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const timeUntilRun = scheduledTime.getTime() - now.getTime();
    console.log(`[Scheduled Migration] Next migration scheduled in ${Math.round(timeUntilRun / 1000 / 60)} minutes`);

    setTimeout(() => {
      executeMigrationJob(config);
      scheduleNextRun(); // Schedule next run
    }, timeUntilRun);
  };

  scheduleNextRun();
}

export default {
  getMigrationStatus,
  executeMigrationJob,
  initializeScheduledMigration,
};
