CREATE TABLE `userWeeklyChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`challengeId` int NOT NULL,
	`score` int NOT NULL,
	`completedAt` timestamp NOT NULL DEFAULT (now()),
	`rewardClaimed` boolean NOT NULL DEFAULT false,
	CONSTRAINT `userWeeklyChallenges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `weeklyChallenges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`gameName` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`targetScore` int NOT NULL,
	`reward` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `weeklyChallenges_id` PRIMARY KEY(`id`)
);
