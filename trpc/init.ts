import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { isUserFacingError } from "@/lib/errors";

import { db } from "@/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * tRPC Context
 * Available in all tRPC procedures
 */
export const createTRPCContext = async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return {
    db,
    session,
    user: session?.user ?? null,
    requestHeaders,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * tRPC Initialization
 * Configured with superjson for data serialization
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    // Unexpected failures (database, SDK, env) keep their real message in the
    // server log only; the client gets a generic one.
    const message = isUserFacingError(error)
      ? shape.message
      : "Something went wrong. Please try again.";
    return {
      ...shape,
      message,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Router and Procedure Exports
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

/**
 * Public Procedure
 * No authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected Procedure
 * Requires authenticated user session
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});
