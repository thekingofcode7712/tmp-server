import { eq, desc, and, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, files, InsertFile, links, InsertLink,
  emailAccounts, InsertEmailAccount, emails, InsertEmail,
  gameScores, InsertGameScore, subscriptions, InsertSubscription,
  payments, InsertPayment, aiChats, InsertAiChat,
  cliHistory, InsertCliHistory, videoDownloads, InsertVideoDownload,
  backups, InsertBackup, alertPreferences, InsertAlertPreference,
  alertHistory, InsertAlertHistory, notifications, InsertNotification,
  adBlockerSettings, InsertAdBlockerSettings, vpnSettings, InsertVpnSettings,
  vpnConnections, InsertVpnConnection, vpnSpeedTests, InsertVpnSpeedTest,
  adFilterLists, InsertAdFilterList, proxyCredentials, InsertProxyCredential,
  filterRulesCache, InsertFilterRulesCache, documents, InsertDocument,
  addons, InsertAddon, userAddons, InsertUserAddon,
  themes, InsertTheme, userThemes, InsertUserTheme,
  externalEmailCredentials, InsertExternalEmailCredential,
  emailFolders, InsertEmailFolder, emailAttachments, InsertEmailAttachment,
  emailStoragePlans, InsertEmailStoragePlan
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ===== USER OPERATIONS =====

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserStorage(userId: number, storageUsed: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ storageUsed }).where(eq(users.id, userId));
}

export async function updateUserEmailStorage(userId: number, emailStorageUsed: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ emailStorageUsed }).where(eq(users.id, userId));
}

export async function updateUserStorageLimit(userId: number, storageLimit: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ storageLimit }).where(eq(users.id, userId));
}

export async function updateUserSubscription(userId: number, tier: string, storageLimit: number, expiresAt: Date) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    subscriptionTier: tier as any,
    storageLimit,
    subscriptionExpiresAt: expiresAt
  }).where(eq(users.id, userId));
}

export async function updateUserAICredits(userId: number, credits: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ aiCredits: credits }).where(eq(users.id, userId));
}

export async function updateUserCustomization(userId: number, customization: { hasCustomization: boolean, customLogo?: string, customColors?: any, customTheme?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(customization).where(eq(users.id, userId));
}

export async function updateUserProfile(userId: number, profile: { name?: string, email?: string }) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(profile).where(eq(users.id, userId));
}

// ===== FILE OPERATIONS =====

export async function createFile(file: InsertFile) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(files).values(file);
  return result;
}

export async function getUserFiles(userId: number, folder?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (folder) {
    return await db.select().from(files)
      .where(and(eq(files.userId, userId), eq(files.folder, folder), eq(files.isDeleted, false)))
      .orderBy(desc(files.createdAt));
  }
  
  return await db.select().from(files)
    .where(and(eq(files.userId, userId), eq(files.isDeleted, false)))
    .orderBy(desc(files.createdAt));
}

export async function deleteFile(fileId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(files).set({ isDeleted: true }).where(and(eq(files.id, fileId), eq(files.userId, userId)));
}

export async function getFileById(fileId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ===== LINK OPERATIONS =====

export async function createLink(link: InsertLink) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(links).values(link);
  return result;
}

export async function getUserLinks(userId: number, linkType?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (linkType) {
    return await db.select().from(links)
      .where(and(eq(links.userId, userId), eq(links.linkType, linkType as any)))
      .orderBy(desc(links.createdAt));
  }
  
  return await db.select().from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt));
}

export async function deleteLink(linkId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(links).where(and(eq(links.id, linkId), eq(links.userId, userId)));
}

// ===== EMAIL OPERATIONS =====

export async function createEmailAccount(account: InsertEmailAccount) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(emailAccounts).values(account);
  return result;
}

