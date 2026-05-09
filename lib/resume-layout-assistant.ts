import { callWithFallback, extractJsonObject } from "@/lib/ai";
import { templates } from "@/lib/data/templates";
import type { ResumeLayoutAssistantResponse } from "@/lib/types/resume-layout-chat";
import { resumeLayoutAssistantResponseSchema } from "@/lib/types/resume-layout-chat";

const MAX_HISTORY_MESSAGES = 10;
const TEMPLATE_IDS = new Set(templates.map((template) => template.id));

export function isLikelyResumeLayoutPrompt(message: string): boolean {
  const normalized = message.toLowerCase();
  const keywords = [
    "resume",
    "cv",
    "job",
    "role",
    "template",
    "ats",
    "industry",
    "apply",
    "application",
    "career",
    "experience",
    "skills",
    "summary",
    "design",
    "layout",
  ];
  return keywords.some((keyword) => normalized.includes(keyword));
}

function isUnsafeOrDisallowedPrompt(message: string): boolean {
  const normalized = message.toLowerCase();
  const blocked = [
    "malware",
    "ransomware",
    "ddos",
    "phishing",
    "exploit",
    "bypass",
    "weapon",
    "bomb",
    "terror",
  ];
  return blocked.some((keyword) => normalized.includes(keyword));
}

function buildTemplateCatalog(): string {
  return templates
    .map(
      (template) =>
        `- id=${template.id}; name=${template.name}; layout=${template.layout}; categories=${template.category.join(",")}; description=${template.description}`,
    )
    .join("\n");
}

function buildSystemPrompt(): string {
  return `You are Craftiv's resume layout assistant.
You must read user intent, infer layout preferences, choose best templates, and ask follow-up questions when details are missing.

Allowed template catalog:
${buildTemplateCatalog()}

Rules:
1) Recommend ONLY templateId values from the catalog above.
2) Provide 1 to 3 recommendations.
3) If the prompt lacks critical information (target role, industry, seniority, tone, ATS strictness), set status to "needs_follow_up" and ask concise follow-up questions.
4) If user asks for non-resume tasks, set status to "out_of_scope" and redirect them back to resume layout help.
5) Keep assistantMessage short, clear, and actionable.
6) Output blueprint.sectionPriority and blueprint.sectionOrder as practical resume sections.
7) Set atsMode=true when user asks for ATS-friendly or recruiter-safe output.

Return ONLY valid JSON matching this exact shape:
{
  "status": "ready" | "needs_follow_up" | "out_of_scope",
  "intent": "new_resume" | "refresh_existing_resume" | "switch_industry" | "unknown",
  "assistantMessage": "string",
  "inferredPreferences": {
    "targetRole": "string (optional)",
    "industry": "string (optional)",
    "seniority": "string (optional)",
    "tone": "string (optional)",
    "atsPriority": "high" | "medium" | "low" (optional),
    "layoutStyle": "string (optional)"
  },
  "missingDetails": ["string"],
  "followUpQuestions": ["string"],
  "recommendations": [
    {
      "templateId": "string",
      "reason": "string",
      "confidence": 0.0
    }
  ],
  "blueprint": {
    "chosenTemplateId": "string",
    "layout": "classic" | "modern" | "sidebar" | "bold" | "minimal" | "executive" | "harvard",
    "sectionPriority": ["string"],
    "sectionOrder": ["string"],
    "styleNotes": ["string"],
    "atsMode": true
  }
}`;
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value)) return 0.5;
  return Math.max(0, Math.min(1, value));
}

function buildFallbackResponse(message: string): ResumeLayoutAssistantResponse {
  const normalized = message.toLowerCase();

  let recommendedId = "clarity";
  if (/(director|vp|chief|executive|head of)/.test(normalized)) recommendedId = "zenith";
  else if (/(designer|creative|brand|ux|ui|portfolio)/.test(normalized)) recommendedId = "orbit";
  else if (/(engineer|developer|software|data|analyst|cloud|devops)/.test(normalized)) recommendedId = "forge";
  else if (/(student|intern|entry|graduate|junior)/.test(normalized)) recommendedId = "nova";
  else if (/(finance|accounting|legal|consulting)/.test(normalized)) recommendedId = "classic";

  const template = templates.find((item) => item.id === recommendedId) ?? templates[0]!;
  const hasRoleSignal = /(engineer|developer|analyst|manager|designer|accountant|consultant|marketer|sales|nurse|teacher|director|intern|student)/.test(normalized);
  const status: ResumeLayoutAssistantResponse["status"] = hasRoleSignal ? "ready" : "needs_follow_up";

  return {
    status,
    intent: "unknown",
    assistantMessage:
      status === "ready"
        ? `Based on your prompt, ${template.name} is a strong fit. I can refine this further once you share target role, industry, and tone preferences.`
        : "I can recommend a better layout with a bit more detail about your target role and industry.",
    inferredPreferences: {
      atsPriority: normalized.includes("ats") ? "high" : "medium",
    },
    missingDetails:
      status === "ready"
        ? []
        : ["target role", "industry", "seniority level", "preferred tone"],
    followUpQuestions:
      status === "ready"
        ? []
        : [
            "What exact role are you targeting?",
            "Which industry are you applying in?",
            "Do you prefer conservative ATS-safe or modern visual style?",
          ],
    recommendations: [
      {
        templateId: template.id,
        reason: template.description,
        confidence: 0.66,
      },
    ],
    blueprint: {
      chosenTemplateId: template.id,
      layout: template.layout,
      sectionPriority: ["experience", "skills", "summary", "education"],
      sectionOrder: ["contact", "summary", "experience", "skills", "education"],
      styleNotes: [
        "Lead with measurable achievements.",
        "Use scannable headings and concise bullet points.",
      ],
      atsMode: normalized.includes("ats"),
    },
  };
}

