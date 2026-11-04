"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, RefreshCw } from "@/components/ui/icons";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { isValidShareSlug, normalizeShareSlug } from "@/lib/share-slug";
import { ShareQr } from "@/components/share/share-qr";
import { trpc } from "@/trpc/client";

export type ShareableKind = "resume" | "coverLetter";

const KIND_COPY: Record<ShareableKind, { path: string; noun: string }> = {
  resume: { path: "r", noun: "resume" },
  coverLetter: { path: "c", noun: "cover letter" },
};

/** Share dialog for a resume (/r/<token>) or cover letter (/c/<token>). */
export function ShareLinkDialog({
  kind,
  id,
  open,
  onOpenChange,
  onBeforeEnable,
}: {
  kind: ShareableKind;
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Saves pending edits so the shared page shows the latest version. */
  onBeforeEnable?: () => Promise<void>;
}) {
  const utils = trpc.useUtils();
  const target = { kind, id };
  const { path, noun } = KIND_COPY[kind];
  const shareUrl = (token: string) => `${window.location.origin}/${path}/${token}`;
  const share = trpc.share.get.useQuery(target, { enabled: open });
  const setEnabled = trpc.share.setEnabled.useMutation();
  const regenerate = trpc.share.regenerate.useMutation();
  const [confirmingRegenerate, setConfirmingRegenerate] = useState(false);

  const setSlug = trpc.share.setSlug.useMutation();
  const [slugDraft, setSlugDraft] = useState<string | null>(null);

  const enabled = share.data?.enabled ?? false;
  // The custom link, when set, is the one to hand out; the token link keeps working beside it.
  const token = share.data?.slug ?? share.data?.token ?? null;
  const isBusy = setEnabled.isPending || regenerate.isPending || setSlug.isPending;
  const slugValue = slugDraft ?? share.data?.slug ?? "";
  const slugPreview = normalizeShareSlug(slugValue);
  const slugInvalid = slugPreview !== "" && !isValidShareSlug(slugPreview);

  const handleSaveSlug = async () => {
    try {
      const { slug } = await setSlug.mutateAsync({ id, slug: slugValue });
      setSlugDraft(null);
      await refresh();
      toast.success(slug ? "Custom link saved." : "Custom link removed.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save the link. Please try again.");
    }
  };

  const refresh = () =>
    Promise.all([
      utils.share.get.invalidate(target),
      kind === "resume"
        ? utils.resume.listSummary.invalidate()
        : utils.coverLetter.listSummary.invalidate(),
    ]);

  const handleToggle = async (next: boolean) => {
    try {
      if (next) await onBeforeEnable?.();
      await setEnabled.mutateAsync({ ...target, enabled: next });
      await refresh();
      toast.success(next ? "Share link is live." : "Share link turned off.");
    } catch (error) {
      console.error("Failed to update sharing:", error);
      toast.error("Couldn't update sharing. Please try again.");
    }
  };

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      toast.success("Link copied.");
    } catch {
      toast.error("Couldn't copy. Select the link and copy it manually.");
    }
  };

  const handleRegenerate = async () => {
    try {
      await regenerate.mutateAsync(target);
      await refresh();
      setConfirmingRegenerate(false);
      toast.success("New link created. The old one no longer works.");
    } catch (error) {
      console.error("Failed to regenerate share link:", error);
      toast.error("Couldn't create a new link. Please try again.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setConfirmingRegenerate(false);
          setSlugDraft(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share your {noun}</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this {noun}. It updates as you edit and is hidden
            from search engines.
          </DialogDescription>
        </DialogHeader>

        {share.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : (
          <div className="space-y-5">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Public link</span>
              <Switch checked={enabled} onCheckedChange={handleToggle} disabled={isBusy} />
            </label>

            {enabled && token && (
              <>
                <div className="flex gap-2">
                  <Input readOnly value={shareUrl(token)} onFocus={(e) => e.currentTarget.select()} />
                  <Button type="button" variant="outline" onClick={handleCopy} aria-label="Copy link">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <ShareQr url={shareUrl(token)} fileName={`${noun.replace(/\s+/g, "-")}-qr-${token}`} />

                {kind === "resume" ? (
                  <div className="space-y-1.5">
                    <label htmlFor="share-slug" className="text-sm font-medium">
                      Custom link
                    </label>
                    <div className="flex gap-2">
                      <div className="flex min-w-0 flex-1 items-center rounded-md border border-input bg-background pl-3 text-sm focus-within:ring-[3px] focus-within:ring-ring/50">
                        <span className="shrink-0 text-muted-foreground">/{path}/</span>
                        <input
                          id="share-slug"
                          value={slugValue}
                          maxLength={60}
                          placeholder="your-name"
                          aria-invalid={slugInvalid}
                          onChange={(event) => setSlugDraft(event.target.value)}
                          className="h-9 min-w-0 flex-1 bg-transparent pr-3 outline-none"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSaveSlug}
                        disabled={isBusy || slugInvalid || slugPreview === (share.data?.slug ?? "")}
                      >
                        {setSlug.isPending ? "Saving..." : "Save"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {slugInvalid
                        ? "Use 3 to 40 letters, numbers or hyphens."
                        : slugPreview && slugPreview !== slugValue
                          ? `Will be saved as /${path}/${slugPreview}.`
                          : "Easier to read on a printed resume. Anyone who guesses it can open it while sharing is on."}
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-semibold">{share.data?.totalViews ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Total views</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-2xl font-semibold">{share.data?.viewsLast30Days ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Last 30 days</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {share.data?.lastViewedAt
                    ? `Last viewed ${new Date(share.data.lastViewedAt).toLocaleString()}.`
                    : "No views yet."}{" "}
                  Each visitor counts once a day; your own views don&apos;t count.
                </p>

                {confirmingRegenerate ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
                    <p>
                      The current link{share.data?.slug ? ", including your custom link," : ""} will stop working for everyone
                      you sent it to.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" onClick={handleRegenerate} disabled={isBusy}>
                        {regenerate.isPending ? "Creating..." : "Create new link"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConfirmingRegenerate(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="px-0 text-muted-foreground"
                    onClick={() => setConfirmingRegenerate(true)}
                  >
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Create a new link
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
