import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, float, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Subscription info
  subscriptionTier: mysqlEnum("subscriptionTier", ["free", "50gb", "100gb", "200gb", "500gb", "1tb", "2tb", "unlimited"]).default("free").notNull(),
  storageLimit: bigint("storageLimit", { mode: "number" }).default(5368709120).notNull(), // 5GB in bytes
  storageUsed: bigint("storageUsed", { mode: "number" }).default(0).notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  
  // AI Credits
  aiCredits: int("aiCredits").default(100).notNull(),
  
  // Customization (one-time purchase)
  hasCustomization: boolean("hasCustomization").default(false).notNull(),
  customLogo: text("customLogo"),
  customColors: json("customColors"),
  customTheme: varchar("customTheme", { length: 50 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Cloud storage files
 */
export const files = mysqlTable("files", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  folder: varchar("folder", { length: 500 }).default("/").notNull(),
  isDeleted: boolean("isDeleted").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

/**
 * Uploaded links (music, video, app links)
 */
export const links = mysqlTable("links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  linkType: mysqlEnum("linkType", ["music", "video", "app"]).notNull(),
  url: text("url").notNull(),
  title: varchar("title", { length: 500 }),
  description: text("description"),
  thumbnail: text("thumbnail"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Link = typeof links.$inferSelect;
export type InsertLink = typeof links.$inferInsert;

/**
 * Email accounts for each user
 */
export const emailAccounts = mysqlTable("emailAccounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull().unique(),
  displayName: varchar("displayName", { length: 200 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type InsertEmailAccount = typeof emailAccounts.$inferInsert;

/**
 * Emails
 */
export const emails = mysqlTable("emails", {
  id: int("id").autoincrement().primaryKey(),
  emailAccountId: int("emailAccountId").notNull(),
  fromAddress: varchar("fromAddress", { length: 320 }).notNull(),
  toAddress: varchar("toAddress", { length: 320 }).notNull(),
  ccAddress: text("ccAddress"),
  bccAddress: text("bccAddress"),
  subject: varchar("subject", { length: 500 }),
  body: text("body"),
  htmlBody: text("htmlBody"),
  attachments: json("attachments"),
  folder: mysqlEnum("folder", ["inbox", "sent", "drafts", "trash", "spam"]).default("inbox").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  isStarred: boolean("isStarred").default(false).notNull(),
  isDraft: boolean("isDraft").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Email = typeof emails.$inferSelect;
export type InsertEmail = typeof emails.$inferInsert;

/**
 * Game scores
 */
export const gameScores = mysqlTable("gameScores", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  gameName: varchar("gameName", { length: 100 }).notNull(),
  score: int("score").notNull(),
  level: int("level"),
  duration: int("duration"), // in seconds
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameScore = typeof gameScores.$inferSelect;
export type InsertGameScore = typeof gameScores.$inferInsert;

/**
 * Subscriptions and payments
 */
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", ["free", "50gb", "100gb", "200gb", "500gb", "1tb", "2tb", "unlimited"]).notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "pending", "paused"]).default("pending").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  currentPeriodStart: timestamp("currentPeriodStart"),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").default(false).notNull(),
  pausedUntil: timestamp("pausedUntil"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

/**
 * Payment history
 */
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subscriptionId: int("subscriptionId"),
  amount: float("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("GBP").notNull(),
  status: mysqlEnum("status", ["succeeded", "pending", "failed", "refunded"]).notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

/**
 * AI chat history
 */
export const aiChats = mysqlTable("aiChats", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  messages: json("messages").notNull(),
  creditsUsed: int("creditsUsed").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiChat = typeof aiChats.$inferSelect;
export type InsertAiChat = typeof aiChats.$inferInsert;

/**
 * CLI command history
 */
export const cliHistory = mysqlTable("cliHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  command: text("command").notNull(),
  output: text("output"),
  exitCode: int("exitCode"),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});

export type CliHistory = typeof cliHistory.$inferSelect;
export type InsertCliHistory = typeof cliHistory.$inferInsert;

/**
 * Video downloads
 */
export const videoDownloads = mysqlTable("videoDownloads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  url: text("url").notNull(),
  title: varchar("title", { length: 500 }),
  format: varchar("format", { length: 50 }),
  quality: varchar("quality", { length: 50 }),
  fileKey: varchar("fileKey", { length: 500 }),
  fileUrl: text("fileUrl"),
  fileSize: bigint("fileSize", { mode: "number" }),
  status: mysqlEnum("status", ["pending", "downloading", "completed", "failed"]).default("pending").notNull(),
  progress: int("progress").default(0).notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoDownload = typeof videoDownloads.$inferSelect;
export type InsertVideoDownload = typeof videoDownloads.$inferInsert;

/**
 * Storage backups
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  backupName: varchar("backupName", { length: 255 }).notNull(),
  backupSize: bigint("backupSize", { mode: "number" }).notNull(),
  fileCount: int("fileCount").notNull(),
  backupKey: varchar("backupKey", { length: 500 }).notNull(),
  backupUrl: text("backupUrl"),
  status: mysqlEnum("status", ["creating", "completed", "failed"]).default("creating").notNull(),
  isAutomatic: boolean("isAutomatic").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * User alert preferences
 */
export const alertPreferences = mysqlTable("alertPreferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  
  // Storage alerts
  storageAlertsEnabled: boolean("storageAlertsEnabled").default(true).notNull(),
  storageAlertThreshold80: int("storageAlertThreshold80").default(80).notNull(),
  storageAlertThreshold95: int("storageAlertThreshold95").default(95).notNull(),
  
  // AI credits alerts
  aiCreditsAlertsEnabled: boolean("aiCreditsAlertsEnabled").default(true).notNull(),
  aiCreditsThreshold: int("aiCreditsThreshold").default(10).notNull(),
  
  // Notification channels
  emailNotifications: boolean("emailNotifications").default(true).notNull(),
  inAppNotifications: boolean("inAppNotifications").default(true).notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = typeof alertPreferences.$inferInsert;

/**
 * Alert history for tracking when alerts were sent
 */
export const alertHistory = mysqlTable("alertHistory", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  alertType: mysqlEnum("alertType", ["storage_80", "storage_95", "ai_credits_low"]).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  metadata: json("metadata"),
});

export type AlertHistory = typeof alertHistory.$inferSelect;
export type InsertAlertHistory = typeof alertHistory.$inferInsert;

/**
 * In-app notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["storage_warning", "credits_low", "subscription_resumed", "info"]).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
