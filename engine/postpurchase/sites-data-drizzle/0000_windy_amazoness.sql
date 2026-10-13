CREATE TABLE `fs_data_artifacts` (
	`sha256` text PRIMARY KEY NOT NULL,
	`html` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fs_data_asset_parts` (
	`sha256` text NOT NULL,
	`part` integer NOT NULL,
	`chunk_sha256` text NOT NULL,
	`bytes` blob NOT NULL,
	PRIMARY KEY(`sha256`, `part`)
);
--> statement-breakpoint
CREATE TABLE `fs_data_assets` (
	`sha256` text PRIMARY KEY NOT NULL,
	`byte_size` integer NOT NULL,
	`part_count` integer NOT NULL,
	`state` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fs_data_commands` (
	`command_key` text PRIMARY KEY NOT NULL,
	`payload_hash` text NOT NULL,
	`state` text NOT NULL,
	`receipt_json` text
);
--> statement-breakpoint
CREATE TABLE `fs_data_nonces` (
	`nonce` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fs_data_releases` (
	`release_ref` text PRIMARY KEY NOT NULL,
	`sha256` text NOT NULL,
	`generation` integer NOT NULL,
	`receipt_json` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `fs_data_state` (
	`singleton` integer PRIMARY KEY NOT NULL,
	`binding_json` text NOT NULL,
	`current_release` text NOT NULL,
	`revision` integer NOT NULL,
	CONSTRAINT "fs_data_singleton" CHECK("fs_data_state"."singleton"=1)
);
