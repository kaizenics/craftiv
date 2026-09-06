import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { db } from "@/db";
import { MIN_PASSWORD_LENGTH } from "@/lib/constants/auth";
import * as schema from "@/db/schema";
import {
  sendAuthOtpEmail,
  sendChangeEmailVerificationEmail,
  sendVerificationLinkEmail,
} from "@/lib/email";

const toOrigin = (value?: string) => {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const expandOriginVariants = (origin: string | null): string[] => {
  if (!origin) return [];

  try {
    const url = new URL(origin);
    const host = url.hostname.toLowerCase();
    const out = new Set<string>([url.origin]);

    if (host.startsWith("www.")) {
      const naked = host.slice(4);
      out.add(`${url.protocol}//${naked}${url.port ? `:${url.port}` : ""}`);
    } else if (host.includes(".")) {
      out.add(`${url.protocol}//www.${host}${url.port ? `:${url.port}` : ""}`);
    }

    return Array.from(out);
  } catch {
    return [origin];
  }
};

const trustedOrigins = Array.from(
  new Set(
    [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      ...expandOriginVariants(toOrigin(process.env.BETTER_AUTH_URL)),
      ...expandOriginVariants(toOrigin(process.env.NEXT_PUBLIC_APP_URL)),
      ...expandOriginVariants(
        toOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined),
      ),
    ].filter((origin): origin is string => Boolean(origin)),
  )
);

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins,
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    /**
     * Every account starts with a credit balance, so an unverified signup is a
     * free grant to anyone who can type an address. Sign-in is gated on the
     * address actually belonging to the person using it.
     *
     * Existing accounts created before this was on will be asked to verify at
     * their next sign-in; Better Auth sends them the email at that moment.
     * Length is enforced on signup, reset and change only — never on sign-in —
     * so accounts with shorter existing passwords are not locked out.
     */
    requireEmailVerification: true,
    minPasswordLength: MIN_PASSWORD_LENGTH,
    /**
     * A reset is how someone recovers an account they may have lost control of,
     * so the old sessions must not outlive it. Without this an attacker holding
     * a stolen session keeps their access after the owner resets the password,
     * which defeats the point of the reset.
     *
     * The user is signed out during the reset flow, so there is no current
     * session to preserve; they sign in again afterwards.
     */
    revokeSessionsOnPasswordReset: true,
  },

  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendVerificationLinkEmail({ email: user.email, url });
    },
    /**
     * Signing up already proves the address by one-time code, so the link email
     * would be a second, redundant round trip — the OTP marks the account
     * verified instead.
     */
    sendOnSignUp: false,
    /**
     * Accounts created before verification was required have emailVerified
     * false, and sign-in now refuses them. This is what gives them a way back
     * in: without it Better Auth rejects the sign-in and sends nothing, which
     * is an permanent lockout, not a prompt.
     */
    sendOnSignIn: true,
    // Verifying is the last step of signing up; making it also sign the user in
    // avoids bouncing them to a login form they just came from.
    autoSignInAfterVerification: true,
  },

  user: {
    changeEmail: {
      enabled: true,
      /**
       * Confirmation goes to the address already on the account, so moving an
       * account to a new address requires control of the old one. Without this
       * the settings form could rewrite `users.email` to any unregistered
       * address — which the Polar webhook then trusts when it resolves an order
       * by billing email.
       */
      sendChangeEmailConfirmation: async ({ user, newEmail, url }) => {
        await sendChangeEmailVerificationEmail({ email: user.email, newEmail, url });
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
  },
  plugins: [
    nextCookies(),
    emailOTP({
      sendVerificationOTP: async ({ email, otp, type }) => {
        await sendAuthOtpEmail({ email, otp, type });
      },
    }),
  ],
});

