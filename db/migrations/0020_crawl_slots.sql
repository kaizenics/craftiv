-- Cross-replica crawl clock: the next free request time per crawled host.
--
-- lib/job-sources/http.ts reserves each outbound request's slot here so a
-- host's robots.txt crawl delay holds across every server instance.
--
-- Safe in either order: until this table exists the crawler falls back to its
-- old per-process throttle, so deploying the code first is harmless.
CREATE TABLE `crawl_slots` (
	`host` text PRIMARY KEY NOT NULL,
	`next_at_ms` integer NOT NULL
);
