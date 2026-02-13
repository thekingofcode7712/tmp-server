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
  emailStorageLimit: bigint("emailStorageLimit", { mode: "number" }).default(16106127360).notNull(), // 15GB in bytes
  emailStorageUsed: bigint("emailStorageUsed", { mode: "number" }).default(0).notNull(),
  subscriptionExpiresAt: timestamp("subscriptionExpiresAt"),
  
  // AI Credits
  aiCredits: int("aiCredits").default(100).notNull(),
  
  // Bits to Play (in-game currency)
  bitsBalance: int("bitsBalance").default(1000).notNull(),
  
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
  versionNumber: int("versionNumber").default(1).notNull(),
  parentFileId: int("parentFileId"), // For tracking file history
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type File = typeof files.$inferSelect;
export type InsertFile = typeof files.$inferInsert;

/**
 * File versions for version history
 */
export const fileVersions = mysqlTable("fileVersions", {
  id: int("id").autoincrement().primaryKey(),
  fileId: int("fileId").notNull(), // Current file ID
  versionNumber: int("versionNumber").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FileVersion = typeof fileVersions.$inferSelect;
export type InsertFileVersion = typeof fileVersions.$inferInsert;

/**
 * Custom folders for file organization
 */
export const folders = mysqlTable("folders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  folderName: varchar("folderName", { length: 500 }).notNull(),
  folderPath: varchar("folderPath", { length: 1000 }).notNull(), // Full path like /parent/child
  parentFolderId: int("parentFolderId"), // For nested folders
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Folder = typeof folders.$inferSelect;
export type InsertFolder = typeof folders.$inferInsert;

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


/**
 * Ad blocker settings and statistics
 */
export const adBlockerSettings = mysqlTable("adBlockerSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  blockAds: boolean("blockAds").default(true).notNull(),
  blockTrackers: boolean("blockTrackers").default(true).notNull(),
  blockMalware: boolean("blockMalware").default(true).notNull(),
  dnsBlocking: boolean("dnsBlocking").default(true).notNull(),
  customFilters: json("customFilters"), // Array of custom filter rules
  whitelist: json("whitelist"), // Array of whitelisted domains
  totalBlocked: int("totalBlocked").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdBlockerSettings = typeof adBlockerSettings.$inferSelect;
export type InsertAdBlockerSettings = typeof adBlockerSettings.$inferInsert;

/**
 * VPN settings and connection logs
 */
export const vpnSettings = mysqlTable("vpnSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  enabled: boolean("enabled").default(false).notNull(),
  selectedServer: varchar("selectedServer", { length: 100 }).default("us-east").notNull(),
  protocol: mysqlEnum("protocol", ["wireguard", "openvpn", "proxy"]).default("proxy").notNull(),
  autoConnect: boolean("autoConnect").default(false).notNull(),
  killSwitch: boolean("killSwitch").default(false).notNull(),
  bandwidthLimitDaily: bigint("bandwidthLimitDaily", { mode: "number" }).default(10737418240).notNull(), // 10GB default
  bandwidthLimitMonthly: bigint("bandwidthLimitMonthly", { mode: "number" }).default(107374182400).notNull(), // 100GB default
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VpnSettings = typeof vpnSettings.$inferSelect;
export type InsertVpnSettings = typeof vpnSettings.$inferInsert;

/**
 * VPN connection logs
 */
export const vpnConnections = mysqlTable("vpnConnections", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  server: varchar("server", { length: 100 }).notNull(),
  protocol: varchar("protocol", { length: 50 }).notNull(),
  connectedAt: timestamp("connectedAt").defaultNow().notNull(),
  disconnectedAt: timestamp("disconnectedAt"),
  bytesUploaded: bigint("bytesUploaded", { mode: "number" }).default(0).notNull(),
  bytesDownloaded: bigint("bytesDownloaded", { mode: "number" }).default(0).notNull(),
  bytesTransferred: bigint("bytesTransferred", { mode: "number" }).default(0).notNull(),
});

export type VpnConnection = typeof vpnConnections.$inferSelect;
export type InsertVpnConnection = typeof vpnConnections.$inferInsert;

/**
 * VPN speed test results
 */
export const vpnSpeedTests = mysqlTable("vpnSpeedTests", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  server: varchar("server", { length: 100 }).notNull(),
  latency: int("latency").notNull(), // milliseconds
  downloadSpeed: bigint("downloadSpeed", { mode: "number" }).notNull(), // bytes per second
  uploadSpeed: bigint("uploadSpeed", { mode: "number" }).notNull(), // bytes per second
  testedAt: timestamp("testedAt").defaultNow().notNull(),
});

export type VpnSpeedTest = typeof vpnSpeedTests.$inferSelect;
export type InsertVpnSpeedTest = typeof vpnSpeedTests.$inferInsert;

/**
 * Ad blocker custom filter lists
 */
export const adFilterLists = mysqlTable("adFilterLists", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url"),
  isEnabled: boolean("isEnabled").default(true).notNull(),
  lastUpdated: timestamp("lastUpdated"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdFilterList = typeof adFilterLists.$inferSelect;
export type InsertAdFilterList = typeof adFilterLists.$inferInsert;

/**
 * Proxy authentication credentials
 */
export const proxyCredentials = mysqlTable("proxyCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsed: timestamp("lastUsed"),
});

export type ProxyCredential = typeof proxyCredentials.$inferSelect;
export type InsertProxyCredential = typeof proxyCredentials.$inferInsert;

/**
 * Cached filter rules for ad blocking
 */
export const filterRulesCache = mysqlTable("filterRulesCache", {
  id: int("id").autoincrement().primaryKey(),
  listUrl: varchar("listUrl", { length: 500 }).notNull().unique(),
  rules: text("rules").notNull(), // JSON array of parsed rules
  ruleCount: int("ruleCount").notNull(),
  lastFetched: timestamp("lastFetched").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
});

export type FilterRulesCache = typeof filterRulesCache.$inferSelect;
export type InsertFilterRulesCache = typeof filterRulesCache.$inferInsert;


/**
 * Word processor documents
 */
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content").notNull(), // HTML content
  wordCount: int("wordCount").default(0).notNull(),
  lastSaved: timestamp("lastSaved").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

/**
 * Add-ons marketplace
 */
export const addons = mysqlTable("addons", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["game", "theme", "storage", "feature"]).notNull(),
  price: int("price").notNull(), // Price in pence (£3 = 300)
  icon: varchar("icon", { length: 500 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Addon = typeof addons.$inferSelect;
export type InsertAddon = typeof addons.$inferInsert;

/**
 * User purchased add-ons
 */
export const userAddons = mysqlTable("userAddons", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  addonId: int("addonId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
});
export type UserAddon = typeof userAddons.$inferSelect;
export type InsertUserAddon = typeof userAddons.$inferInsert;

/**
 * UI Themes (£3 each)
 */
export const themes = mysqlTable("themes", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  colors: json("colors").notNull(), // { primary, secondary, accent, background, foreground, etc. }
  previewImage: text("previewImage"),
  price: int("price").default(300).notNull(), // £3 in pence
  isDefault: boolean("isDefault").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;

/**
 * User purchased themes
 */
export const userThemes = mysqlTable("userThemes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  themeId: int("themeId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
});
export type UserTheme = typeof userThemes.$inferSelect;
export type InsertUserTheme = typeof userThemes.$inferInsert;

/**
 * Theme Bundles (discounted packages)
 */
export const themeBundles = mysqlTable("themeBundles", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  themeIds: json("themeIds").notNull(), // Array of theme IDs included
  price: int("price").notNull(), // Price in pence
  savings: int("savings").notNull(), // Savings in pence vs individual purchase
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ThemeBundle = typeof themeBundles.$inferSelect;
export type InsertThemeBundle = typeof themeBundles.$inferInsert;

/**
 * User purchased theme bundles
 */
export const userThemeBundles = mysqlTable("userThemeBundles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  bundleId: int("bundleId").notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
});
export type UserThemeBundle = typeof userThemeBundles.$inferSelect;
export type InsertUserThemeBundle = typeof userThemeBundles.$inferInsert;

/**
 * External email account credentials (IMAP/SMTP)
 */
export const externalEmailCredentials = mysqlTable("externalEmailCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  emailAddress: varchar("emailAddress", { length: 320 }).notNull(),
  imapServer: varchar("imapServer", { length: 255 }).notNull(),
  imapPort: int("imapPort").notNull(),
  imapUsername: varchar("imapUsername", { length: 320 }).notNull(),
  imapPassword: text("imapPassword").notNull(), // Encrypted
  smtpServer: varchar("smtpServer", { length: 255 }).notNull(),
  smtpPort: int("smtpPort").notNull(),
  smtpUsername: varchar("smtpUsername", { length: 320 }).notNull(),
  smtpPassword: text("smtpPassword").notNull(), // Encrypted
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastSyncedAt: timestamp("lastSyncedAt"),
});
export type ExternalEmailCredential = typeof externalEmailCredentials.$inferSelect;
export type InsertExternalEmailCredential = typeof externalEmailCredentials.$inferInsert;

/**
 * Email folders for organization
 */
export const emailFolders = mysqlTable("emailFolders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  icon: varchar("icon", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailFolder = typeof emailFolders.$inferSelect;
export type InsertEmailFolder = typeof emailFolders.$inferInsert;

/**
 * Email attachments
 */
export const emailAttachments = mysqlTable("emailAttachments", {
  id: int("id").autoincrement().primaryKey(),
  emailId: int("emailId").notNull(),
  fileName: varchar("fileName", { length: 500 }).notNull(),
  fileSize: bigint("fileSize", { mode: "number" }).notNull(),
  mimeType: varchar("mimeType", { length: 100 }),
  s3Key: varchar("s3Key", { length: 500 }).notNull(),
  s3Url: text("s3Url").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailAttachment = typeof emailAttachments.$inferSelect;
export type InsertEmailAttachment = typeof emailAttachments.$inferInsert;

/**
 * File sharing with temporary public links
 */
export const fileShares = mysqlTable("fileShares", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  fileId: int("fileId").notNull(),
  shareToken: varchar("shareToken", { length: 100 }).notNull().unique(),
  expiresAt: timestamp("expiresAt"),
  accessCount: int("accessCount").default(0).notNull(),
  maxAccessCount: int("maxAccessCount"), // null = unlimited
  password: varchar("password", { length: 255 }), // Optional password protection
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
});
export type FileShare = typeof fileShares.$inferSelect;
export type InsertFileShare = typeof fileShares.$inferInsert;

/**
 * Game achievements definitions
 */
export const achievements = mysqlTable("achievements", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 100 }),
  category: mysqlEnum("category", ["game", "storage", "email", "social", "milestone"]).notNull(),
  condition: json("condition").notNull(), // { type: "score", game: "snake", value: 1000 }
  points: int("points").default(10).notNull(),
  isSecret: boolean("isSecret").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = typeof achievements.$inferInsert;

/**
 * User earned achievements
 */
export const userAchievements = mysqlTable("userAchievements", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  achievementId: int("achievementId").notNull(),
  earnedAt: timestamp("earnedAt").defaultNow().notNull(),
  progress: int("progress").default(100).notNull(), // Percentage
});
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * Two-factor authentication
 */
export const twoFactorAuth = mysqlTable("twoFactorAuth", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  secret: varchar("secret", { length: 255 }).notNull(), // TOTP secret
  backupCodes: json("backupCodes").notNull(), // Array of backup codes
  isEnabled: boolean("isEnabled").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
});
export type TwoFactorAuth = typeof twoFactorAuth.$inferSelect;
export type InsertTwoFactorAuth = typeof twoFactorAuth.$inferInsert;

/**
 * Activity logs / Audit trail
 */
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  category: mysqlEnum("category", ["auth", "file", "email", "game", "payment", "settings", "api"]).notNull(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * API keys for developer access
 */
export const apiKeys = mysqlTable("apiKeys", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  keyHash: varchar("keyHash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("keyPrefix", { length: 20 }).notNull(), // First 8 chars for display
  permissions: json("permissions").notNull(), // ["files.read", "files.write", "email.read"]
  rateLimit: int("rateLimit").default(1000).notNull(), // Requests per hour
  requestCount: int("requestCount").default(0).notNull(),
  lastUsedAt: timestamp("lastUsedAt"),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = typeof apiKeys.$inferInsert;

/**
 * Email storage subscription plans
 */
export const emailStoragePlans = mysqlTable("emailStoragePlans", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  tier: mysqlEnum("tier", ["free", "25gb", "50gb", "100gb", "unlimited"]).default("free").notNull(),
  status: mysqlEnum("status", ["active", "cancelled", "expired"]).default("active").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailStoragePlan = typeof emailStoragePlans.$inferSelect;
export type InsertEmailStoragePlan = typeof emailStoragePlans.$inferInsert;

/**
 * Weekly challenges for games
 */
export const weeklyChallenges = mysqlTable("weeklyChallenges", {
  id: int("id").autoincrement().primaryKey(),
  gameName: varchar("gameName", { length: 100 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  targetScore: int("targetScore").notNull(),
  reward: int("reward").notNull(), // AI credits or other rewards
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type InsertWeeklyChallenge = typeof weeklyChallenges.$inferInsert;

/**
 * User weekly challenge completions
 */
export const userWeeklyChallenges = mysqlTable("userWeeklyChallenges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  challengeId: int("challengeId").notNull(),
  score: int("score").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
  rewardClaimed: boolean("rewardClaimed").default(false).notNull(),
});
export type UserWeeklyChallenge = typeof userWeeklyChallenges.$inferSelect;
export type InsertUserWeeklyChallenge = typeof userWeeklyChallenges.$inferInsert;

/**
 * Bits Shop Items
 */
export const shopItems = mysqlTable("shopItems", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  category: mysqlEnum("category", ["powerup", "cosmetic", "exchange", "boost"]).notNull(),
  price: int("price").notNull(), // Price in Bits
  icon: varchar("icon", { length: 50 }), // Icon name or emoji
  isActive: boolean("isActive").default(true).notNull(),
  metadata: json("metadata"), // Additional item-specific data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShopItem = typeof shopItems.$inferSelect;
export type InsertShopItem = typeof shopItems.$inferInsert;

/**
 * User Shop Purchases
 */
export const userPurchases = mysqlTable("userPurchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  itemId: int("itemId").notNull(),
  pricePaid: int("pricePaid").notNull(), // Bits spent
  quantity: int("quantity").default(1).notNull(),
  purchasedAt: timestamp("purchasedAt").defaultNow().notNull(),
});

export type UserPurchase = typeof userPurchases.$inferSelect;
export type InsertUserPurchase = typeof userPurchases.$inferInsert;

/**
 * Active Power-ups for users
 */
export const activePowerUps = mysqlTable("activePowerUps", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  powerUpType: varchar("powerUpType", { length: 100 }).notNull(), // "2x_score", "extra_life", "time_freeze", etc.
  expiresAt: timestamp("expiresAt"), // null for one-time use items
  usesRemaining: int("usesRemaining").default(1).notNull(),
  activatedAt: timestamp("activatedAt").defaultNow().notNull(),
});

export type ActivePowerUp = typeof activePowerUps.$inferSelect;
export type InsertActivePowerUp = typeof activePowerUps.$inferInsert;
