import { TRPCError } from "@trpc/server";

/**
 * An error whose message was written for the user and is safe to show as-is.
 * Anything else (database, SDK, env, filesystem) can carry query text, hostnames
 * or variable names, so it is logged server-side and replaced with a fallback.
 */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** True for errors we threw on purpose with a message meant for the user. */
export function isUserFacingError(error: unknown): error is Error {
  if (error instanceof UserFacingError) return true;
  // A TRPCError we constructed ourselves carries our message. tRPC also wraps
  // unknown errors as INTERNAL_SERVER_ERROR with the original as `cause` and its
  // message copied over; those are not ours to show.
  if (error instanceof TRPCError) {
    return !(error.code === "INTERNAL_SERVER_ERROR" && error.cause instanceof Error && !(error.cause instanceof TRPCError));
  }
  return false;
}

export function publicErrorMessage(error: unknown, fallback: string): string {
  return isUserFacingError(error) ? error.message : fallback;
}
