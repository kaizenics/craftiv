-- The Applications canvas: frames, notes, text and arrows, plus each card's
-- position on it.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- cards keep a null position and are stacked inside their status frame.
CREATE TABLE `board_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `board_items_user_idx` ON `board_items` (`user_id`);
ALTER TABLE `applications` ADD `canvas_x` real;
ALTER TABLE `applications` ADD `canvas_y` real;
