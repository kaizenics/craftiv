"use client";

import { SettingsSkeleton } from "@/components/dashboard/settings-skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { DEFAULT_USER_PREFERENCES, MAX_WEEKLY_APPLICATION_GOAL, type UserPreferences } from "@/lib/user-preferences";
import { trpc } from "@/trpc/client";

type SwitchKey = { [K in keyof UserPreferences]: UserPreferences[K] extends boolean ? K : never }[keyof UserPreferences];

const PREFERENCE_ROWS: { key: SwitchKey; label: string; description: string }[] = [
  {
    key: "autoSaveDrafts",
    label: "Auto-save drafts",
    description: "Automatically save resume changes while editing",
  },
  {
    key: "defaultSpellCheck",
    label: "Enable spell check by default",
    description: "Open resume editor with spell check panel enabled",
  },
  {
    key: "showResumeScore",
    label: "Show resume score in preview",
    description: "Display score badge at the top of resume preview",
  },
  {
    key: "compactEditor",
    label: "Compact editor mode",
    description: "Use denser spacing in editor forms for faster scanning",
  },
];

export default function PreferencesSettings() {
  const utils = trpc.useUtils();
  const { data: saved } = trpc.user.preferences.useQuery();
  const [preferences, setPreferences] = useState<UserPreferences>(
    () => saved ?? { ...DEFAULT_USER_PREFERENCES },
  );
  const [receiveEmails, setReceiveEmails] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(!!saved);

  const updatePreferences = trpc.user.updatePreferences.useMutation({
    onSuccess: async (next) => {
      utils.user.preferences.setData(undefined, next);
      await utils.user.me.invalidate();
      toast.success("Preferences saved.");
    },
    onError: (error) => toast.error(error.message || "Failed to save preferences."),
  });

  useEffect(() => {
    if (saved && !hasLoaded) {
      const timer = window.setTimeout(() => {
        setPreferences(saved);
        setHasLoaded(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [hasLoaded, saved]);

  if (!hasLoaded) {
    return (
      <SettingsSkeleton title="Preferences" subtitle="How Craftiv behaves while you work" sections={2} />
    );
  }

  return (
    <div className="py-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Preferences</h1>
      <p className="text-muted-foreground mt-1 mb-8">How Craftiv behaves while you work</p>

      {/* Applies as soon as it is picked, so it sits outside the form and its Save button. */}
      <div className="mb-4 flex flex-col gap-3 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <p className="text-sm text-foreground">Theme</p>
          <p className="text-xs text-muted-foreground">Choose light, dark, or match your device</p>
        </div>
        <ThemeToggle className="w-full sm:w-72" />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          updatePreferences.mutate(preferences);
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm text-foreground">Email notifications</p>
              <p className="text-xs text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={receiveEmails}
              onCheckedChange={setReceiveEmails}
              aria-label="Email notifications"
            />
          </div>
          {PREFERENCE_ROWS.map((row) => (
            <div key={row.key} className="flex items-center justify-between gap-4 py-2">
              <div>
                <p className="text-sm text-foreground">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.description}</p>
              </div>
              <Switch
                checked={preferences[row.key]}
                disabled={!hasLoaded}
                aria-label={row.label}
                onCheckedChange={(checked) =>
                  setPreferences((current) => ({ ...current, [row.key]: checked }))
                }
              />
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-2">
            <div>
              <label htmlFor="weekly-goal" className="text-sm text-foreground">
                Weekly application goal
              </label>
              <p className="text-xs text-muted-foreground">Shows your progress on the Applications page. 0 turns it off.</p>
            </div>
            <Input
              id="weekly-goal"
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_WEEKLY_APPLICATION_GOAL}
              className="w-20 text-right"
              value={preferences.weeklyApplicationGoal}
              onChange={(event) => {
                const goal = Math.round(Number(event.target.value) || 0);
                setPreferences((current) => ({
                  ...current,
                  weeklyApplicationGoal: Math.min(MAX_WEEKLY_APPLICATION_GOAL, Math.max(0, goal)),
                }));
              }}
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={!hasLoaded || updatePreferences.isPending}
          className="mt-6 w-full sm:w-auto"
        >
          {updatePreferences.isPending ? "Saving..." : "Save preferences"}
        </Button>
      </form>
    </div>
  );
}
