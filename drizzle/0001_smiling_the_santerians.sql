CREATE TABLE `aiChats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`messages` json NOT NULL,
	`creditsUsed` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `aiChats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cliHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`command` text NOT NULL,
	`output` text,
	`exitCode` int,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `cliHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailAccounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailAddress` varchar(320) NOT NULL,
	`displayName` varchar(200),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailAccounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailAccounts_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `emailAccounts_emailAddress_unique` UNIQUE(`emailAddress`)
);
--> statement-breakpoint
CREATE TABLE `emails` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailAccountId` int NOT NULL,
	`fromAddress` varchar(320) NOT NULL,
	`toAddress` varchar(320) NOT NULL,
	`ccAddress` text,
	`bccAddress` text,
	`subject` varchar(500),
	`body` text,
	`htmlBody` text,
	`attachments` json,
	`folder` enum('inbox','sent','drafts','trash','spam') NOT NULL DEFAULT 'inbox',
	`isRead` boolean NOT NULL DEFAULT false,
	`isStarred` boolean NOT NULL DEFAULT false,
	`isDraft` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emails_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` bigint NOT NULL,
	`mimeType` varchar(100),
	`folder` varchar(500) NOT NULL DEFAULT '/',
	`isDeleted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gameScores` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`gameName` varchar(100) NOT NULL,
	`score` int NOT NULL,
	`level` int,
	`duration` int,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gameScores_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `links` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`linkType` enum('music','video','app') NOT NULL,
	`url` text NOT NULL,
	`title` varchar(500),
	`description` text,
	`thumbnail` text,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`subscriptionId` int,
	`amount` float NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'GBP',
	`status` enum('succeeded','pending','failed','refunded') NOT NULL,
	`stripePaymentIntentId` varchar(255),
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`tier` enum('free','50gb','100gb','200gb','500gb','1tb','2tb','unlimited') NOT NULL,
	`status` enum('active','cancelled','expired','pending') NOT NULL DEFAULT 'pending',
	`stripeSubscriptionId` varchar(255),
	`stripeCustomerId` varchar(255),
	`currentPeriodStart` timestamp,
	`currentPeriodEnd` timestamp,
	`cancelAtPeriodEnd` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `videoDownloads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`url` text NOT NULL,
	`title` varchar(500),
	`format` varchar(50),
	`quality` varchar(50),
	`fileKey` varchar(500),
	`fileUrl` text,
	`fileSize` bigint,
	`status` enum('pending','downloading','completed','failed') NOT NULL DEFAULT 'pending',
	`progress` int NOT NULL DEFAULT 0,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `videoDownloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionTier` enum('free','50gb','100gb','200gb','500gb','1tb','2tb','unlimited') DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `storageLimit` bigint DEFAULT 5368709120 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `storageUsed` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `subscriptionExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `aiCredits` int DEFAULT 100 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `hasCustomization` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `customLogo` text;--> statement-breakpoint
ALTER TABLE `users` ADD `customColors` json;--> statement-breakpoint
ALTER TABLE `users` ADD `customTheme` varchar(50);