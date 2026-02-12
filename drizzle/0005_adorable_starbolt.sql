CREATE TABLE `adBlockerSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`blockAds` boolean NOT NULL DEFAULT true,
	`blockTrackers` boolean NOT NULL DEFAULT true,
	`blockMalware` boolean NOT NULL DEFAULT true,
	`dnsBlocking` boolean NOT NULL DEFAULT true,
	`customFilters` json,
	`whitelist` json,
	`totalBlocked` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `adBlockerSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `adBlockerSettings_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `vpnConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`server` varchar(100) NOT NULL,
	`protocol` varchar(50) NOT NULL,
	`connectedAt` timestamp NOT NULL DEFAULT (now()),
	`disconnectedAt` timestamp,
	`bytesTransferred` bigint NOT NULL DEFAULT 0,
	CONSTRAINT `vpnConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `vpnSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`enabled` boolean NOT NULL DEFAULT false,
	`selectedServer` varchar(100) NOT NULL DEFAULT 'us-east',
	`protocol` enum('wireguard','openvpn','proxy') NOT NULL DEFAULT 'proxy',
	`autoConnect` boolean NOT NULL DEFAULT false,
	`killSwitch` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `vpnSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `vpnSettings_userId_unique` UNIQUE(`userId`)
);
