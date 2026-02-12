CREATE TABLE `themeBundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`themeIds` json NOT NULL,
	`price` int NOT NULL,
	`savings` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `themeBundles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userThemeBundles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bundleId` int NOT NULL,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	`stripePaymentIntentId` varchar(255),
	CONSTRAINT `userThemeBundles_id` PRIMARY KEY(`id`)
);
