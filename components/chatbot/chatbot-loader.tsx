"use client";

import dynamic from "next/dynamic";

const Chatbot = dynamic(
  () => import("@/components/chatbot/ai-chatbot").then((mod) => mod.Chatbot),
  { ssr: false },
);

export function ChatbotLoader() {
  return <Chatbot />;
}
