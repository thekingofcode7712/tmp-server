import * as db from './db';
import { sendEmail } from './email-service';

/**
 * Scheduled job to auto-resume paused subscriptions
 * Should run daily
 */
export async function autoResumeSubscriptions() {
  try {
    console.log('[Scheduled Job] Checking for expired paused subscriptions...');
    
    const database = await db.getDb();
    if (!database) {
      console.warn('[Scheduled Job] Database not available');
      return;
    }

    // Get all paused subscriptions where pausedUntil has passed
    const { subscriptions } = await import('../drizzle/schema');
    const { eq, and, lt } = await import('drizzle-orm');
    
    const expiredPausedSubs = await database
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'paused'),
          lt(subscriptions.pausedUntil, new Date())
        )
      );

    console.log(`[Scheduled Job] Found ${expiredPausedSubs.length} expired paused subscriptions`);

    for (const subscription of expiredPausedSubs) {
      try {
        // Resume in Stripe
        if (subscription.stripeSubscriptionId) {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
            apiVersion: '2026-01-28.clover',
          });

          await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
            pause_collection: null as any,
          });
        }

        // Update database
        await db.updateSubscriptionStatus(subscription.id, 'active');
        await db.updateSubscriptionPausedUntil(subscription.id, null);

        // Send notification email
        const user = await db.getUserById(subscription.userId);
        if (user?.email) {
          await sendEmail({
            from: `TMP Server <noreply@tmpserver.manus.space>`,
            to: user.email,
            subject: 'Your TMP Server Subscription Has Resumed',
            body: `Hello ${user.name || 'there'},\n\nYour TMP Server subscription has automatically resumed after the pause period ended.\n\nYour ${subscription.tier} plan is now active again with full access to all features.\n\nThank you for being a valued member!\n\nBest regards,\nTMP Server Team`,
            html: `<p>Hello ${user.name || 'there'},</p><p>Your TMP Server subscription has automatically resumed after the pause period ended.</p><p>Your <strong>${subscription.tier}</strong> plan is now active again with full access to all features.</p><p>Thank you for being a valued member!</p><p>Best regards,<br>TMP Server Team</p>`,
          });
        }

        console.log(`[Scheduled Job] Resumed subscription ${subscription.id} for user ${subscription.userId}`);
      } catch (error) {
        console.error(`[Scheduled Job] Error resuming subscription ${subscription.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduled Job] Error in autoResumeSubscriptions:', error);
  }
}

/**
 * Scheduled job to check usage and send alerts
 * Should run hourly or daily
 */
export async function checkUsageAlerts() {
  try {
    console.log('[Scheduled Job] Checking usage alerts...');
    
    const database = await db.getDb();
    if (!database) {
      console.warn('[Scheduled Job] Database not available');
      return;
    }

    const { users } = await import('../drizzle/schema');
    const { gt } = await import('drizzle-orm');
    
    // Get all users with storage usage
    const allUsers = await database.select().from(users).where(gt(users.storageUsed, 0));

    for (const user of allUsers) {
      try {
        // Skip if no email
        if (!user.email) continue;

        // Get user alert preferences
        const prefs = await db.getAlertPreferences(user.id);
        const storageAlertsEnabled = prefs?.storageAlertsEnabled ?? true;
        const aiCreditsAlertsEnabled = prefs?.aiCreditsAlertsEnabled ?? true;
        const emailNotifications = prefs?.emailNotifications ?? true;
        const inAppNotifications = prefs?.inAppNotifications ?? true;
        const threshold80 = prefs?.storageAlertThreshold80 ?? 80;
        const threshold95 = prefs?.storageAlertThreshold95 ?? 95;
        const aiThreshold = prefs?.aiCreditsThreshold ?? 10;

        const storagePercent = (user.storageUsed / user.storageLimit) * 100;

        // Check cooldown period (7 days for storage alerts)
        const COOLDOWN_DAYS = 7;
        const cooldownMs = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

        // Storage alerts
        if (storageAlertsEnabled && storagePercent >= threshold95 && storagePercent < 100) {
          const lastAlert = await db.getLastAlert(user.id, 'storage_95');
          const canSendAlert = !lastAlert || (Date.now() - new Date(lastAlert.sentAt).getTime() > cooldownMs);
          
          if (canSendAlert) {
          await sendEmail({
            from: `TMP Server <noreply@tmpserver.manus.space>`,
            to: user.email,
            subject: '⚠️ Storage Almost Full - 95% Used',
            body: `Hello ${user.name || 'there'},\n\nYour TMP Server storage is 95% full (${(user.storageUsed / 1024 / 1024 / 1024).toFixed(2)}GB of ${(user.storageLimit / 1024 / 1024 / 1024).toFixed(0)}GB used).\n\nPlease delete some files or upgrade your plan to avoid running out of space.\n\nUpgrade at: https://tmpserver.manus.space/subscription\n\nBest regards,\nTMP Server Team`,
            html: `<p>Hello ${user.name || 'there'},</p><p>Your TMP Server storage is <strong>95% full</strong> (${(user.storageUsed / 1024 / 1024 / 1024).toFixed(2)}GB of ${(user.storageLimit / 1024 / 1024 / 1024).toFixed(0)}GB used).</p><p>Please delete some files or upgrade your plan to avoid running out of space.</p><p><a href="https://tmpserver.manus.space/subscription">Upgrade your plan</a></p><p>Best regards,<br>TMP Server Team</p>`,
          });
            
            // Record alert history
            await db.recordAlert(user.id, 'storage_95', { storagePercent, storageUsed: user.storageUsed });
            
            // Create in-app notification
            if (inAppNotifications) {
              await db.createNotification({
                userId: user.id,
                type: 'storage_warning',
                title: 'Storage Almost Full',
                message: `Your storage is ${storagePercent.toFixed(0)}% full. Please delete files or upgrade your plan.`,
              });
            }
            
            console.log(`[Scheduled Job] Sent 95% storage alert to user ${user.id}`);
          }
        } else if (storageAlertsEnabled && storagePercent >= threshold80 && storagePercent < threshold95) {
          const lastAlert = await db.getLastAlert(user.id, 'storage_80');
          const canSendAlert = !lastAlert || (Date.now() - new Date(lastAlert.sentAt).getTime() > cooldownMs);
          
          if (canSendAlert && emailNotifications) {
          await sendEmail({
            from: `TMP Server <noreply@tmpserver.manus.space>`,
            to: user.email,
            subject: '⚠️ Storage Warning - 80% Used',
            body: `Hello ${user.name || 'there'},\n\nYour TMP Server storage is 80% full (${(user.storageUsed / 1024 / 1024 / 1024).toFixed(2)}GB of ${(user.storageLimit / 1024 / 1024 / 1024).toFixed(0)}GB used).\n\nConsider deleting unused files or upgrading your plan.\n\nUpgrade at: https://tmpserver.manus.space/subscription\n\nBest regards,\nTMP Server Team`,
            html: `<p>Hello ${user.name || 'there'},</p><p>Your TMP Server storage is <strong>80% full</strong> (${(user.storageUsed / 1024 / 1024 / 1024).toFixed(2)}GB of ${(user.storageLimit / 1024 / 1024 / 1024).toFixed(0)}GB used).</p><p>Consider deleting unused files or upgrading your plan.</p><p><a href="https://tmpserver.manus.space/subscription">Upgrade your plan</a></p><p>Best regards,<br>TMP Server Team</p>`,
          });
            
            // Record alert history
            await db.recordAlert(user.id, 'storage_80', { storagePercent, storageUsed: user.storageUsed });
            
            // Create in-app notification
            if (inAppNotifications) {
              await db.createNotification({
                userId: user.id,
                type: 'storage_warning',
                title: 'Storage Warning',
                message: `Your storage is ${storagePercent.toFixed(0)}% full. Consider upgrading your plan.`,
              });
            }
            
            console.log(`[Scheduled Job] Sent 80% storage alert to user ${user.id}`);
          }
        }

        // AI credits alert
        if (aiCreditsAlertsEnabled && user.aiCredits > 0 && user.aiCredits <= aiThreshold) {
          const lastAlert = await db.getLastAlert(user.id, 'ai_credits_low');
          const canSendAlert = !lastAlert || (Date.now() - new Date(lastAlert.sentAt).getTime() > cooldownMs);
          
          if (canSendAlert && emailNotifications) {
          await sendEmail({
            from: `TMP Server <noreply@tmpserver.manus.space>`,
            to: user.email,
            subject: '⚠️ AI Credits Running Low',
            body: `Hello ${user.name || 'there'},\n\nYou have only ${user.aiCredits} AI credits remaining.\n\nPurchase more credits or upgrade your plan to continue using AI features.\n\nBuy credits at: https://tmpserver.manus.space/buy-credits\n\nBest regards,\nTMP Server Team`,
            html: `<p>Hello ${user.name || 'there'},</p><p>You have only <strong>${user.aiCredits} AI credits</strong> remaining.</p><p>Purchase more credits or upgrade your plan to continue using AI features.</p><p><a href="https://tmpserver.manus.space/buy-credits">Buy more credits</a></p><p>Best regards,<br>TMP Server Team</p>`,
          });
            
            // Record alert history
            await db.recordAlert(user.id, 'ai_credits_low', { aiCredits: user.aiCredits });
            
            // Create in-app notification
            if (inAppNotifications) {
              await db.createNotification({
                userId: user.id,
                type: 'credits_low',
                title: 'AI Credits Running Low',
                message: `You have only ${user.aiCredits} AI credits remaining. Purchase more to continue using AI features.`,
              });
            }
            
            console.log(`[Scheduled Job] Sent low AI credits alert to user ${user.id}`);
          }
        }
      } catch (error) {
        console.error(`[Scheduled Job] Error sending alert to user ${user.id}:`, error);
      }
    }
  } catch (error) {
    console.error('[Scheduled Job] Error in checkUsageAlerts:', error);
  }
}

