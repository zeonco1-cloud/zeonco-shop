import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { getThread } from "@/lib/support.functions";
import { getVisitorToken, MAX_MESSAGE_CHARS, prioritySupportUrl, type ChatMessage } from "@/lib/support";
import { settingsQuery } from "@/lib/store";
import { AssistantMark } from "@/components/support/AssistantMark";
import { threadsKey } from "./support";

export const Route = createFileRoute("/support/$threadId")({ component: ThreadPage });

const SUGGESTIONS = ["What sizes do your jeans come in?", "How long does delivery take?", "What's on sale right now?"];

function ThreadPage() {
  const { threadId } = Route.useParams();
  return <ChatWindow key={threadId} threadId={threadId} />;
}

function ChatWindow({ threadId }: { threadId: string }) {
  const qc = useQueryClient();
  const { data: settings } = useQuery(settingsQuery());
  const { data: thread, isLoading } = useQuery({
    queryKey: ["support-thread", threadId],
    queryFn: () => getThread({ data: { token: getVisitorToken(), threadId } }),
    staleTime: Infinity,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"ready" | "submitted" | "streaming">("ready");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (thread) setMessages(thread.messages); }, [thread]);
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [messages, status]);
  useEffect(() => { if (status === "ready") inputRef.current?.focus(); }, [status, isLoading]);

  const send = async (raw: string) => {
    const content = raw.trim().slice(0, MAX_MESSAGE_CHARS);
    if (!content || status !== "ready") return;
    setError("");
    setText("");
    const aId = crypto.randomUUID();
    setMessages((m) => [...m, { id: crypto.randomUUID(), role: "user", content }]);
    setStatus("submitted");
    try {
      const res = await fetch("/api/public/support/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: getVisitorToken(), threadId, text: content }),
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong.");
      }
      setMessages((m) => [...m, { id: aId, role: "assistant", content: "" }]);
      setStatus("streaming");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value, { stream: true });
        setMessages((m) => m.map((x) => (x.id === aId ? { ...x, content: x.content + chunk } : x)));
      }
      qc.invalidateQueries({ queryKey: threadsKey });
      qc.removeQueries({ queryKey: ["support-thread", threadId] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setText(content);
    } finally {
      setStatus("ready");
    }
  };

  if (!isLoading && thread === null) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted-foreground">This chat isn't available on this device.</p>
        <Link to="/support" className="eyebrow mt-4 inline-block border-b border-foreground">Back to chats</Link>
      </div>
    );
  }

  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content;
  const wa = prioritySupportUrl(settings?.whatsapp_number, lastUser);

  return (
    <div className="flex h-[calc(100svh-10rem)] min-h-[480px] flex-col md:h-[75vh]">
      <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <AssistantMark className="h-9 w-9 text-sm" />
          <div>
            <p className="font-display text-sm font-black uppercase">ZEON Assistant</p>
            <p className="text-xs text-muted-foreground">Instant answers · AI can make mistakes</p>
          </div>
        </div>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="eyebrow flex items-center gap-1.5 bg-accent px-3 py-2 text-[0.65rem] text-accent-foreground">
            <MessageCircle className="h-3.5 w-3.5" /> Priority
          </a>
        )}
      </header>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-6" aria-live="polite">
        {messages.length === 0 && !isLoading && (
          <div className="space-y-3">
            <p className="text-muted-foreground">Hi! I can help with products, sizing and delivery. Try:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-border px-3 py-1.5 text-sm hover:bg-secondary">{s}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-foreground px-4 py-2.5 text-sm text-background">{m.content}</p>
            </div>
          ) : (
            <div key={m.id} className="flex gap-3">
              <AssistantMark className="mt-0.5 h-7 w-7 text-[0.65rem]" />
              <div className="prose prose-sm min-w-0 max-w-[85%] text-sm text-foreground [&_a]:text-accent [&_a]:underline [&_li]:my-0.5 [&_p]:my-1.5 [&_ul]:list-disc [&_ul]:pl-5">
                <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
              </div>
            </div>
          ),
        )}
        {status === "submitted" && (
          <div className="flex items-center gap-3" aria-label="Assistant is typing">
            <AssistantMark className="h-7 w-7 text-[0.65rem]" />
            <span className="flex gap-1">
              {[0, 150, 300].map((d) => <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground" style={{ animationDelay: `${d}ms` }} />)}
            </span>
          </div>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={endRef} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="border-t border-border p-3">
        <div className="flex items-end gap-2 border border-border bg-background p-2 focus-within:border-foreground">
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <textarea
            id="chat-input"
            ref={inputRef}
            value={text}
            rows={1}
            maxLength={MAX_MESSAGE_CHARS}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(text); } }}
            placeholder="Ask about sizes, delivery, products…"
            className="max-h-32 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2 text-base outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" disabled={status !== "ready" || !text.trim()} aria-label="Send" className="flex h-10 w-10 shrink-0 items-center justify-center bg-foreground text-background disabled:opacity-40">
            <ArrowUp className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
