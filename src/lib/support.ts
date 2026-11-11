import { normalizeWhatsApp } from "@/lib/pricing";

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; created_at?: string };
export type ThreadSummary = { id: string; title: string; updated_at: string };

const TOKEN_KEY = "zeon-support-visitor";

/** Browser-only: a private random key that proves which chats belong to this shopper. */
export function getVisitorToken(): string {
  let t = localStorage.getItem(TOKEN_KEY);
  if (!t || t.length < 32) {
    t = crypto.randomUUID() + crypto.randomUUID();
    localStorage.setItem(TOKEN_KEY, t);
  }
  return t;
}

/** Thread title from the first shopper message: trimmed, single line, max 48 chars. */
export function threadTitle(text: string): string {
  const one = text.replace(/\s+/g, " ").trim();
  return one.length > 48 ? one.slice(0, 47).trimEnd() + "…" : one || "New chat";
}

/** Priority-support WhatsApp link with the chat topic prefilled. Null when no number is configured. */
export function prioritySupportUrl(number: string | null | undefined, topic?: string): string | null {
  const n = normalizeWhatsApp(number);
  if (!n) return null;
  const text = topic ? `Hi ZEON.CO, I need priority support: ${topic}` : "Hi ZEON.CO, I need priority support.";
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export const MAX_MESSAGE_CHARS = 1000;
