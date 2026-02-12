CREATE TABLE `themes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`colors` json NOT NULL,
	`previewImage` text,
	`price` int NOT NULL DEFAULT 300,
	`isDefault` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `themes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userThemes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`themeId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`stripePaymentIntentId` varchar(255),
	CONSTRAINT `userThemes_id` PRIMARY KEY(`id`)
);
