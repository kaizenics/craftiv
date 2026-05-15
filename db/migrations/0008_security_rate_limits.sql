CREATE TABLE `rate_limits` (
  `key` text PRIMARY KEY NOT NULL,
  `scope` text NOT NULL,
  `route` text NOT NULL,
  `subject_type` text NOT NULL,
  `subject_id` text NOT NULL,
  `window_name` text NOT NULL,
  `window_size_seconds` integer NOT NULL,
  `window_start_ms` integer NOT NULL,
  `count` integer DEFAULT 0 NOT NULL,
  `created_at` integer NOT NULL,
  `updated_at` integer NOT NULL
);

CREATE INDEX `rate_limits_scope_subject_idx`
  ON `rate_limits` (`scope`,`subject_type`,`subject_id`);

CREATE INDEX `rate_limits_window_start_idx`
  ON `rate_limits` (`window_start_ms`);
