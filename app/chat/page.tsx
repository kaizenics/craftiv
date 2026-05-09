"use client";

import Link from "next/link";
import {
  ChangeEvent,
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bot,
  ChevronDown,
  Loader2,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PencilLine,
  Plus,
  Search,
  SendHorizontal,
  Sparkles,
  X,
} from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type ChatRole = "user" | "assistant";

interface ChatMessage {
  role: ChatRole;
  text: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
  pinned?: boolean;
}

interface ResumeParseResponse {
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

const LEGACY_CHAT_STORAGE_KEY = "crafty-chat-session-v1";
const CHAT_SESSIONS_STORAGE_KEY = "crafty-chat-sessions-v1";
const ACTIVE_CHAT_STORAGE_KEY = "crafty-chat-active-v1";
const LEGACY_STARTER_TEXT =
  "Hi! I'm Crafty. Share your question or resume layout prompt, and I can help you from here.";

function createSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createEmptySession(): ChatSession {
  return {
    id: createSessionId(),
    title: "New Chat",
    messages: [],
    updatedAt: Date.now(),
    pinned: false,
  };
}

function cleanMessages(messages: ChatMessage[]) {
  return messages.filter(
    (item) =>
      item?.text?.trim() &&
      (item.role === "user" || item.role === "assistant") &&
      item.text.trim() !== LEGACY_STARTER_TEXT,
  );
}

function getSessionTitle(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user" && message.text.trim());
  if (!firstUserMessage) return "New Chat";

  const trimmed = firstUserMessage.text.trim();
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}...` : trimmed;
}

function buildResumeAttachmentContext(parsed: NonNullable<ResumeParseResponse["data"]>): string {
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

function readStoredChatState(): { sessions: ChatSession[]; activeSessionId: string } {
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

export default function ChatPage() {
  const initialState = useMemo(() => readStoredChatState(), []);
  const sessionQuery = authClient.useSession();
  const session = sessionQuery.data;
  const { data: subscription, isLoading: isSubscriptionLoading, isPending: isSubscriptionPending } =
    trpc.user.subscription.useQuery(undefined, {
      enabled: !!session?.user,
    });
  const isSessionLoading = typeof session === "undefined";
  const isCheckingAccess =
    isSessionLoading || (!!session?.user && (isSubscriptionLoading || isSubscriptionPending));
  const currentPlan = session?.user ? (subscription?.plan ?? "free") : "free";
  const canAccessChatbot = currentPlan === "plus" || currentPlan === "pro";

  const [chatSessions, setChatSessions] = useState<ChatSession[]>(initialState.sessions);
  const [activeSessionId, setActiveSessionId] = useState(initialState.activeSessionId);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isBackreading, setIsBackreading] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chatSearch, setChatSearch] = useState("");
  const [attachedResumeName, setAttachedResumeName] = useState<string | null>(null);
  const [attachedResumeContext, setAttachedResumeContext] = useState<string | null>(null);
  const [isParsingAttachment, setIsParsingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedSessions = useMemo(
    () =>
      [...chatSessions].sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) {
          return a.pinned ? -1 : 1;
        }
        return b.updatedAt - a.updatedAt;
      }),
    [chatSessions],
  );
  const filteredSessions = useMemo(() => {
    const query = chatSearch.trim().toLowerCase();
    if (!query) return sortedSessions;

    return sortedSessions.filter((chatSession) =>
      chatSession.title.toLowerCase().includes(query),
    );
  }, [chatSearch, sortedSessions]);

  const activeSession =
    chatSessions.find((chatSession) => chatSession.id === activeSessionId) ?? chatSessions[0] ?? createEmptySession();
  const messages = activeSession.messages;
  const hasConversation = messages.some((message) => message.role === "user");
  const displayName = session?.user?.name?.split(" ")[0] || "there";

  const history = useMemo(
    () =>
      messages.slice(-10).map((message) => ({
        role: message.role,
        content: message.text,
      })),
    [messages],
  );

  const replaceActiveSession = useCallback((updater: (session: ChatSession) => ChatSession) => {
    setChatSessions((prev) => {
      const next = prev.map((session) =>
        session.id === activeSessionId ? updater(session) : session,
      );
      return next.length > 0 ? next : [createEmptySession()];
    });
  }, [activeSessionId]);

  const createNewChat = useCallback(() => {
    const nextSession = createEmptySession();
    setChatSessions((prev) => [nextSession, ...prev]);
    setActiveSessionId(nextSession.id);
    setInputValue("");
    setIsBackreading(false);
    setMobileSidebarOpen(false);
  }, []);

  const selectSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
    setInputValue("");
    setIsBackreading(false);
    setMobileSidebarOpen(false);
  }, []);

  const renameSession = useCallback((sessionId: string) => {
    const target = chatSessions.find((session) => session.id === sessionId);
    if (!target) return;
    const nextTitle = window.prompt("Rename chat", target.title);
    if (nextTitle === null) return;
    const normalized = nextTitle.trim() || "New Chat";

    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              title: normalized,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
  }, [chatSessions]);

  const togglePinSession = useCallback((sessionId: string) => {
    setChatSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              pinned: !session.pinned,
              updatedAt: Date.now(),
            }
          : session,
      ),
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setChatSessions((prev) => {
      const next = prev.filter((session) => session.id !== sessionId);
      if (next.length === 0) {
        const fallback = createEmptySession();
        setActiveSessionId(fallback.id);
        return [fallback];
      }
      if (activeSessionId === sessionId) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
  }, [activeSessionId]);

  const scrollToLatest = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  }, []);

  const forceScrollToLatest = useCallback(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToLatest("auto");
      });
    });
  }, [scrollToLatest]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(CHAT_SESSIONS_STORAGE_KEY, JSON.stringify(chatSessions));
    localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, activeSessionId);
    localStorage.removeItem(LEGACY_CHAT_STORAGE_KEY);
  }, [chatSessions, activeSessionId]);

  useEffect(() => {
    if (!hasConversation) return;
    forceScrollToLatest();
  }, [activeSessionId, hasConversation, forceScrollToLatest]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const maxHeight = hasConversation ? 240 : 44;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [inputValue, hasConversation]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!hasConversation) return;

    const updateBackreadingState = () => {
      const containerDistanceFromBottom = container
        ? container.scrollHeight - container.scrollTop - container.clientHeight
        : 0;
      const pageDistanceFromBottom =
        document.documentElement.scrollHeight - window.scrollY - window.innerHeight;

      setIsBackreading(containerDistanceFromBottom > 32 || pageDistanceFromBottom > 32);
    };

    updateBackreadingState();
    container?.addEventListener("scroll", updateBackreadingState, { passive: true });
    window.addEventListener("scroll", updateBackreadingState, { passive: true });
    window.addEventListener("resize", updateBackreadingState);

    return () => {
      container?.removeEventListener("scroll", updateBackreadingState);
      window.removeEventListener("scroll", updateBackreadingState);
      window.removeEventListener("resize", updateBackreadingState);
    };
  }, [hasConversation, messages.length, isStreaming]);

  async function sendMessage() {
    const trimmed = inputValue.trim();
    if ((!trimmed && !attachedResumeContext) || isStreaming || isParsingAttachment) return;

    const nextMessages = [...messages, { role: "user", text: trimmed }, { role: "assistant", text: "" }] as ChatMessage[];

    replaceActiveSession((session) => ({
      ...session,
      messages: nextMessages,
      title: getSessionTitle(nextMessages),
      updatedAt: Date.now(),
    }));
    setInputValue("");
    setIsStreaming(true);
    setIsBackreading(false);
    forceScrollToLatest();

    try {
      const response = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed || "Please review my attached resume and help improve it.",
          history,
          resumeContext: attachedResumeContext ?? undefined,
          resumeFileName: attachedResumeName ?? undefined,
        }),
      });

      setAttachedResumeName(null);
      setAttachedResumeContext(null);
      setAttachmentError(null);

      if (!response.body) {
        throw new Error("Streaming response is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const setAssistantText = (text: string) => {
        replaceActiveSession((session) => {
          if (session.messages.length === 0) return session;
          const updatedMessages = [...session.messages];
          const last = updatedMessages[updatedMessages.length - 1];
          if (!last || last.role !== "assistant") return session;
          updatedMessages[updatedMessages.length - 1] = { ...last, text };
          return {
            ...session,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        });
        forceScrollToLatest();
      };

      const appendAssistantText = (token: string) => {
        replaceActiveSession((session) => {
          if (session.messages.length === 0) return session;
          const updatedMessages = [...session.messages];
          const last = updatedMessages[updatedMessages.length - 1];
          if (!last || last.role !== "assistant") return session;
          updatedMessages[updatedMessages.length - 1] = { ...last, text: `${last.text}${token}` };
          return {
            ...session,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        });
        forceScrollToLatest();
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const dataLine = eventChunk.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.slice(6)) as {
            type: "start" | "delta" | "done" | "error";
            token?: string;
            error?: string;
          };

          if (payload.type === "delta" && payload.token) {
            appendAssistantText(payload.token);
          }

          if (payload.type === "error") {
            setAssistantText(payload.error || "I ran into an issue. Please try again in a moment.");
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "I ran into an issue. Please try again in a moment.";

      replaceActiveSession((session) => {
        if (session.messages.length === 0) return session;
        const updatedMessages = [...session.messages];
        const last = updatedMessages[updatedMessages.length - 1];
        if (!last || last.role !== "assistant") return session;
        updatedMessages[updatedMessages.length - 1] = { ...last, text: errorMessage };
        return {
          ...session,
          messages: updatedMessages,
          updatedAt: Date.now(),
        };
      });
    } finally {
      setIsStreaming(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  function handleComposerKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  }

  function openFilePicker() {
    if (isParsingAttachment || isStreaming) return;
    fileInputRef.current?.click();
  }

  async function handleAttachResume(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const fileName = file.name.toLowerCase();
    const isSupported = fileName.endsWith(".pdf") || fileName.endsWith(".docx");
    if (!isSupported) {
      setAttachmentError("Only PDF and DOCX files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setAttachmentError("File size exceeds 10MB limit.");
      return;
    }

    setIsParsingAttachment(true);
    setAttachmentError(null);
    setAttachedResumeName(null);
    setAttachedResumeContext(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/resume/parse", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as ResumeParseResponse;
      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Failed to parse file.");
      }

      const context = buildResumeAttachmentContext(payload.data);
      if (!context.trim()) {
        throw new Error("Could not extract meaningful resume content from this file.");
      }

      setAttachedResumeName(file.name);
      setAttachedResumeContext(context);
    } catch (error) {
      setAttachmentError(error instanceof Error ? error.message : "Failed to process attachment.");
    } finally {
      setIsParsingAttachment(false);
    }
  }

  if (isCheckingAccess) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-4xl items-center justify-center px-4 py-10">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span className="text-sm">Checking your access...</span>
        </div>
      </main>
    );
  }

  if (!canAccessChatbot) {
    return (
      <main className="mx-auto flex min-h-[100svh] max-w-4xl items-center justify-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Chat</h1>
          <p className="mt-2 text-sm text-muted-foreground">Chat is available on Plus and Pro plans.</p>
          <Button asChild className="mt-5">
            <Link href="/pricing">Upgrade to unlock Chat</Link>
          </Button>
        </div>
      </main>
    );
  }

  const renderSidebarContent = (mobile = false) => (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <Link href="/chat" className="flex items-center gap-2">
          <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-foreground">Crafty</p>
          </div>
        </Link>
        {mobile ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}
      </div>

      <div className="space-y-1 px-3 pb-2 pt-3">
        <button
          type="button"
          onClick={createNewChat}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/10"
        >
          <PencilLine className="h-4 w-4 shrink-0" />
          <span>New chat</span>
        </button>
        <label className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition-colors focus-within:bg-muted/10">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={chatSearch}
            onChange={(event) => setChatSearch(event.target.value)}
            placeholder="Search chats"
            className="w-full bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Recent
        </div>
        <div className="space-y-1">
          {filteredSessions.map((chatSession) => {
            const isActive = chatSession.id === activeSessionId;

            return (
              <div
                key={chatSession.id}
                className={cn(
                  "group flex items-center gap-1 rounded-lg px-2 py-1 transition-colors",
                  isActive
                    ? "bg-muted/20 text-foreground"
                    : "text-sidebar-foreground hover:bg-muted/10 hover:text-foreground",
                )}
              >
                <button
                  type="button"
                  onClick={() => selectSession(chatSession.id)}
                  className="min-w-0 flex-1 rounded-md px-1 py-1.5 text-left"
                >
                  <p className="truncate text-sm font-medium">{chatSession.title}</p>
                </button>
                <div className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        aria-label="Chat actions"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted/20 hover:text-foreground"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => renameSession(chatSession.id)}>
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => togglePinSession(chatSession.id)}>
                        {chatSession.pinned ? "Unpin Chat" : "Pin Chat"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => deleteSession(chatSession.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-foreground hover:bg-muted/10"
        >
          <Link href="/dashboard">
            <Plus className="h-5 w-5 rotate-45" />
            <span>Back to dashboard</span>
          </Link>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleAttachResume}
      />
      {mobileSidebarOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-72 border-r border-border bg-sidebar transition-transform duration-300 lg:hidden",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {renderSidebarContent(true)}
      </aside>

      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-72 border-r border-border bg-sidebar lg:block">
        {renderSidebarContent()}
      </aside>

      <main
        className={cn(
          "px-3 py-3 sm:px-4 sm:py-4 lg:ml-72",
          hasConversation ? "min-h-[100svh]" : "h-[100svh] overflow-hidden",
        )}
      >
        <div
          className={cn(
            "mx-auto flex w-full max-w-[1100px] flex-col",
            hasConversation ? "min-h-[calc(100svh-1.5rem)]" : "h-[calc(100svh-1.5rem)]",
          )}
        >
          <header className="flex items-center justify-between px-1 py-2 sm:px-3 sm:py-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setMobileSidebarOpen(true)}
              className="fixed left-4 top-4 z-40 rounded-full bg-background shadow-sm lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div />
            <div />
          </header>

          <section className="relative flex flex-1 flex-col overflow-hidden">
            <div
              ref={messagesContainerRef}
              className={
                hasConversation
                  ? "flex-1 overflow-y-auto px-3 pb-54 md:pb-42 pt-3 sm:px-6"
                  : "flex-1 overflow-hidden px-3 sm:px-6"
              }
            >
              {!hasConversation ? (
                <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center text-center">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bot className="h-5 w-5" />
                  </div>
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">Good Morning, {displayName}</h1>
                  <h2 className="mt-2 text-4xl font-semibold tracking-tight text-foreground">
                    How Can I <span className="text-primary">Assist You Today?</span>
                  </h2>

                  <form onSubmit={handleSubmit} className="mt-8 w-full max-w-[860px] px-2">
                    <div className="rounded-full border border-border bg-card px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={openFilePicker}
                          disabled={isParsingAttachment || isStreaming}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50"
                        >
                          {isParsingAttachment ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                        <textarea
                          ref={textareaRef}
                          rows={1}
                          value={inputValue}
                          onChange={(event) => setInputValue(event.target.value)}
                          onKeyDown={handleComposerKeyDown}
                          placeholder="Initiate a query or send a command to the AI..."
                          className="max-h-[44px] min-h-[26px] w-full resize-none bg-transparent py-1 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                          disabled={isStreaming}
                        />
                        <Button
                          type="submit"
                          size="icon"
                          className="h-8 w-8 rounded-full"
                          aria-label="Send message"
                          disabled={isStreaming || isParsingAttachment || (!inputValue.trim() && !attachedResumeContext)}
                        >
                          <SendHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {attachedResumeName ? (
                      <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-foreground">
                        <Paperclip className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{attachedResumeName}</span>
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => {
                            setAttachedResumeName(null);
                            setAttachedResumeContext(null);
                            setAttachmentError(null);
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : null}
                    {attachmentError ? (
                      <p className="mt-2 text-xs text-destructive">{attachmentError}</p>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInputValue("Improve my resume content for stronger impact and ATS compatibility.")}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Improve Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue("Generate a resume draft for a software engineer role with measurable achievements.")}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                        Generate Resume
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue("Tailor my resume to this job description and highlight matching keywords.")}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      >
                        <Search className="h-3.5 w-3.5" />
                        Tailor to Job
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputValue("Review my resume for ATS issues and suggest fixes to improve score.")}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm text-foreground"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Fix ATS Score
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="mx-auto w-full max-w-[860px] space-y-7 py-4 sm:py-6">
                  {messages.map((message, index) =>
                    message.role === "assistant" && !message.text ? null : (
                      <div key={`${message.role}-${index}-${message.text}`} className="flex w-full">
                        {message.role === "assistant" ? (
                          <div className="mr-auto max-w-[88%] whitespace-pre-wrap rounded-2xl bg-background text-[15px] leading-7 text-foreground">
                            {message.text}
                          </div>
                        ) : (
                          <div className="ml-auto max-w-[86%] whitespace-pre-wrap rounded-2xl bg-primary px-4 py-3 text-[15px] leading-7 text-primary-foreground">
                            {message.text}
                          </div>
                        )}
                      </div>
                    ),
                  )}
                  {isStreaming ? (
                    <div className="mr-auto flex items-center gap-2 rounded-2xl bg-background px-4 py-3 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Crafty is thinking...</span>
                    </div>
                  ) : null}
                  <div ref={messagesEndRef} className="h-8 scroll-mb-80" />
                </div>
              )}
            </div>

          </section>
        </div>

        {hasConversation ? (
          <form
            onSubmit={handleSubmit}
            className="fixed bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-background via-background/95 to-transparent px-3 pb-3 pt-6 sm:px-6 sm:pb-5 lg:left-72"
          >
            <div className="relative mx-auto w-full max-w-[860px] rounded-2xl border border-border bg-card p-3 shadow-lg">
              {isBackreading ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon-sm"
                  className="absolute left-1/2 -top-8 z-50 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  aria-label="Jump to latest message"
                  onClick={() => scrollToLatest("smooth")}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              ) : null}
              <textarea
                ref={textareaRef}
                rows={1}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={handleComposerKeyDown}
                placeholder="Initiate a query or send a command to the AI..."
                className="max-h-[240px] min-h-[110px] w-full resize-none bg-transparent px-1 py-1 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isStreaming}
              />

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={isParsingAttachment || isStreaming}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground"
                  >
                    {isParsingAttachment ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {attachedResumeName ? (
                    <span className="inline-flex max-w-[200px] items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground">
                      <Paperclip className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{attachedResumeName}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={() => {
                          setAttachedResumeName(null);
                          setAttachedResumeContext(null);
                          setAttachmentError(null);
                        }}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setInputValue("Improve my resume content for stronger impact and ATS compatibility.")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Improve Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputValue("Generate a resume draft for a software engineer role with measurable achievements.")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                    Generate Resume
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputValue("Tailor my resume to this job description and highlight matching keywords.")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Tailor to Job
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputValue("Review my resume for ATS issues and suggest fixes to improve score.")}
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Fix ATS Score
                  </button>
                </div>

                <Button
                  type="submit"
                  size="icon"
                  className="h-9 w-9 rounded-lg"
                  aria-label="Send message"
                  disabled={isStreaming || isParsingAttachment || (!inputValue.trim() && !attachedResumeContext)}
                >
                  <SendHorizontal className="h-4 w-4" />
                </Button>
              </div>
              {attachmentError ? (
                <p className="mt-2 text-xs text-destructive">{attachmentError}</p>
              ) : null}
            </div>
          </form>
        ) : null}
      </main>
    </div>
  );
}
