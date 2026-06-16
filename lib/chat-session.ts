/**
 * Pure chat-session model + localStorage persistence helpers for the chat page.
 * Kept framework-free so the storage/migration/formatting logic can be tested
 * without rendering the page.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  pinned?: boolean;
}

export interface ResumeParseResponse {
  data?: {
    contact?: {
      firstName?: string;
      lastName?: string;
      desiredJobTitle?: string;
      email?: string;
    };
    summary?: string;
    experiences?: Array<{
      jobTitle?: string;
      employer?: string;
      description?: string;
    }>;
    skills?: Array<{
      name?: string;
      level?: string;
    }>;
  };
  error?: string;
}

export const LEGACY_CHAT_STORAGE_KEY = "crafty-chat-session-v1";
export const CHAT_SESSIONS_STORAGE_KEY = "crafty-chat-sessions-v1";
export const ACTIVE_CHAT_STORAGE_KEY = "crafty-chat-active-v1";
export const LEGACY_STARTER_TEXT =
  "Hi! I'm Crafty. Share your question or resume layout prompt, and I can help you from here.";

export function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptySession(): ChatSession {
  return {
    id: createSessionId(),
    title: "New Chat",
    messages: [],
    updatedAt: Date.now(),
    pinned: false,
  };
}

export function cleanMessages(messages: ChatMessage[]) {
  return messages.filter(
    (item) =>
      item?.text?.trim() &&
      (item.role === "user" || item.role === "assistant") &&
      item.text.trim() !== LEGACY_STARTER_TEXT,
  );
}

export function getSessionTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.text.trim());
  if (!firstUserMessage) return "New Chat";

  const trimmed = firstUserMessage.text.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed;
}

export function buildResumeAttachmentContext(parsed: NonNullable<ResumeParseResponse["data"]>): string {
  const fullName = `${parsed.contact?.firstName ?? ""} ${parsed.contact?.lastName ?? ""}`.trim();
  const desiredTitle = parsed.contact?.desiredJobTitle?.trim() ?? "";
  const summary = parsed.summary?.trim() ?? "";
  const skills = (parsed.skills ?? [])
    .map((skill) => skill.name?.trim())
    .filter((skill): skill is string => Boolean(skill))
    .slice(0, 20);
  const experiences = (parsed.experiences ?? [])
    .map((experience) =>
      [experience.jobTitle?.trim(), experience.employer?.trim(), experience.description?.trim()]
        .filter(Boolean)
        .join(" | "),
    )
    .filter((item) => item.length > 0)
    .slice(0, 8);

  const sections: string[] = [];
  if (fullName) sections.push(`Name: ${fullName}`);
  if (desiredTitle) sections.push(`Target role: ${desiredTitle}`);
  if (summary) sections.push(`Summary: ${summary}`);
  if (skills.length > 0) sections.push(`Skills: ${skills.join(", ")}`);
  if (experiences.length > 0) sections.push(`Experience:\n- ${experiences.join("\n- ")}`);

  return sections.join("\n\n").slice(0, 6000);
}

export function readStoredChatState(): { sessions: ChatSession[]; activeSessionId: string } {
  if (typeof window === "undefined") {
    const starter = createEmptySession();
    return { sessions: [starter], activeSessionId: starter.id };
  }

  const fallbackSession = createEmptySession();

  try {
    const rawSessions = localStorage.getItem(CHAT_SESSIONS_STORAGE_KEY);
    const rawActiveId = localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);

    if (rawSessions) {
      const parsed = JSON.parse(rawSessions) as ChatSession[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = parsed
          .map((session) => {
            const messages = cleanMessages(Array.isArray(session?.messages) ? session.messages : []);
            return {
              id: session?.id || createSessionId(),
              title: session?.title?.trim() || getSessionTitle(messages),
              messages,
              updatedAt: typeof session?.updatedAt === "number" ? session.updatedAt : Date.now(),
              pinned: Boolean(session?.pinned),
            };
          })
          .filter((session) => session.id);

        if (normalized.length > 0) {
          const activeSessionId =
            rawActiveId && normalized.some((session) => session.id === rawActiveId)
              ? rawActiveId
              : normalized[0].id;

          return { sessions: normalized, activeSessionId };
        }
      }
    }

    const rawLegacyMessages = localStorage.getItem(LEGACY_CHAT_STORAGE_KEY);
    if (rawLegacyMessages) {
      const parsedLegacy = JSON.parse(rawLegacyMessages) as ChatMessage[];
      const messages = cleanMessages(Array.isArray(parsedLegacy) ? parsedLegacy : []);
      const migrated = {
        ...fallbackSession,
        title: getSessionTitle(messages),
        messages,
      };
      return { sessions: [migrated], activeSessionId: migrated.id };
    }
  } catch {
    return { sessions: [fallbackSession], activeSessionId: fallbackSession.id };
  }

  return { sessions: [fallbackSession], activeSessionId: fallbackSession.id };
}
