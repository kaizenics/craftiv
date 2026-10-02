"use client";

import { authClient } from "@/lib/auth-client";
import { AI_PROVIDERS } from "@/lib/ai-providers";
import { trpc } from "@/trpc/client";

/**
 * The label of the user's own AI provider when it is connected and switched
 * on, else null. AI actions then run on their key and cost no credits, so
 * credit prices shouldn't be shown.
 */
export function useOwnAiProvider(): string | null {
  const { data: session } = authClient.useSession();
  const { data: ownAi } = trpc.ownAi.get.useQuery(undefined, {
    enabled: !!session?.user,
    retry: false,
  });
  return ownAi?.unlocked && ownAi.connection?.enabled
    ? AI_PROVIDERS[ownAi.connection.provider].label
    : null;
}
