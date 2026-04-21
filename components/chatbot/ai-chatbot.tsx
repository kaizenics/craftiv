"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, ChevronDown, Loader2, MessageCircle, Send, X } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const starterMessages = [
  {
    role: "assistant",
    text: "Hi! I'm Crafty, your general-use AI assistant. How can I help today?",
  },
];

export function Chatbot() {
  const { data: session } = authClient.useSession();
  const { data: subscription } = trpc.user.subscription.useQuery(undefined, {
    enabled: !!session?.user,
  });
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState(starterMessages);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPlan = session?.user ? (subscription?.plan ?? "free") : "free";
  const canAccessChatbot = currentPlan === "plus" || currentPlan === "pro";

  const scrollToLatest = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "end" });
  };

  const updateScrollIndicator = () => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    setShowScrollToBottom(distanceFromBottom > 80);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;

    const history = messages.slice(-10).map((message) => ({
      role: message.role as "user" | "assistant",
      content: message.text,
    }));

    setMessages((prev) => [
      ...prev,
      { role: "user", text: trimmed },
      { role: "assistant", text: "" },
    ]);
    setInputValue("");
    setIsStreaming(true);

    try {
      const response = await fetch("/api/chatbot/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          history,
        }),
      });

      if (!response.body) {
        throw new Error("Streaming response is unavailable.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      const setAssistantText = (text: string) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role !== "assistant") return prev;
          next[next.length - 1] = { ...last, text };
          return next;
        });
      };

      const appendAssistantText = (token: string) => {
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const next = [...prev];
          const last = next[next.length - 1];
          if (last?.role !== "assistant") return prev;
          next[next.length - 1] = { ...last, text: `${last.text}${token}` };
          return next;
        });
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const dataLine = eventChunk
            .split("\n")
            .find((line) => line.startsWith("data: "));
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
      const errorMessage = error instanceof Error ? error.message : "I ran into an issue. Please try again in a moment.";
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const next = [...prev];
        const last = next[next.length - 1];
        if (last?.role !== "assistant") return prev;
        next[next.length - 1] = { ...last, text: errorMessage };
        return next;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => scrollToLatest("auto"));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(updateScrollIndicator);
  }, [isOpen, messages.length]);

  if (!canAccessChatbot) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-[90] flex flex-col items-end gap-3">
      {isOpen ? (
        <div className="w-[min(30rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Bot className="h-4 w-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">Crafty</p>
                <p className="text-xs text-zinc-500">General AI Assistant</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Close chatbot"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <div
              ref={messagesContainerRef}
              onScroll={updateScrollIndicator}
              className="h-[26rem] space-y-3 overflow-y-auto p-4"
            >
              {messages.map((message, index) => (
                message.role === "assistant" && !message.text ? null : (
                <div
                  key={`${message.role}-${index}-${message.text}`}
                  className={`w-fit max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                    message.role === "user"
                      ? "ml-auto bg-primary text-white"
                      : "bg-zinc-100 text-zinc-700"
                  }`}
                >
                  {message.text}
                </div>
                )
              ))}
              {isStreaming ? (
                <div className="flex w-fit max-w-[90%] items-center gap-2 rounded-2xl bg-zinc-100 px-3 py-2 text-sm text-zinc-700">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Crafty is thinking...</span>
                </div>
              ) : null}
              <div ref={messagesEndRef} />
            </div>

            {showScrollToBottom ? (
              <Button
                type="button"
                variant="secondary"
                size="icon-sm"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full"
                aria-label="Jump to latest message"
                onClick={() => scrollToLatest("smooth")}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            ) : null}
          </div>

          <form className="flex items-center gap-2 border-t border-zinc-200 p-3" onSubmit={handleSubmit}>
            <Input
              placeholder="Type your prompt..."
              aria-label="Type your prompt"
              value={inputValue}
              disabled={isStreaming}
              onChange={(event) => setInputValue(event.target.value)}
            />
            <Button
              type="submit"
              size="icon"
              aria-label="Send message"
              disabled={isStreaming || !inputValue.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <Button
        type="button"
        size="icon-lg"
        className="h-14 w-14 rounded-full shadow-primary/30"
        onClick={() => setIsOpen((value) => !value)}
        aria-label={isOpen ? "Close chatbot" : "Open chatbot"}
      >
        <MessageCircle className="h-6 w-6" />
      </Button>
    </div>
  );
}
