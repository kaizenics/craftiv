import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "../init";
import { claimReferral, referralSummary } from "@/lib/referrals";
import { enforceRouteRateLimits } from "@/lib/security/guards";

/** Invite-a-friend credits: the user's own invite code, and claiming the code they arrived with. */
export const referralRouter = createTRPCRouter({
  info: protectedProcedure.query(({ ctx }) => referralSummary(ctx.db, ctx.user.id)),

  claim: protectedProcedure.input(z.object({ code: z.string().max(32) })).mutation(async ({ ctx, input }) => {
    // Slows anyone trying codes to discover which users exist.
    const limit = await enforceRouteRateLimits({
      category: "global",
      route: "/api/trpc/referral.claim",
      requestHeaders: ctx.requestHeaders,
      userId: ctx.user.id,
    });
    if (!limit.allowed) {
      throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `Try again in ${limit.retryAfterSeconds} seconds.` });
    }
    return claimReferral(ctx.db, ctx.user.id, input.code);
  }),
});