export async function getEmailAccountByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailAccounts).where(eq(emailAccounts.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getEmailAccountByEmail(emailAddress: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailAccounts).where(eq(emailAccounts.emailAddress, emailAddress)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createEmail(email: InsertEmail) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(emails).values(email);
  return result;
}

export async function getEmailsByFolder(emailAccountId: number, folder: string) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(emails)
    .where(and(eq(emails.emailAccountId, emailAccountId), eq(emails.folder, folder as any)))
    .orderBy(desc(emails.createdAt));
}

export async function getEmailById(emailId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emails).where(eq(emails.id, emailId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateEmail(emailId: number, updates: Partial<InsertEmail>) {
  const db = await getDb();
  if (!db) return;
  await db.update(emails).set(updates).where(eq(emails.id, emailId));
}

export async function deleteEmail(emailId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(emails).where(eq(emails.id, emailId));
}

// ===== EXTERNAL EMAIL CREDENTIALS =====

export async function createExternalEmailCredential(credential: InsertExternalEmailCredential) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(externalEmailCredentials).values(credential);
  return result;
}

export async function getExternalEmailCredential(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(externalEmailCredentials).where(eq(externalEmailCredentials.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateExternalEmailCredential(userId: number, updates: Partial<InsertExternalEmailCredential>) {
  const db = await getDb();
  if (!db) return;
  await db.update(externalEmailCredentials).set(updates).where(eq(externalEmailCredentials.userId, userId));
}

export async function deleteExternalEmailCredential(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(externalEmailCredentials).where(eq(externalEmailCredentials.userId, userId));
}

// ===== EMAIL STORAGE PLANS =====

export async function getEmailStoragePlan(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(emailStoragePlans).where(eq(emailStoragePlans.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createEmailStoragePlan(plan: InsertEmailStoragePlan) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(emailStoragePlans).values(plan);
  return result;
}

export async function updateEmailStoragePlan(userId: number, updates: Partial<InsertEmailStoragePlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(emailStoragePlans).set(updates).where(eq(emailStoragePlans.userId, userId));
}

// ===== GAME OPERATIONS =====

export async function createGameScore(score: InsertGameScore) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(gameScores).values(score);
  return result;
}

export async function getGameLeaderboard(gameName: string, limit: number = 10) {
  const db = await getDb();
  if (!db) return [];
  return await db.select({
    id: gameScores.id,
    userId: gameScores.userId,
    userName: users.name,
    score: gameScores.score,
    level: gameScores.level,
    duration: gameScores.duration,
    createdAt: gameScores.createdAt
  })
    .from(gameScores)
    .leftJoin(users, eq(gameScores.userId, users.id))
    .where(eq(gameScores.gameName, gameName))
    .orderBy(desc(gameScores.score))
    .limit(limit);
}

export async function getUserGameScores(userId: number, gameName?: string) {
  const db = await getDb();
  if (!db) return [];
  
  if (gameName) {
    return await db.select().from(gameScores)
      .where(and(eq(gameScores.userId, userId), eq(gameScores.gameName, gameName)))
      .orderBy(desc(gameScores.score));
  }
  
  return await db.select().from(gameScores)
    .where(eq(gameScores.userId, userId))
    .orderBy(desc(gameScores.createdAt));
}

// ===== SUBSCRIPTION & PAYMENT OPERATIONS =====

export async function createSubscription(subscription: InsertSubscription) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(subscriptions).values(subscription);
  return result;
}

export async function getActiveSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions)
    .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function getSubscriptionByStripeId(stripeSubscriptionId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSubscription(subscriptionId: number, updates: Partial<InsertSubscription>) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set(updates).where(eq(subscriptions.id, subscriptionId));
}

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateSubscriptionStatus(subscriptionId: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set({ status: status as any }).where(eq(subscriptions.id, subscriptionId));
}

export async function updateSubscriptionPausedUntil(subscriptionId: number, pausedUntil: Date | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(subscriptions).set({ pausedUntil }).where(eq(subscriptions.id, subscriptionId));
}

export async function createPayment(payment: InsertPayment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(payments).values(payment);
  return result;
}

export async function getUserPayments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(payments)
    .where(eq(payments.userId, userId))
    .orderBy(desc(payments.createdAt));
}

// ===== AI CHAT OPERATIONS =====

export async function createAIChat(chat: InsertAiChat) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(aiChats).values(chat);
  return result;
}

export async function getAIChat(chatId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(aiChats).where(eq(aiChats.id, chatId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAIChat(chatId: number, messages: any, creditsUsed: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(aiChats).set({ messages, creditsUsed, updatedAt: new Date() }).where(eq(aiChats.id, chatId));
}

export async function getUserAIChats(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(aiChats)
    .where(eq(aiChats.userId, userId))
    .orderBy(desc(aiChats.updatedAt));
}

// ===== CLI HISTORY OPERATIONS =====

export async function createCliHistory(history: InsertCliHistory) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(cliHistory).values(history);
  return result;
}

export async function getUserCliHistory(userId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cliHistory)
    .where(eq(cliHistory.userId, userId))
    .orderBy(desc(cliHistory.executedAt))
    .limit(limit);
}

// ===== VIDEO DOWNLOAD OPERATIONS =====

export async function createVideoDownload(download: InsertVideoDownload) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(videoDownloads).values(download);
  return result;
}

export async function getVideoDownload(downloadId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(videoDownloads).where(eq(videoDownloads.id, downloadId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateVideoDownload(downloadId: number, updates: Partial<InsertVideoDownload>) {
  const db = await getDb();
  if (!db) return;
  await db.update(videoDownloads).set(updates).where(eq(videoDownloads.id, downloadId));
}

export async function getUserVideoDownloads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(videoDownloads)
    .where(eq(videoDownloads.userId, userId))
    .orderBy(desc(videoDownloads.createdAt));
}

// ===== BACKUP OPERATIONS =====

export async function createBackup(backup: InsertBackup) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(backups).values(backup);
  return result;
}

export async function getBackup(backupId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(backups).where(eq(backups.id, backupId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateBackup(backupId: number, updates: Partial<InsertBackup>) {
  const db = await getDb();
  if (!db) return;
  await db.update(backups).set(updates).where(eq(backups.id, backupId));
}

export async function getUserBackups(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(backups)
    .where(eq(backups.userId, userId))
    .orderBy(desc(backups.createdAt));
}

export async function deleteBackup(backupId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(backups).where(and(eq(backups.id, backupId), eq(backups.userId, userId)));
}

// ===== ALERT PREFERENCES =====

export async function getAlertPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(alertPreferences).where(eq(alertPreferences.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function upsertAlertPreferences(userId: number, prefs: Partial<InsertAlertPreference>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getAlertPreferences(userId);
  if (existing) {
    await db.update(alertPreferences).set(prefs).where(eq(alertPreferences.userId, userId));
  } else {
    await db.insert(alertPreferences).values({ userId, ...prefs });
  }
}

// ===== ALERT HISTORY =====

export async function getLastAlert(userId: number, alertType: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(alertHistory)
    .where(and(eq(alertHistory.userId, userId), eq(alertHistory.alertType, alertType as any)))
    .orderBy(desc(alertHistory.sentAt))
    .limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function recordAlert(userId: number, alertType: string, metadata?: any) {
  const db = await getDb();
  if (!db) return;
  await db.insert(alertHistory).values({
    userId,
    alertType: alertType as any,
    metadata,
  });
}

export async function getUserAlertHistory(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy(desc(alertHistory.sentAt))
    .limit(limit);
}

// ===== NOTIFICATIONS =====

export async function createNotification(notification: InsertNotification) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(notifications).values(notification);
  return result;
}

export async function getUserNotifications(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  return result[0]?.count || 0;
}

export async function markNotificationAsRead(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}

export async function markAllNotificationsAsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function deleteNotification(notificationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
}



// ===== AD BLOCKER =====
export async function getAdBlockerSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(adBlockerSettings)
    .where(eq(adBlockerSettings.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function upsertAdBlockerSettings(userId: number, settings: Partial<InsertAdBlockerSettings>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getAdBlockerSettings(userId);
  if (existing) {
    await db.update(adBlockerSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(adBlockerSettings.userId, userId));
  } else {
    await db.insert(adBlockerSettings).values({
      userId,
      ...settings,
    } as InsertAdBlockerSettings);
  }
}

export async function incrementBlockedCount(userId: number, count = 1) {
  const db = await getDb();
  if (!db) return;
  await db.update(adBlockerSettings)
    .set({ totalBlocked: sql`${adBlockerSettings.totalBlocked} + ${count}` })
    .where(eq(adBlockerSettings.userId, userId));
}

// ===== VPN =====
export async function getVpnSettings(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(vpnSettings)
    .where(eq(vpnSettings.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function upsertVpnSettings(userId: number, settings: Partial<InsertVpnSettings>) {
  const db = await getDb();
  if (!db) return;
  
  const existing = await getVpnSettings(userId);
  if (existing) {
    await db.update(vpnSettings)
      .set({ ...settings, updatedAt: new Date() })
      .where(eq(vpnSettings.userId, userId));
  } else {
    await db.insert(vpnSettings).values({
      userId,
      ...settings,
    } as InsertVpnSettings);
  }
}

export async function createVpnConnection(connection: InsertVpnConnection) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(vpnConnections).values(connection);
  return result;
}

export async function getVpnConnections(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(vpnConnections)
    .where(eq(vpnConnections.userId, userId))
    .orderBy(desc(vpnConnections.connectedAt))
    .limit(limit);
}

export async function updateVpnConnection(connectionId: number, updates: Partial<InsertVpnConnection>) {
  const db = await getDb();
  if (!db) return;
  await db.update(vpnConnections)
    .set(updates)
    .where(eq(vpnConnections.id, connectionId));
}


// ===== VPN Speed Tests =====
export async function createVpnSpeedTest(speedTest: InsertVpnSpeedTest) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(vpnSpeedTests).values(speedTest);
  return result;
}

export async function getVpnSpeedTests(userId: number, server?: string, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  
  if (server) {
    return await db.select().from(vpnSpeedTests)
      .where(and(
        eq(vpnSpeedTests.userId, userId),
        eq(vpnSpeedTests.server, server)
      ))
      .orderBy(desc(vpnSpeedTests.testedAt))
      .limit(limit);
  }
  
  return await db.select().from(vpnSpeedTests)
    .where(eq(vpnSpeedTests.userId, userId))
    .orderBy(desc(vpnSpeedTests.testedAt))
    .limit(limit);
}

export async function getLatestSpeedTest(userId: number, server: string) {
  const db = await getDb();
  if (!db) return null;
  
  const result = await db.select().from(vpnSpeedTests)
    .where(and(
      eq(vpnSpeedTests.userId, userId),
      eq(vpnSpeedTests.server, server)
    ))
    .orderBy(desc(vpnSpeedTests.testedAt))
    .limit(1);
  
  return result[0] || null;
}

// ===== Ad Filter Lists =====
export async function getAdFilterLists(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(adFilterLists)
    .where(eq(adFilterLists.userId, userId))
    .orderBy(desc(adFilterLists.createdAt));
}

export async function createAdFilterList(filterList: InsertAdFilterList) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(adFilterLists).values(filterList);
  return result;
}

export async function updateAdFilterList(id: number, updates: Partial<InsertAdFilterList>) {
  const db = await getDb();
  if (!db) return;
  await db.update(adFilterLists)
    .set({ ...updates, lastUpdated: new Date() })
    .where(eq(adFilterLists.id, id));
}

export async function deleteAdFilterList(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(adFilterLists).where(eq(adFilterLists.id, id));
}

// ===== VPN Bandwidth Tracking =====
export async function getVpnBandwidthUsage(userId: number, period: 'daily' | 'monthly') {
  const db = await getDb();
  if (!db) return { uploaded: 0, downloaded: 0, total: 0 };
  
  const now = new Date();
  const startDate = period === 'daily'
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
    : new Date(now.getFullYear(), now.getMonth(), 1);
  
  const result = await db.select({
    uploaded: sql<number>`SUM(${vpnConnections.bytesUploaded})`,
    downloaded: sql<number>`SUM(${vpnConnections.bytesDownloaded})`,
    total: sql<number>`SUM(${vpnConnections.bytesTransferred})`,
  }).from(vpnConnections)
    .where(and(
      eq(vpnConnections.userId, userId),
      sql`${vpnConnections.connectedAt} >= ${startDate}`
    ));
  
  return {
    uploaded: Number(result[0]?.uploaded || 0),
    downloaded: Number(result[0]?.downloaded || 0),
    total: Number(result[0]?.total || 0),
  };
}


// ===== Proxy Credentials =====
export async function getProxyCredentials(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(proxyCredentials)
    .where(eq(proxyCredentials.userId, userId))
    .limit(1);
  return result[0] || null;
}

export async function createProxyCredentials(creds: InsertProxyCredential) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(proxyCredentials).values(creds);
  return result;
}

export async function updateProxyCredentialsLastUsed(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(proxyCredentials)
    .set({ lastUsed: new Date() })
    .where(eq(proxyCredentials.userId, userId));
}

export async function deleteProxyCredentials(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(proxyCredentials).where(eq(proxyCredentials.userId, userId));
}

// ===== Filter Rules Cache =====
export async function getFilterRulesCache(listUrl: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(filterRulesCache)
    .where(eq(filterRulesCache.listUrl, listUrl))
    .limit(1);
  
  const cache = result[0];
  if (!cache) return null;
  
  // Check if expired
  if (new Date() > new Date(cache.expiresAt)) {
    return null;
  }
  
  return cache;
}

export async function createFilterRulesCache(cache: InsertFilterRulesCache) {
  const db = await getDb();
  if (!db) return null;
  
  // Delete existing cache for this URL
  await db.delete(filterRulesCache).where(eq(filterRulesCache.listUrl, cache.listUrl));
  
  // Insert new cache
  const result = await db.insert(filterRulesCache).values(cache);
  return result;
}

export async function deleteExpiredFilterCache() {
  const db = await getDb();
  if (!db) return;
  await db.delete(filterRulesCache)
    .where(sql`${filterRulesCache.expiresAt} < NOW()`);
}


// ==================== Documents ====================
export async function getUserDocuments(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.updatedAt));
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(documents).where(eq(documents.id, id)).limit(1);
  return result[0] || null;
}

export async function createDocument(doc: InsertDocument) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(documents).values(doc);
  const insertId = (result as any).insertId || (result as any)[0]?.insertId || 0;
  return { id: Number(insertId), ...doc };
}

export async function updateDocument(id: number, updates: Partial<InsertDocument>) {
  const db = await getDb();
  if (!db) return null;
  await db.update(documents).set(updates).where(eq(documents.id, id));
  return getDocumentById(id);
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(documents).where(eq(documents.id, id));
}

// ==================== Add-ons ====================
export async function getAllAddons() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(addons).where(eq(addons.isActive, true));
}

export async function getAddonById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(addons).where(eq(addons.id, id)).limit(1);
  return result[0] || null;
}

export async function getAddonByName(name: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(addons).where(eq(addons.name, name)).limit(1);
  return result[0] || null;
}

export async function getUserAddons(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    addon: addons,
    purchasedAt: userAddons.purchasedAt,
  })
  .from(userAddons)
  .innerJoin(addons, eq(userAddons.addonId, addons.id))
  .where(eq(userAddons.userId, userId));
}

export async function purchaseAddon(userId: number, addonId: number, paymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userAddons).values({
    userId,
    addonId,
    stripePaymentIntentId: paymentIntentId,
  });
  const insertId = (result as any).insertId || (result as any)[0]?.insertId || 0;
  return { id: Number(insertId), userId, addonId };
}

export async function hasUserPurchasedAddon(userId: number, addonId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(userAddons)
    .where(and(eq(userAddons.userId, userId), eq(userAddons.addonId, addonId)))
    .limit(1);
  return result.length > 0;
}

// ==================== Backups ====================

// ==================== Themes ====================
export async function getAllThemes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(themes).orderBy(themes.name);
}

