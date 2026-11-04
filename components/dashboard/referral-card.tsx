"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Copy } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/trpc/client";

/** The user's invite link and how many friends it has brought in. */
export function ReferralCard() {
  const { data, isLoading } = trpc.referral.info.useQuery();
  if (isLoading || !data) return <Skeleton className="h-36 w-full rounded-xl" />;

  const link = `${window.location.origin}/sign-up?ref=${data.code}`;
  const copy = () =>
    navigator.clipboard.writeText(link).then(
      () => toast.success("Invite link copied."),
      () => toast.error("Couldn't copy. Select the link and copy it manually."),
    );

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          Invite a friend, you both get {data.rewardCredits} free credit{data.rewardCredits === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Paid when your friend signs up with your link and verifies their email. Up to {data.monthlyCap} friends a month.
        </p>
      </div>
      <div className="flex gap-2">
        <Input readOnly value={link} aria-label="Your invite link" onFocus={(event) => event.currentTarget.select()} />
        <Button type="button" variant="outline" onClick={copy} aria-label="Copy invite link">
          <Copy className="h-4 w-4" />
        </Button>
      </div>
      <p className="text-xs tabular-nums text-muted-foreground">
        {data.friendsJoined} friend{data.friendsJoined === 1 ? "" : "s"} joined · {data.creditsEarned} credit
        {data.creditsEarned === 1 ? "" : "s"} earned
      </p>
    </div>
  );
}
