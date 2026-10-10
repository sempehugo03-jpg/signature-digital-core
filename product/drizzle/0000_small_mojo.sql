CREATE TABLE `fp_activations` (
	`project_id` text PRIMARY KEY NOT NULL,
	`version_id` text NOT NULL,
	`approval_id` text NOT NULL,
	`stripe_session_id` text NOT NULL,
	`artifact_hash` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `fp_versions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approval_id`) REFERENCES `fp_approvals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_activations_unique_stripe_session_id` ON `fp_activations` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `fp_approvals` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version_id` text NOT NULL,
	`artifact_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`version_id`) REFERENCES `fp_versions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_approvals_unique_project_id_version_id_artifact_hash` ON `fp_approvals` (`project_id`,`version_id`,`artifact_hash`);--> statement-breakpoint
CREATE TABLE `fp_auth_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fp_checkouts` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`approval_id` text NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`stripe_session_id` text,
	`url` text,
	`state` text DEFAULT 'creating' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`approval_id`) REFERENCES `fp_approvals`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_checkouts_one_pending` ON `fp_checkouts` (`project_id`) WHERE state IN ('creating','open','processing');--> statement-breakpoint
CREATE UNIQUE INDEX `fp_checkouts_unique_approval_id_attempt` ON `fp_checkouts` (`approval_id`,`attempt`);--> statement-breakpoint
CREATE UNIQUE INDEX `fp_checkouts_unique_stripe_session_id` ON `fp_checkouts` (`stripe_session_id`);--> statement-breakpoint
CREATE TABLE `fp_events` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`user_id` text,
	`project_id` text,
	`name` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `fp_events_project` ON `fp_events` (`project_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `fp_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`version_id` text NOT NULL,
	`request_key` text NOT NULL,
	`status` text NOT NULL,
	`adapter_handle` text NOT NULL,
	`input_snapshot` text NOT NULL,
	`progress` text DEFAULT '{}' NOT NULL,
	`error` text,
	`result_hash` text,
	`recoverable` integer DEFAULT 1 NOT NULL,
	`attempt` integer DEFAULT 1 NOT NULL,
	`last_retry_key` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "fp_jobs_status_check" CHECK(status IN ('draft','queued','understanding','planning','creating','rendering','ready','failed','cancelled'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_jobs_one_running` ON `fp_jobs` (`project_id`) WHERE status IN ('queued','understanding','planning','creating','rendering');--> statement-breakpoint
CREATE UNIQUE INDEX `fp_jobs_unique_project_id_request_key` ON `fp_jobs` (`project_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `fp_projects` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`request_key` text NOT NULL,
	`company_input` text DEFAULT '{}' NOT NULL,
	`draft_revision` integer DEFAULT 0 NOT NULL,
	`step` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`attribution` text DEFAULT '{}' NOT NULL,
	`approved_version_id` text,
	`active_version_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `fp_projects_owner` ON `fp_projects` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `fp_projects_unique_user_id_request_key` ON `fp_projects` (`user_id`,`request_key`);--> statement-breakpoint
CREATE TABLE `fp_subscriptions` (
	`project_id` text PRIMARY KEY NOT NULL,
	`stripe_subscription_id` text NOT NULL,
	`stripe_customer_id` text NOT NULL,
	`state` text NOT NULL,
	`price_id` text NOT NULL,
	`amount` integer NOT NULL,
	`currency` text NOT NULL,
	`provider_updated_at` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "fp_subscriptions_amount_check" CHECK(amount=5900),
	CONSTRAINT "fp_subscriptions_currency_check" CHECK(currency='eur')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_subscriptions_unique_stripe_subscription_id` ON `fp_subscriptions` (`stripe_subscription_id`);--> statement-breakpoint
CREATE TABLE `fp_versions` (
	`id` text PRIMARY KEY NOT NULL,
	`project_id` text NOT NULL,
	`number` integer NOT NULL,
	`job_id` text NOT NULL,
	`source` text NOT NULL,
	`state` text NOT NULL,
	`modification` text DEFAULT '' NOT NULL,
	`html` text,
	`artifact_hash` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`project_id`) REFERENCES `fp_projects`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_id`) REFERENCES `fp_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `fp_versions_unique_project_id_number` ON `fp_versions` (`project_id`,`number`);--> statement-breakpoint
CREATE TABLE `fp_webhooks` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`state` text NOT NULL,
	`created_at` text NOT NULL,
	`processed_at` text
);
--> statement-breakpoint
CREATE TABLE `sd_platform_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL,
	`last_seen_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sd_platform_sessions_token_idx` ON `sd_platform_sessions` (`token_hash`);--> statement-breakpoint
CREATE TABLE `sd_platform_users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`avatar_url` text DEFAULT '' NOT NULL,
	`provider` text DEFAULT 'password' NOT NULL,
	`provider_subject` text DEFAULT '' NOT NULL,
	`password_hash` text DEFAULT '' NOT NULL,
	`password_salt` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sd_platform_users_email_idx` ON `sd_platform_users` (`email`);