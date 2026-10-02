/**
 * Startup check for server environment variables, run once from
 * instrumentation.ts. Failing the boot takes the whole site down, so only the
 * variables nothing can run without are required; everything else is logged.
 */
const REQUIRED = ["TURSO_DATABASE_URL", "BETTER_AUTH_SECRET"] as const;

/** Features that switch off or break without these, but the app still runs. */
const RECOMMENDED = [
  "AI_KEY_ENCRYPTION_KEY",
  "OPENROUTER_API_KEY",
  "BETTER_AUTH_URL",
  "POLAR_WEBHOOK_SECRET",
  "POLAR_PRODUCT_ID_ACTIVE",
  "POLAR_PRODUCT_ID_PLUS",
  "POLAR_PRODUCT_ID_PRO",
  "RESEND_API_KEY",
  "CRON_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
] as const;

function isMissing(name: string): boolean {
  return !process.env[name]?.trim();
}

export function checkServerEnv(): void {
  const missingRequired = REQUIRED.filter(isMissing);
  const missingRecommended = RECOMMENDED.filter(isMissing);

  if (missingRecommended.length > 0) {
    console.warn(`[env] Missing optional variables: ${missingRecommended.join(", ")}`);
  }
  if (missingRequired.length === 0) return;

  const message = `[env] Missing required variables: ${missingRequired.join(", ")}`;
  if (process.env.NODE_ENV === "production") throw new Error(message);
  console.error(message);
}
