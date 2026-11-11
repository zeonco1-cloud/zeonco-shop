import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const tokenSchema = z.string().min(32).max(200);

async function ctx(token: string) {
  const { admin, sha256 } = await import("@/lib/assistant.server");
  return { db: await admin(), hash: await sha256(token) };
}

export const listThreads = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { db, hash } = await ctx(data.token);
    const { data: rows, error } = await db.from("support_threads").select("id, title, updated_at")
      .eq("visitor_hash", hash).eq("channel", "web").order("updated_at", { ascending: false }).limit(50);
    if (error) throw new Error(error.message);
    return rows;
  });

export const createThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema }).parse(d))
  .handler(async ({ data }) => {
    const { db, hash } = await ctx(data.token);
    const { data: row, error } = await db.from("support_threads").insert({ visitor_hash: hash, channel: "web" }).select("id").single();
    if (error) throw new Error(error.message);
    return row;
  });

export const getThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema, threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db, hash } = await ctx(data.token);
    const { data: t } = await db.from("support_threads").select("id, title").eq("id", data.threadId).eq("visitor_hash", hash).maybeSingle();
    if (!t) return null;
    const { data: msgs, error } = await db.from("support_messages").select("id, role, content, created_at").eq("thread_id", t.id).order("created_at");
    if (error) throw new Error(error.message);
    return { ...t, messages: msgs as { id: string; role: "user" | "assistant"; content: string; created_at: string }[] };
  });

export const deleteThread = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ token: tokenSchema, threadId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { db, hash } = await ctx(data.token);
    const { error } = await db.from("support_threads").delete().eq("id", data.threadId).eq("visitor_hash", hash);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
