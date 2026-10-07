CREATE TABLE `demo_state` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`version` integer DEFAULT 0 NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `photo_uploads` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`object_key` text NOT NULL,
	`content_type` text NOT NULL,
	`bytes` integer NOT NULL,
	`created_at` text NOT NULL
);
