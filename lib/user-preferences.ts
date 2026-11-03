import { z } from "zod";

export const MAX_WEEKLY_APPLICATION_GOAL = 100;

export const DEFAULT_USER_PREFERENCES = {
  autoSaveDrafts: true,
  defaultSpellCheck: true,
  showResumeScore: true,
  compactEditor: false,
  weeklyApplicationGoal: 0,
} as const;

export const userPreferencesSchema = z.object({
  autoSaveDrafts: z.boolean(),
  defaultSpellCheck: z.boolean(),
  showResumeScore: z.boolean(),
  compactEditor: z.boolean(),
  weeklyApplicationGoal: z.number().int().min(0).max(MAX_WEEKLY_APPLICATION_GOAL),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export function getUserPreferencesFromRecord(record: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    autoSaveDrafts: record?.autoSaveDrafts ?? DEFAULT_USER_PREFERENCES.autoSaveDrafts,
    defaultSpellCheck: record?.defaultSpellCheck ?? DEFAULT_USER_PREFERENCES.defaultSpellCheck,
    showResumeScore: record?.showResumeScore ?? DEFAULT_USER_PREFERENCES.showResumeScore,
    compactEditor: record?.compactEditor ?? DEFAULT_USER_PREFERENCES.compactEditor,
    weeklyApplicationGoal: record?.weeklyApplicationGoal ?? DEFAULT_USER_PREFERENCES.weeklyApplicationGoal,
  };
}

/**
 * Resumes include a photo unless the user turns it off. The choice is persisted
 * under localStorage "showPhoto"; absent or unparseable means untouched, which
 * is the default rather than "off".
 */
export const DEFAULT_SHOW_PHOTO = true;

export function readShowPhotoPreference(): boolean {
  if (typeof window === "undefined") return DEFAULT_SHOW_PHOTO;

  const saved = window.localStorage.getItem("showPhoto");
  if (!saved) return DEFAULT_SHOW_PHOTO;

  try {
    const parsed = JSON.parse(saved);
    return typeof parsed === "boolean" ? parsed : DEFAULT_SHOW_PHOTO;
  } catch {
    return DEFAULT_SHOW_PHOTO;
  }
}
