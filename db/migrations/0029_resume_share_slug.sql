-- Custom public links for shared resumes (/r/john-smith), alongside the random
-- token. Unique across all users; null means no custom link.
--
-- Apply this BEFORE deploying the code that reads it. Additive only: existing
-- resumes keep their token links and have no custom link.
ALTER TABLE `resumes` ADD `share_slug` text;
CREATE UNIQUE INDEX `resumes_share_slug_unique` ON `resumes` (`share_slug`);
