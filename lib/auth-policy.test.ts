import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, afterAll, test } from "vitest";

/**
 * Exercises the account policy against a real SQLite database and a real Better
 * Auth instance. These paths decide whether people can get into their accounts,
 * so a mock proves nothing useful about them.
 */

const dir = mkdtempSync(join(tmpdir(), "craftiv-auth-"));
const dbFile = join(dir, "auth.db");

process.env.TURSO_DATABASE_URL = `file:${dbFile}`;
process.env.TURSO_AUTH_TOKEN = "";
process.env.BETTER_AUTH_SECRET = "test-secret-value-at-least-32-chars-long";
process.env.BETTER_AUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "test-key";
process.env.AUTH_EMAIL_FROM = "noreply@test.local";

type SentEmail = { to: string[]; subject: string; text: string };
const sent: SentEmail[] = [];

const EMAIL = "person@example.com";
const PASSWORD = "correct-horse-battery";

let auth: typeof import("@/lib/auth").auth;
let db: import("@libsql/client").Client;

beforeAll(async () => {
  // Intercept Resend: nothing leaves the machine, and delivery is assertable.
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    if (String(url).includes("api.resend.com")) {
      sent.push(JSON.parse(String(init?.body)) as SentEmail);
      return new Response(JSON.stringify({ id: "stub" }), { status: 200 });
    }
    return realFetch(url as string, init);
  }) as typeof fetch;

  const { createClient } = await import("@libsql/client");
  db = createClient({ url: process.env.TURSO_DATABASE_URL! });

  for (const stmt of [
    `CREATE TABLE users (id text PRIMARY KEY, name text NOT NULL, email text NOT NULL UNIQUE,
       plan text NOT NULL DEFAULT 'free', is_paid integer NOT NULL DEFAULT 0,
       resume_created_count integer NOT NULL DEFAULT 0, cover_letter_created_count integer NOT NULL DEFAULT 0,
       credit_balance integer NOT NULL DEFAULT 100, auto_save_drafts integer NOT NULL DEFAULT 1,
       default_spell_check integer NOT NULL DEFAULT 1, show_resume_score integer NOT NULL DEFAULT 1,
       compact_editor integer NOT NULL DEFAULT 0, email_verified integer NOT NULL DEFAULT 0,
       image text, created_at integer NOT NULL, updated_at integer NOT NULL)`,
    `CREATE TABLE sessions (id text PRIMARY KEY, expires_at integer NOT NULL, token text NOT NULL UNIQUE,
       created_at integer NOT NULL, updated_at integer NOT NULL, ip_address text, user_agent text,
       user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE)`,
    `CREATE TABLE accounts (id text PRIMARY KEY, account_id text NOT NULL, provider_id text NOT NULL,
       issuer text NOT NULL DEFAULT '', user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
       access_token text, refresh_token text, id_token text, access_token_expires_at integer,
       refresh_token_expires_at integer, scope text, password text,
       created_at integer NOT NULL, updated_at integer NOT NULL)`,
    `CREATE UNIQUE INDEX accounts_issuer_account_id_idx ON accounts (issuer, account_id)`,
    `CREATE TABLE verifications (id text PRIMARY KEY, identifier text NOT NULL, value text NOT NULL,
       expires_at integer NOT NULL, created_at integer, updated_at integer)`,
  ]) {
    await db.execute(stmt);
  }

  ({ auth } = await import("@/lib/auth"));
});

afterAll(() => {
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // Windows keeps the SQLite file handle open past teardown. A leftover file
    // in the OS temp directory is not worth failing the suite over.
  }
});

/**
 * Signs in and returns a Cookie header the API will accept. The raw token is
 * not it — Better Auth signs its session cookie, so the value has to come from
 * the Set-Cookie the sign-in response actually issued.
 */
async function signInCookie(): Promise<Headers> {
  const response = await auth.api.signInEmail({
    body: { email: EMAIL, password: PASSWORD },
    asResponse: true,
  });

  const setCookie = response.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((entry) => entry.split(";")[0]).join("; ");
  assert.ok(cookie, "sign-in issued no cookie");
  return new Headers({ cookie });
}

test("a password below the minimum is refused at signup", async () => {
  await assert.rejects(
    () =>
      auth.api.signUpEmail({
        body: { email: "short@example.com", password: "Short1!a", name: "S" },
      }),
    /too short|PASSWORD_TOO_SHORT/i,
  );
});

test("signing up leaves the account unverified and issues no session", async () => {
  sent.length = 0;
  const result = await auth.api.signUpEmail({
    body: { email: EMAIL, password: PASSWORD, name: "A Person" },
  });

  assert.ok(result.user, "expected the account to be created");
  assert.equal(result.token, null, "an unverified signup must not be signed in");
  // sendOnSignUp is off: the one-time code carries verification, so a link
  // email here would be a redundant second round trip.
  assert.equal(sent.length, 0, `unexpected email: ${JSON.stringify(sent)}`);
});

test("an unverified account cannot sign in, and is sent a way back in", async () => {
  sent.length = 0;
  await assert.rejects(
    () => auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } }),
    /not verified|EMAIL_NOT_VERIFIED/i,
  );

  // Without emailVerification.sendOnSignIn this sends nothing, and every
  // account predating the policy is locked out permanently rather than prompted.
  assert.ok(
    sent.some((mail) => mail.subject === "Verify your email" && mail.to.includes(EMAIL)),
    `no recovery email was sent: ${JSON.stringify(sent)}`,
  );
});

test("the signup one-time code verifies the account and signs the user in", async () => {
  sent.length = 0;
  await auth.api.sendVerificationOTP({ body: { email: EMAIL, type: "email-verification" } });

  const otp = (sent.at(-1)?.text ?? "").match(/\b(\d{4,8})\b/)?.[1];
  assert.ok(otp, `no code in the delivered email: ${JSON.stringify(sent)}`);

  const verified = await auth.api.verifyEmailOTP({ body: { email: EMAIL, otp } });
  assert.equal(verified.user?.emailVerified, true);
  assert.ok(verified.token, "autoSignInAfterVerification should establish the session");

  const signedIn = await auth.api.signInEmail({ body: { email: EMAIL, password: PASSWORD } });
  assert.ok(signedIn.token, "a verified account must be able to sign in");
});

test("changing the email confirms against the old address and defers the write", async () => {
  const headers = await signInCookie();
  sent.length = 0;

  await auth.api.changeEmail({
    body: { newEmail: "new@example.com", callbackURL: "/dashboard/settings" },
    headers,
  });

  const confirmation = sent.at(-1);
  assert.ok(confirmation, "no confirmation email was sent");
  // Sent to the address already on the account: moving an account requires
  // control of the address it currently uses.
  assert.deepEqual(confirmation.to, [EMAIL]);

  const row = await db.execute({ sql: "SELECT email FROM users WHERE email = ?", args: [EMAIL] });
  assert.equal(row.rows.length, 1, "the address must not change before confirmation");
});
