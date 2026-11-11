import { generateResponse, streamResponse } from "@lovable.dev/ai-gateway";

export const ASSISTANT_MODEL = "openai/gpt-6-astra" as const;

export async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Builds the assistant's instructions from live store data so answers match the catalogue. */
export async function buildInstructions(channel: "web" | "whatsapp"): Promise<string> {
  const db = await admin();
  const [{ data: s }, { data: products }, { data: cats }] = await Promise.all([
    db.from("store_settings").select("*").eq("id", 1).maybeSingle(),
    db.from("products").select("name, slug, price, original_price, sizes, stock_status, on_sale, categories(name)").eq("published", true).limit(200),
    db.from("categories").select("name, slug").eq("visible", true),
  ]);
  const cur = s?.currency || "INR";
  const catalogue = (products ?? [])
    .map((p: any) => `- ${p.name} (${p.categories?.name ?? "—"}): ${cur} ${p.price}${p.on_sale && p.original_price ? ` (was ${p.original_price})` : ""}; sizes ${(p.sizes ?? []).join("/") || "n/a"}; ${p.stock_status ?? ""}; /product/${p.slug}`)
    .join("\n");
  return [
    `You are the friendly customer assistant for ${s?.store_name || "ZEON.CO"}, a premium streetwear store. Tagline: ${s?.tagline ?? ""}.`,
    channel === "whatsapp" ? "You are replying on WhatsApp: keep answers short, plain text, no markdown tables." : "Reply in concise markdown. Link products as relative paths like /product/slug.",
    "Only answer using the store facts below. Never invent prices, stock, order status, discounts or policies. Orders are placed by enquiring on WhatsApp; you cannot see orders or take payments.",
    `If a question needs a human (order problems, returns, payments, anything you can't answer), say so and tell the customer to use priority WhatsApp support${s?.whatsapp_number ? ` at +${s.whatsapp_number.replace(/\D/g, "")}` : ""}.`,
    "Reply in the customer's language.",
    `About: ${s?.about_text ?? ""}`,
    `Delivery: ${s?.delivery_info ?? ""}`,
    `Contact: email ${s?.contact_email ?? ""}, phone ${s?.contact_phone ?? ""}, address ${s?.contact_address ?? ""}`,
    `Categories: ${(cats ?? []).map((c) => c.name).join(", ")}`,
    `Size guide is at /size-guide. Catalogue:\n${catalogue}`,
  ].join("\n");
}

type Turn = { role: "user" | "assistant"; content: string };

const toInput = (history: Turn[]) =>
  history.map((m) => ({ role: m.role, content: m.content }));

export async function streamAssistant(history: Turn[], channel: "web" | "whatsapp") {
  return streamResponse({ model: ASSISTANT_MODEL, instructions: await buildInstructions(channel), input: toInput(history) as any });
}

export async function replyOnce(history: Turn[]): Promise<string> {
  const res: any = await generateResponse({ model: ASSISTANT_MODEL, instructions: await buildInstructions("whatsapp"), input: toInput(history) as any });
  if (typeof res.output_text === "string" && res.output_text) return res.output_text;
  const parts = (res.output ?? []).flatMap((o: any) => o.content ?? []).filter((c: any) => c.type === "output_text");
  return parts.map((c: any) => c.text).join("") || "Sorry, I couldn't answer that. Please message us for priority support.";
}
