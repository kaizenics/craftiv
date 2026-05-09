import { z } from "zod";

export const resumeLayoutIntentSchema = z.enum([
  "new_resume",
  "refresh_existing_resume",
  "switch_industry",
  "unknown",
]);

export const resumeLayoutStatusSchema = z.enum([
  "ready",
  "needs_follow_up",
  "out_of_scope",
]);

export const inferredPreferencesSchema = z.object({
  targetRole: z.string().optional(),
  industry: z.string().optional(),
  seniority: z.string().optional(),
  tone: z.string().optional(),
  atsPriority: z.enum(["high", "medium", "low"]).optional(),
  layoutStyle: z.string().optional(),
});

export const templateRecommendationSchema = z.object({
  templateId: z.string(),
  reason: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

export const layoutBlueprintSchema = z.object({
  chosenTemplateId: z.string(),
  layout: z.enum([
    "classic",
    "modern",
    "sidebar",
    "bold",
    "minimal",
    "executive",
    "harvard",
  ]),
  sectionPriority: z.array(z.string()).min(1),
  sectionOrder: z.array(z.string()).min(1),
  styleNotes: z.array(z.string()),
  atsMode: z.boolean(),
});

export const resumeLayoutAssistantResponseSchema = z.object({
  status: resumeLayoutStatusSchema,
  intent: resumeLayoutIntentSchema,
  assistantMessage: z.string().min(1),
  inferredPreferences: inferredPreferencesSchema,
  missingDetails: z.array(z.string()),
  followUpQuestions: z.array(z.string()),
  recommendations: z.array(templateRecommendationSchema).min(1),
  blueprint: layoutBlueprintSchema,
});

export type ResumeLayoutAssistantResponse = z.infer<
  typeof resumeLayoutAssistantResponseSchema
>;

export interface ResumeLayoutChatRequest {
  message: string;
  history?: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
