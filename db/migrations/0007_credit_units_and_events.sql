CREATE TABLE `credit_events` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL,
  `event_type` text NOT NULL,
  `delta_units` integer NOT NULL,
  `balance_after_units` integer NOT NULL,
  `idempotency_key` text NOT NULL,
  `metadata_json` text,
  `created_at` integer NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_events_idempotency_key_unique` ON `credit_events` (`idempotency_key`);
--> statement-breakpoint
UPDATE `users`
SET `credit_balance` = `credit_balance` * 100;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS `users_credit_balance_units_default`
AFTER INSERT ON `users`
FOR EACH ROW
WHEN NEW.`credit_balance` IS NULL OR NEW.`credit_balance` = 1
BEGIN
  UPDATE `users`
  SET `credit_balance` = 100
  WHERE `id` = NEW.`id`;
END;
