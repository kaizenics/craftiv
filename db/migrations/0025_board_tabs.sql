-- Tabs on the Applications page: several boards per user, each with its own
-- cards, frames and notes.
--
-- Apply this BEFORE deploying the code that reads it. Existing cards and canvas
-- items move into one "My board" tab per user, so nothing is lost.
CREATE TABLE `boards` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text NOT NULL,
	`position` real DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
CREATE INDEX `boards_user_idx` ON `boards` (`user_id`);
INSERT INTO `boards` (`id`, `user_id`, `name`, `position`, `created_at`)
	SELECT `user_id` || ':main', `user_id`, 'My board', 0, unixepoch()
	FROM (SELECT `user_id` FROM `applications` UNION SELECT `user_id` FROM `board_items`);
ALTER TABLE `applications` ADD `board_id` text REFERENCES `boards`(`id`) ON DELETE set null;
UPDATE `applications` SET `board_id` = `user_id` || ':main';
-- board_items needs a NOT NULL board_id, so the table is rebuilt with it.
CREATE TABLE `board_items_new` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`board_id` text NOT NULL,
	`kind` text NOT NULL,
	`data` text DEFAULT '{}' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`board_id`) REFERENCES `boards`(`id`) ON UPDATE no action ON DELETE cascade
);
INSERT INTO `board_items_new` SELECT `id`, `user_id`, `user_id` || ':main', `kind`, `data`, `created_at`, `updated_at` FROM `board_items`;
DROP TABLE `board_items`;
ALTER TABLE `board_items_new` RENAME TO `board_items`;
CREATE INDEX `board_items_board_idx` ON `board_items` (`user_id`, `board_id`);
