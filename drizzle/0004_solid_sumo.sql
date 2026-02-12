CREATE TABLE `alertHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`alertType` enum('storage_80','storage_95','ai_credits_low') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`metadata` json,
	CONSTRAINT `alertHistory_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `alertPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`storageAlertsEnabled` boolean NOT NULL DEFAULT true,
	`storageAlertThreshold80` int NOT NULL DEFAULT 80,
	`storageAlertThreshold95` int NOT NULL DEFAULT 95,
	`aiCreditsAlertsEnabled` boolean NOT NULL DEFAULT true,
	`aiCreditsThreshold` int NOT NULL DEFAULT 10,
	`emailNotifications` boolean NOT NULL DEFAULT true,
	`inAppNotifications` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `alertPreferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `alertPreferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('storage_warning','credits_low','subscription_resumed','info') NOT NULL,
	`title` varchar(200) NOT NULL,
	`message` text NOT NULL,
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
