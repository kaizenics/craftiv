"use client";

import { AtsScoreGauge } from "@/components/dashboard/ats-score-gauge";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Check,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
} from "@/components/ui/icons";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  bandStyle,
  bandStyleFor,
  compatibilityBand,
  formatSavedAt,
  sortSectionsByNeed,
} from "@/lib/ats-display";
import type { AtsCheckReport } from "@/lib/types/ats-report";
import { cn } from "@/lib/utils";

type AtsReportPanelProps = {
  report: AtsCheckReport;
  sourceLabel: string;
  savedAt: string;
};

function SectionRow({
  section,
}: {
  section: AtsCheckReport["sectionScores"][number];
}) {
  const style = bandStyle(section.score);

  return (
    <li className="space-y-2 rounded-lg border border-border p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{section.section}</p>
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("text-xs font-medium", style.text)}>{style.label}</span>
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {section.score}
          </span>
        </div>
      </div>
      <Progress
        value={section.score}
        aria-label={section.section + " score: " + section.score + " out of 100. " + style.label + "."}
        className={cn("h-2", {
          "[&>[data-slot=progress-indicator]]:bg-destructive": style.band === "critical",
          "[&>[data-slot=progress-indicator]]:bg-warning": style.band === "attention",
          "[&>[data-slot=progress-indicator]]:bg-success": style.band === "strong",
        })}
      />
      <p className="text-sm leading-relaxed text-muted-foreground">{section.notes}</p>
    </li>
  );
}

function WarningPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "critical" | "attention";
}) {
  const style = bandStyleFor(tone);

  return (
    <div className={cn("rounded-xl border p-4", style.border, style.surface)}>
      <h3 className={cn("flex items-center gap-2 text-sm font-semibold", style.text)}>
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {title}
      </h3>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className={cn("flex gap-2 text-sm leading-relaxed", style.text)}>
            <span aria-hidden="true">&middot;</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AtsReportPanel({ report, sourceLabel, savedAt }: AtsReportPanelProps) {
  const compatibility = bandStyleFor(compatibilityBand(report.atsCompatibility));
  const sections = sortSectionsByNeed(report.sectionScores || []);
  const matched = report.matchedKeywords || [];
  const missing = report.missingKeywords || [];
  const improvements = report.improvements || [];
  const strengths = report.strengths || [];
  const placeholderWarnings = report.placeholderWarnings || [];
  const parseWarnings = report.parseWarnings || [];
  const savedLabel = formatSavedAt(savedAt);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
          <AtsScoreGauge score={report.overallScore} className="shrink-0" />

          <div className="w-full min-w-0 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Parser compatibility
              </p>
              <p
                className={cn(
                  "mt-1.5 inline-flex items-center gap-1.5 rounded-4xl border px-3 py-1 text-sm font-medium",
                  compatibility.pill
                )}
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                {report.atsCompatibility}
              </p>
            </div>

            {report.topActions?.[0] && (
              <div className="rounded-lg border border-border bg-muted/40 p-3">
                <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Target className="h-3.5 w-3.5" aria-hidden="true" />
                  Do this first
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                  {report.topActions[0]}
                </p>
              </div>
            )}

            <p className="text-xs leading-relaxed text-muted-foreground">
              {sourceLabel}
              {savedLabel ? <> &middot; {savedLabel}</> : null} &middot; Scoring{" "}
              {report.scoringVersion}
            </p>
          </div>
        </div>
      </div>

      {/* Blocking problems sit above the tabs: they are the one thing a user
          must not be able to miss by staying on the wrong tab. */}
      {(placeholderWarnings.length > 0 || parseWarnings.length > 0) && (
        <div className="grid gap-4 xl:grid-cols-2">
          {placeholderWarnings.length > 0 && (
            <WarningPanel
              title="Unfilled placeholders"
              items={placeholderWarnings}
              tone="critical"
            />
          )}
          {parseWarnings.length > 0 && (
            <WarningPanel title="Parse notes" items={parseWarnings} tone="attention" />
          )}
        </div>
      )}

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList className="w-full">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="keywords">
            Keywords
            <Badge variant="secondary" className="ml-1">
              {matched.length + missing.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="improvements">
            Fixes
            <Badge variant="secondary" className="ml-1">
              {improvements.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">Recruiter summary</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {report.summary}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">Section scores</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Weakest sections first, so the biggest win is at the top.
            </p>
            <ul className="mt-4 space-y-3">
              {sections.map((section, index) => (
                <SectionRow key={section.section + "-" + index} section={section} />
              ))}
            </ul>
          </div>

          {strengths.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="text-base font-semibold text-foreground">
                What is already working
              </h3>
              <ul className="mt-3 space-y-2">
                {strengths.map((item, index) => (
                  <li key={item + "-" + index} className="flex gap-2.5 text-sm">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-success"
                      aria-hidden="true"
                    />
                    <span className="leading-relaxed text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="keywords" className="space-y-4">
          {/* Each pill carries an icon as well as a colour, so matched and
              missing stay distinguishable without relying on hue. */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">
              Matched keywords{" "}
              <span className="font-normal text-muted-foreground">({matched.length})</span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Found in your resume and in the target role.
            </p>
            {matched.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No overlap found yet. Add a job description for a sharper match.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {matched.map((keyword, index) => (
                  <li
                    key={keyword + "-" + index}
                    className="inline-flex items-center gap-1.5 rounded-4xl border border-success-border bg-success-surface px-2.5 py-1 text-xs font-medium text-success-surface-foreground"
                  >
                    <Check className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {keyword}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="text-base font-semibold text-foreground">
              Missing keywords{" "}
              <span className="font-normal text-muted-foreground">({missing.length})</span>
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Wanted by the role but absent from your resume. Add the ones you can back up.
            </p>
            {missing.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nothing missing. Your resume covers the keywords we detected.
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {missing.map((keyword, index) => (
                  <li
                    key={keyword + "-" + index}
                    className="inline-flex items-center gap-1.5 rounded-4xl border border-warning-border bg-warning-surface px-2.5 py-1 text-xs font-medium text-warning-surface-foreground"
                  >
                    <Plus className="h-3 w-3 shrink-0" aria-hidden="true" />
                    {keyword}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="improvements" className="space-y-4">
          {improvements.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
              No specific rewrites suggested for this run.
            </div>
          ) : (
            <ol className="space-y-3">
              {improvements.map((item, index) => (
                <li
                  key={item.title + "-" + index}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-4xl bg-primary/10 text-xs font-semibold text-primary"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold text-foreground">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.why}
                      </p>
                      <div className="mt-3 rounded-lg border border-border bg-muted/40 p-3">
                        <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                          Try this
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                          {item.example}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}

          {report.rewrittenSummary && (
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-5">
              <h3 className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Suggested summary rewrite
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {report.rewrittenSummary}
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
