CREATE TABLE `adFilterLists` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(200) NOT NULL,
	`url` text,
	`isEnabled` boolean NOT NULL DEFAULT true,
	`lastUpdated` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `adFilterLists_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vpnSpeedTests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`server` varchar(100) NOT NULL,
	`latency` int NOT NULL,
	`downloadSpeed` bigint NOT NULL,
	`uploadSpeed` bigint NOT NULL,
	`testedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `vpnSpeedTests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `vpnConnections` ADD `bytesUploaded` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vpnConnections` ADD `bytesDownloaded` bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `vpnSettings` ADD `bandwidthLimitDaily` bigint DEFAULT 10737418240 NOT NULL;--> statement-breakpoint
ALTER TABLE `vpnSettings` ADD `bandwidthLimitMonthly` bigint DEFAULT 107374182400 NOT NULL;