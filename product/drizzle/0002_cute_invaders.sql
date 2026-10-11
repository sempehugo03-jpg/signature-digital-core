CREATE TABLE `fp_seo_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`request_hash` text NOT NULL,
	`before_json` text NOT NULL,
	`after_json` text NOT NULL,
	`before_version` text NOT NULL,
	`after_version` text NOT NULL,
	`why` text NOT NULL,
	`source_commit` text NOT NULL,
	`state` text NOT NULL,
	`qa_json` text,
	`published_json` text,
	`published_version` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sd_seo_pages` (
	`slug` text PRIMARY KEY NOT NULL,
	`topic_key` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`eyebrow` text NOT NULL,
	`excerpt` text NOT NULL,
	`content_json` text NOT NULL,
	`status` text NOT NULL,
	`published_at` text,
	`updated_at` text NOT NULL
);
