CREATE TABLE `fp_first_touch` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`google_origin` integer NOT NULL,
	`evidence` text NOT NULL,
	`landing_path` text NOT NULL,
	`referrer_host` text NOT NULL,
	`is_test` integer NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fp_project_first_touch` (
	`project_id` text PRIMARY KEY NOT NULL,
	`touch_id` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fp_user_first_touch` (
	`user_id` text PRIMARY KEY NOT NULL,
	`touch_id` text NOT NULL,
	`acquisition_verified` integer NOT NULL,
	`created_at` text NOT NULL
);
