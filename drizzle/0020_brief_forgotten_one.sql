CREATE TABLE `activePowerUps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`powerUpType` varchar(100) NOT NULL,
	`expiresAt` timestamp,
	`usesRemaining` int NOT NULL DEFAULT 1,
	`activatedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activePowerUps_id` PRIMARY KEY(`id`)
);
