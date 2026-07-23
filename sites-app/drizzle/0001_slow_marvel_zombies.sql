CREATE TABLE `venue_reviewers` (
	`venue_id` text PRIMARY KEY NOT NULL,
	`reviewer_name` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `venue_reviewers_token_hash_unique` ON `venue_reviewers` (`token_hash`);--> statement-breakpoint
ALTER TABLE `reports` ADD `venue_id` text;