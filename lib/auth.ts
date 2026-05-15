import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { sendAuthOtpEmail } from "@/lib/email";

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

