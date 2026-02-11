CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`backupName` varchar(255) NOT NULL,
	`backupSize` bigint NOT NULL,
	`fileCount` int NOT NULL,
	`backupKey` varchar(500) NOT NULL,
	`backupUrl` text,
	`status` enum('creating','completed','failed') NOT NULL DEFAULT 'creating',
	`isAutomatic` boolean NOT NULL DEFAULT false,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
