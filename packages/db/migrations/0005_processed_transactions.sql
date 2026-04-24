CREATE TABLE `processed_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider` text DEFAULT 'paddle' NOT NULL,
	`transaction_id` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'completed' NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `processed_transactions_transaction_id_unique` ON `processed_transactions` (`transaction_id`);
