import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MAX_MESSAGE_CHARS, threadTitle } from "@/lib/support";

const Body = z.object({
  token: z.string().min(32).max(200),
  threadId: z.string().uuid(),
  text: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
});

// Public endpoint: the caller must prove thread ownership with their private visitor key.
export const Route = createFileRoute("/api/public/support/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return Response.json({ error: "Invalid message" }, { status: 400 });
        const { admin, sha256, streamAssistant } = await import("@/lib/assistant.server");
        const db = await admin();
        const hash = await sha256(parsed.data.token);
        const { data: thread } = await db.from("support_threads").select("id, title").eq("id", parsed.data.threadId).eq("visitor_hash", hash).maybeSingle();
        if (!thread) return Response.json({ error: "Chat not found" }, { status: 404 });

        const { data: prior, error: histErr } = await db.from("support_messages").select("role, content").eq("thread_id", thread.id).order("created_at").limit(60);
        if (histErr) return Response.json({ error: "Could not load chat" }, { status: 500 });
        const { error: insErr } = await db.from("support_messages").insert({ thread_id: thread.id, role: "user", content: parsed.data.text });
        if (insErr) return Response.json({ error: "Could not save message" }, { status: 500 });
        await db.from("support_threads").update({
          updated_at: new Date().toISOString(),
          ...(thread.title === "New chat" ? { title: threadTitle(parsed.data.text) } : {}),
        }).eq("id", thread.id);

        const history = [...((prior ?? []) as { role: "user" | "assistant"; content: string }[]), { role: "user" as const, content: parsed.data.text }];
        let stream;
        try {
          stream = await streamAssistant(history, "web");
        } catch (e) {
          console.error("assistant start failed", e);
          return Response.json({ error: "The assistant is unavailable right now. Please try WhatsApp support." }, { status: 502 });
        }
        const enc = new TextEncoder();
        const body = new ReadableStream({
          async start(controller) {
            let full = "";
            try {
              for await (const ev of stream as AsyncIterable<any>) {
                if (ev?.type === "response.output_text.delta" && typeof ev.delta === "string") {
                  full += ev.delta;
                  controller.enqueue(enc.encode(ev.delta));
                }
              }
              if (full) {
                const { error } = await db.from("support_messages").insert({ thread_id: thread.id, role: "assistant", content: full });
                if (error) console.error("save assistant failed", error);
              }
            } catch (e) {
              console.error("assistant stream failed", e);
              controller.enqueue(enc.encode("\n\n_Sorry, something went wrong. Please try again or use WhatsApp priority support._"));
            }
            controller.close();
          },
        });
        return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
      },
    },
  },
});
