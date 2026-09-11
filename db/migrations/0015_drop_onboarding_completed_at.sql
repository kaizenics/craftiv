-- Contract half of the pair added in 0014. Safe only once no deployed code
-- still selects this column; Drizzle builds its SELECT list from the schema, so
-- that means after `onboardingCompletedAt` is gone from db/schema/users.ts.
ALTER TABLE `users` DROP COLUMN `onboarding_completed_at`;
