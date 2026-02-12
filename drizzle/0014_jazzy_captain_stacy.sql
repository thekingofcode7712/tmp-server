CREATE TABLE `emailAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`emailId` int NOT NULL,
	`fileName` varchar(500) NOT NULL,
	`fileSize` bigint NOT NULL,
	`mimeType` varchar(100),
	`s3Key` varchar(500) NOT NULL,
	`s3Url` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `emailFolders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`icon` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `emailFolders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `externalEmailCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`emailAddress` varchar(320) NOT NULL,
	`imapServer` varchar(255) NOT NULL,
	`imapPort` int NOT NULL,
	`imapUsername` varchar(320) NOT NULL,
	`imapPassword` text NOT NULL,
	`smtpServer` varchar(255) NOT NULL,
	`smtpPort` int NOT NULL,
	`smtpUsername` varchar(320) NOT NULL,
	`smtpPassword` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastSyncedAt` timestamp,
	CONSTRAINT `externalEmailCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `externalEmailCredentials_userId_unique` UNIQUE(`userId`)
);
