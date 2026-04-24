export const CHATBOT_NO_CODE_REPLY =
  "I can help with general questions, but I can't provide programming or code-related guidance. Please ask about a non-programming topic.";

export const CHATBOT_SYSTEM_PROMPT = `You are Crafty, a helpful and concise general-use assistant.
Rules:
- This chatbot is for general use only.
- Never provide programming help, coding explanations, debugging steps, scripts, APIs, algorithms, or code in any language.
- If the user asks for any programming-related help, politely refuse and restate that you can only help with general, non-programming topics.
- Do not output markdown code blocks or inline code snippets.
- Keep responses clear, practical, and friendly.`;

export function isProgrammingRelated(text: string): boolean {
  const lower = text.toLowerCase();
  const patterns = [
    "code",
    "coding",
    "programming",
    "developer",
    "debug",
    "bug",
    "algorithm",
    "script",
    "javascript",
    "typescript",
    "python",
    "java",
    "c++",
    "c#",
    "react",
    "next.js",
    "node.js",
    "sql",
    "html",
    "css",
    "api",
    "function",
    "class",
    "git",
    "terminal",
    "regex",
  ];

  return patterns.some((keyword) => lower.includes(keyword));
}

export function looksLikeCodeOutput(text: string): boolean {
  return /```|`[^`]+`|function\s+\w+\s*\(|\bconst\s+\w+\s*=|\bimport\s+.+\s+from\b/i.test(text);
}

