CREATE TABLE `addons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(200) NOT NULL,
	`description` text NOT NULL,
	`category` enum('game','theme','storage','feature') NOT NULL,
	`price` int NOT NULL,
	`icon` varchar(500),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`wordCount` int NOT NULL DEFAULT 0,
	`lastSaved` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userAddons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`addonId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`stripePaymentIntentId` varchar(255),
	CONSTRAINT `userAddons_id` PRIMARY KEY(`id`)
);
