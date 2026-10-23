-- Salary, location, status history and the saved follow-up email for the
-- application tracker.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- cards get empty fields and a history that starts with their current column.
ALTER TABLE `applications` ADD `salary` text DEFAULT '' NOT NULL;
ALTER TABLE `applications` ADD `location` text DEFAULT '' NOT NULL;
ALTER TABLE `applications` ADD `status_history` text DEFAULT '[]' NOT NULL;
ALTER TABLE `applications` ADD `follow_up_email` text DEFAULT '' NOT NULL;
UPDATE `applications` SET `status_history` = json_array(json_object('status', `status`, 'at', `updated_at` * 1000));
