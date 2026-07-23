CREATE TABLE `published_venues` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_json` text NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`report_id` text NOT NULL,
	`published_at` text NOT NULL,
	`hidden_at` text
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`venue_name` text DEFAULT '' NOT NULL,
	`evaluator_name` text DEFAULT '' NOT NULL,
	`status` text NOT NULL,
	`original_name` text NOT NULL,
	`r2_key` text NOT NULL,
	`file_size` integer NOT NULL,
	`extracted_text` text NOT NULL,
	`analysis_json` text,
	`analysis_mode` text,
	`analysis_model` text,
	`analysis_error` text,
	`openai_response_id` text,
	`venue_draft_json` text,
	`review_notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`published_at` text
);
