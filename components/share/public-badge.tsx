import { Globe } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

/** Marks a resume or cover letter whose public share link is switched on. */
export function PublicBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        className,
      )}
      title="Anyone with the share link can view this"
    >
      <Globe className="h-3 w-3" aria-hidden="true" />
      Public
    </span>
  );
}