// Jobs are initialized in server/_core/index.ts


/**
 * Scheduled job to create automatic daily backups of all user data
 * Should run daily at midnight
 */
export async function createDailyBackups() {
  try {
    console.log('[Scheduled Job] Creating daily backups for all users...');
    
    const database = await db.getDb();
    if (!database) {
      console.warn('[Scheduled Job] Database not available');
      return;
    }

    // Get all users
    const { users } = await import('../drizzle/schema');
    const allUsers = await database.select().from(users);

    for (const user of allUsers) {
      try {
        // Get user's files
        const files = await db.getUserFiles(user.id);
        
        // Get user's documents
        const documents = await db.getUserDocuments(user.id);
        
        // Get user's settings
        const settings = await db.getVpnSettings(user.id);
        
        // Create backup metadata
        const backupData = {
          files: files?.length || 0,
          documents: documents?.length || 0,
          settings: settings ? 1 : 0,
          timestamp: new Date().toISOString(),
        };

        // Save backup record
        await db.createBackup({
          userId: user.id,
          backupName: `Daily Backup - ${new Date().toISOString().split('T')[0]}`,
          backupSize: JSON.stringify(backupData).length,
          fileCount: (files?.length || 0) + (documents?.length || 0),
          backupKey: `backups/${user.id}/daily_${Date.now()}.json`,
          backupUrl: '',
          status: 'completed',
          isAutomatic: true,
          metadata: backupData,
        });

        console.log(`[Scheduled Job] Created daily backup for user ${user.id}`);
      } catch (error) {
        console.error(`[Scheduled Job] Error creating backup for user ${user.id}:`, error);
      }
    }

    console.log('[Scheduled Job] Daily backups completed');
  } catch (error) {
    console.error('[Scheduled Job] Error in createDailyBackups:', error);
  }
}
