ALTER TABLE `users` ADD `emailStorageLimit` bigint DEFAULT 16106127360 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `emailStorageUsed` bigint DEFAULT 0 NOT NULL;