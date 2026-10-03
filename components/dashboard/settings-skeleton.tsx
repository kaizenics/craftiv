import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shown while a settings page loads its saved values, so users never see
 * placeholder data (or sections that don't apply to them) flash first.
 */
export function SettingsSkeleton({
  title,
  subtitle,
  sections = 2,
}: {
  title: string;
  subtitle: string;
  sections?: number;
}) {
  return (
    <div className="py-8" aria-busy="true" aria-live="polite">
      <h1 className="font-display text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground mt-1 mb-8">{subtitle}</p>
      <span className="sr-only">Loading your settings</span>

      <div className="space-y-8">
        {Array.from({ length: sections }, (_, section) => (
          <div key={section} className="space-y-4">
            <Skeleton className="h-4 w-28" />
            {[0, 1].map((row) => (
              <div key={row} className="flex items-center justify-between gap-4">
                <Skeleton className="h-4 w-56 max-w-[50%]" />
                <Skeleton className="h-9 w-40 rounded-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
