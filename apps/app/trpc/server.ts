import "server-only";

import { cache } from "react";
import { headers } from "next/headers";

import { createCallerFactory, appRouter, createTRPCContext } from "@/trpc";

/**
 * Server-side tRPC Caller
 * Use this in Server Components and Server Actions
 */
const createCaller = createCallerFactory(appRouter);

/**
 * Cached tRPC caller for server-side use
 * Automatically includes the current user's session
 */
export const api = cache(async () => {
  const context = await createTRPCContext();
  return createCaller(context);
});
