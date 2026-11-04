"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { normalizeReferralCode, REFERRAL_STORAGE_KEY } from "@/lib/referral-code";
import { trpc } from "@/trpc/client";

const read = () => {
  try {
    return localStorage.getItem(REFERRAL_STORAGE_KEY);
  } catch {
    return null;
  }
};
const write = (code: string | null) => {
  try {
    if (code) localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    else localStorage.removeItem(REFERRAL_STORAGE_KEY);
  } catch {
    // Storage blocked: the invite simply isn't remembered across the sign-up redirect.
  }
};

/**
 * Remembers a ?ref= invite code from any page, then claims it once the visitor has an account.
 * The server decides whether it pays out; this only carries the code across the sign-up flow.
 */
export function ReferralTracker() {
  const { data: session } = authClient.useSession();
  const claim = trpc.referral.claim.useMutation();
  const attempted = useRef(false);

  useEffect(() => {
    const code = normalizeReferralCode(new URLSearchParams(window.location.search).get("ref"));
    // First invite wins: a later link doesn't replace the one that brought them here.
    if (code && !read()) write(code);
  }, []);

  const userId = session?.user?.id;
  useEffect(() => {
    const code = read();
    if (!userId || !code || attempted.current) return;
    attempted.current = true;
    claim.mutate(
      { code },
      {
        onSuccess: (outcome) => {
          // Unverified is the only outcome that can still change, so keep the code for the next visit.
          if (outcome.status !== "unverified") write(null);
          if (outcome.status === "rewarded") toast.success("Welcome! You and your friend each got a free credit.");
        },
        onError: () => {
          attempted.current = false;
        },
      },
    );
  }, [userId, claim]);

  return null;
}
