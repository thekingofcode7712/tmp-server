CREATE TABLE `shopItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`category` enum('powerup','cosmetic','exchange','boost') NOT NULL,
	`price` int NOT NULL,
	`icon` varchar(50),
	`isActive` boolean NOT NULL DEFAULT true,
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shopItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPurchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemId` int NOT NULL,
	`pricePaid` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`purchasedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `userPurchases_id` PRIMARY KEY(`id`)
);
