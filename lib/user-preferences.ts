import { z } from "zod";

export const DEFAULT_USER_PREFERENCES = {
  autoSaveDrafts: true,
  defaultSpellCheck: true,
  showResumeScore: true,
  compactEditor: false,
} as const;

export const userPreferencesSchema = z.object({
  autoSaveDrafts: z.boolean(),
  defaultSpellCheck: z.boolean(),
  showResumeScore: z.boolean(),
  compactEditor: z.boolean(),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export function getUserPreferencesFromRecord(record: Partial<UserPreferences> | null | undefined): UserPreferences {
  return {
    autoSaveDrafts: record?.autoSaveDrafts ?? DEFAULT_USER_PREFERENCES.autoSaveDrafts,
    defaultSpellCheck: record?.defaultSpellCheck ?? DEFAULT_USER_PREFERENCES.defaultSpellCheck,
    showResumeScore: record?.showResumeScore ?? DEFAULT_USER_PREFERENCES.showResumeScore,
    compactEditor: record?.compactEditor ?? DEFAULT_USER_PREFERENCES.compactEditor,
  };
}
