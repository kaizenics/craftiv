-- Archiving a tracked application hides it from the board without deleting
-- its notes or history; null means not archived.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- cards stay visible.
ALTER TABLE `applications` ADD `archived_at` integer;