function normalizeModelResponse(
  parsed: ResumeLayoutAssistantResponse,
  fallbackMessage: string,
): ResumeLayoutAssistantResponse {
  const safeRecommendations = parsed.recommendations
    .filter((item) => TEMPLATE_IDS.has(item.templateId))
    .slice(0, 3)
    .map((item) => ({ ...item, confidence: clampConfidence(item.confidence) }));

  if (safeRecommendations.length === 0) {
    return buildFallbackResponse(fallbackMessage);
  }

  const chosenTemplateId = TEMPLATE_IDS.has(parsed.blueprint.chosenTemplateId)
    ? parsed.blueprint.chosenTemplateId
    : safeRecommendations[0]!.templateId;

  const chosenTemplate =
    templates.find((template) => template.id === chosenTemplateId) ??
    templates.find((template) => template.id === safeRecommendations[0]!.templateId) ??
    templates[0]!;

  return {
    ...parsed,
    recommendations: safeRecommendations,
    blueprint: {
      ...parsed.blueprint,
      chosenTemplateId: chosenTemplate.id,
      layout: chosenTemplate.layout,
    },
  };
}

export async function generateResumeLayoutResponse(params: {
  message: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}) {
  const message = params.message.trim();
  const history = (params.history ?? [])
    .filter((item) => item.content?.trim())
    .slice(-MAX_HISTORY_MESSAGES);

  if (isUnsafeOrDisallowedPrompt(message)) {
    const blocked = buildFallbackResponse("resume layout");
    blocked.status = "out_of_scope";
    blocked.assistantMessage =
      "I can only help with resume layout and job-application formatting requests.";
    blocked.followUpQuestions = [
      "What role are you targeting?",
      "Do you want an ATS-safe or modern visual style?",
    ];
    blocked.missingDetails = ["target role", "preferred style"];
    return { reply: blocked, meta: { fallbackUsed: true } };
  }

  if (!isLikelyResumeLayoutPrompt(message)) {
    const outOfScope = buildFallbackResponse(message);
    outOfScope.status = "out_of_scope";
    outOfScope.assistantMessage =
      "This assistant is focused on resume layout planning. Share the role, industry, and preferred style, and I can recommend the best template.";
    outOfScope.followUpQuestions = [
      "Which job title are you targeting?",
      "What tone should your resume have: conservative, modern, or creative?",
    ];
    outOfScope.missingDetails = ["target role", "style preference"];
    return { reply: outOfScope, meta: { fallbackUsed: true } };
  }

  if (message.length < 12) {
    const followUp = buildFallbackResponse(message);
    followUp.status = "needs_follow_up";
    followUp.assistantMessage =
      "I need a bit more detail to recommend a strong layout for your resume.";
    followUp.followUpQuestions = [
      "What role are you applying for?",
      "Which industry is this for?",
      "Do you want ATS-safe, modern, or creative style?",
    ];
    followUp.missingDetails = ["target role", "industry", "style"];
    return { reply: followUp, meta: { fallbackUsed: true } };
  }

  const aiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((item) => ({ role: item.role, content: item.content })),
    { role: "user", content: message },
  ];

  const { content, model } = await callWithFallback({
    messages: aiMessages,
    maxTokens: 1200,
    temperature: 0.25,
  });

  const rawJson = extractJsonObject(content);
  const parsed = resumeLayoutAssistantResponseSchema.safeParse(rawJson);
  if (!parsed.success) {
    return {
      reply: buildFallbackResponse(message),
      meta: {
        model,
        fallbackUsed: true,
        validationError: parsed.error.flatten(),
      },
    };
  }

  return {
    reply: normalizeModelResponse(parsed.data, message),
    meta: { model, fallbackUsed: false },
  };
}

export function formatResumeLayoutResponseForChat(
  response: ResumeLayoutAssistantResponse,
): string {
  const lines: string[] = [response.assistantMessage];

  if (response.recommendations.length > 0) {
    lines.push("");
    lines.push("Top template matches:");
    for (const rec of response.recommendations) {
      const template = templates.find((item) => item.id === rec.templateId);
      const name = template?.name ?? rec.templateId;
      const layout = template?.layout ?? response.blueprint.layout;
      lines.push(`- ${name} (${layout}) - ${Math.round(rec.confidence * 100)}% match`);
      lines.push(`  ${rec.reason}`);
    }
  }

  if (response.followUpQuestions.length > 0) {
    lines.push("");
    lines.push("To improve the recommendation, reply with:");
    for (const question of response.followUpQuestions) {
      lines.push(`- ${question}`);
    }
  }

  lines.push("");
  lines.push(
    `Suggested layout blueprint: template=${response.blueprint.chosenTemplateId}, sections=${response.blueprint.sectionOrder.join(" > ")}, ATS mode=${response.blueprint.atsMode ? "on" : "off"}.`,
  );

  return lines.join("\n");
}
