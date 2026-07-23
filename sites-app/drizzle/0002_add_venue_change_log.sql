CREATE TABLE `venue_change_log` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_id` text NOT NULL,
	`report_id` text,
	`actor_role` text NOT NULL,
	`actor_name` text NOT NULL,
	`action` text NOT NULL,
	`changes_json` text NOT NULL,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `venue_change_log_venue_created_idx` ON `venue_change_log` (`venue_id`,`created_at`);
