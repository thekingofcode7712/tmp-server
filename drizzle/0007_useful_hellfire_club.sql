CREATE TABLE `filterRulesCache` (
	`id` int AUTO_INCREMENT NOT NULL,
	`listUrl` varchar(500) NOT NULL,
	`rules` text NOT NULL,
	`ruleCount` int NOT NULL,
	`lastFetched` timestamp NOT NULL DEFAULT (now()),
	`expiresAt` timestamp NOT NULL,
	CONSTRAINT `filterRulesCache_id` PRIMARY KEY(`id`),
	CONSTRAINT `filterRulesCache_listUrl_unique` UNIQUE(`listUrl`)
);
--> statement-breakpoint
CREATE TABLE `proxyCredentials` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`username` varchar(100) NOT NULL,
	`passwordHash` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`lastUsed` timestamp,
	CONSTRAINT `proxyCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `proxyCredentials_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `proxyCredentials_username_unique` UNIQUE(`username`)
);