export async function getThemeById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(themes).where(eq(themes.id, id)).limit(1);
  return result[0] || null;
}

export async function getUserThemes(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    theme: themes,
    purchasedAt: userThemes.purchasedAt,
  })
  .from(userThemes)
  .innerJoin(themes, eq(userThemes.themeId, themes.id))
  .where(eq(userThemes.userId, userId));
}

export async function purchaseTheme(userId: number, themeId: number, paymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(userThemes).values({
    userId,
    themeId,
    stripePaymentIntentId: paymentIntentId,
  });
  const insertId = (result as any).insertId || (result as any)[0]?.insertId || 0;
  return { id: Number(insertId), userId, themeId };
}

export async function hasUserPurchasedTheme(userId: number, themeId: number) {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select().from(userThemes)
    .where(and(eq(userThemes.userId, userId), eq(userThemes.themeId, themeId)))
    .limit(1);
  return result.length > 0;
}

export async function purchaseAllThemes(userId: number, paymentIntentId: string) {
  const db = await getDb();
  if (!db) return null;
  
  // Get all theme IDs
  const allThemes = await getAllThemes();
  
  // Insert all themes for the user
  for (const theme of allThemes) {
    const alreadyPurchased = await hasUserPurchasedTheme(userId, theme.id);
    if (!alreadyPurchased) {
      await db.insert(userThemes).values({
        userId,
        themeId: theme.id,
        stripePaymentIntentId: paymentIntentId,
      });
    }
  }
  
  return { success: true, count: allThemes.length };
}
