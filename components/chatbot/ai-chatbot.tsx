"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";

export function Chatbot() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const currentPlan = session?.user ? (subscription?.plan ?? "free") : "free";
  const canAccessChatbot = currentPlan === "plus" || currentPlan === "pro";

  if (!canAccessChatbot || pathname === "/chat") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      <Button asChild type="button" size="icon-lg" className="h-14 w-14 rounded-full shadow-primary/30">
        <Link href="/chat" aria-label="Open chat page">
          <MessageCircle className="h-6 w-6" />
        </Link>
      </Button>
    </div>
  );
}
