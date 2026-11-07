import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsApp } from "@/lib/pricing";
import type { Settings, SizeGuide } from "@/lib/store";
import { AdminTitle, Field, Panel, Toggle, btnPrimary, inputCls } from "@/components/admin/ui";
import { SingleImage } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/settings")({ head: () => ({ meta: [ { title: "Store settings — ZEON.CO Admin" }, { name: "description", content: "Manage ZEON.CO store and contact settings." }, { property: "og:title", content: "Store settings — ZEON.CO Admin" }, { property: "og:description", content: "Manage ZEON.CO store and contact settings." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" } ] }), component: SettingsPage });

const urlOk = (u: string) => !u || /^https:\/\/[^\s]+$/.test(u);

function SettingsPage() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: async () => (await supabase.from("store_settings").select("*").eq("id", 1).single()).data,
  });
  const [s, setS] = useState<Settings | null>(null);
  const [guideText, setGuideText] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (data) { setS(data); setGuideText(JSON.stringify(data.size_guide, null, 2)); }
  }, [data]);
  if (!s) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const set = <K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => (p ? { ...p, [k]: v } : p));
  const text = (k: keyof Settings, label: string, opts: { area?: boolean; max?: number; hint?: string } = {}) => (
    <Field label={label} htmlFor={k} hint={opts.hint}>
      {opts.area ? (
        <textarea id={k} rows={5} maxLength={opts.max ?? 5000} className={inputCls} value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} />
      ) : (
        <input id={k} maxLength={opts.max ?? 200} className={inputCls} value={(s[k] as string) ?? ""} onChange={(e) => set(k, e.target.value as never)} />
      )}
    </Field>
  );

  const save = async () => {
    const wa = s.whatsapp_number.trim();
    if (wa && !normalizeWhatsApp(wa)) return void toast.error("WhatsApp number must include the country code, e.g. +91 98765 43210");
    for (const k of ["instagram_url", "facebook_url", "youtube_url", "x_url"] as const) if (!urlOk(s[k])) return void toast.error("Social links must start with https://");
    if (!s.hero_cta_link.startsWith("/") && !urlOk(s.hero_cta_link)) return void toast.error("Hero button link must be a page like /shop or an https:// link");
    let guide: SizeGuide;
    try {
      guide = JSON.parse(guideText || "{}");
      if (typeof guide !== "object" || Array.isArray(guide)) throw new Error();
    } catch {
      return void toast.error("Size guide isn't valid — check the format");
    }
    setSaving(true);
    const { id, updated_at, ...rest } = s;
    const { error } = await supabase.from("store_settings").update({ ...rest, whatsapp_number: wa ? `+${normalizeWhatsApp(wa)}` : "", size_guide: guide as never }).eq("id", 1);
    setSaving(false);
    if (error) return void toast.error(error.message);
    toast.success("Settings saved");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-6 pb-24">
      <AdminTitle actions={<button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save settings"}</button>}>Settings</AdminTitle>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="WhatsApp & contact">
          {text("whatsapp_number", "WhatsApp number", { max: 25, hint: "Include country code, e.g. +91 98765 43210. Required for product enquiries." })}
          {text("contact_email", "Contact email")}
          {text("contact_phone", "Contact phone")}
          {text("contact_address", "Address", { area: true, max: 500 })}
        </Panel>
        <Panel title="Brand">
          {text("store_name", "Store name", { max: 60 })}
          {text("tagline", "Tagline", { max: 120 })}
          <Field label="Logo"><SingleImage value={s.logo_url} folder="brand" onChange={(u) => set("logo_url", u)} label="Upload logo" /></Field>
          {text("currency", "Currency", { max: 3 })}
        </Panel>
        <Panel title="Homepage hero">
          {text("hero_headline", "Headline", { max: 80 })}
          {text("hero_subtext", "Supporting text", { area: true, max: 300 })}
          {text("hero_cta_text", "Button text", { max: 40 })}
          {text("hero_cta_link", "Button link", { hint: "e.g. /shop or /category/t-shirts" })}
          <Field label="Hero image"><SingleImage value={s.hero_image_url} folder="hero" onChange={(u) => set("hero_image_url", u)} /></Field>
        </Panel>
        <Panel title="Announcement & sections">
          {text("announcement_text", "Announcement bar text", { max: 140 })}
          <Toggle label="Show announcement bar" checked={s.announcement_enabled} onChange={(v) => set("announcement_enabled", v)} />
          <Toggle label="Show New Arrivals" checked={s.show_new_arrivals} onChange={(v) => set("show_new_arrivals", v)} />
          <Toggle label="Show clothing rail" checked={s.show_rail} onChange={(v) => set("show_rail", v)} />
          <Toggle label="Show Best Sellers" checked={s.show_best_sellers} onChange={(v) => set("show_best_sellers", v)} />
          <Toggle label="Show Sale section" checked={s.show_sale} onChange={(v) => set("show_sale", v)} />
          <Toggle label="Show fashion gallery" checked={s.show_gallery} onChange={(v) => set("show_gallery", v)} />
        </Panel>
        <Panel title="Social links">
          {text("instagram_url", "Instagram URL")}
          {text("facebook_url", "Facebook URL")}
          {text("youtube_url", "YouTube URL")}
          {text("x_url", "X URL")}
        </Panel>
        <Panel title="Delivery">
          {text("delivery_info", "Delivery & shipping information", { area: true, max: 1500, hint: "Shown on product pages. Only include charges, thresholds and coverage you actually offer." })}
        </Panel>
        <Panel title="SEO">
          {text("seo_title", "Default title", { max: 70 })}
          {text("seo_description", "Default description", { area: true, max: 160 })}
        </Panel>
        <Panel title="Pages">
          {text("about_text", "About page", { area: true })}
          {text("privacy_text", "Privacy policy", { area: true, max: 20000 })}
          {text("terms_text", "Terms & conditions", { area: true, max: 20000 })}
        </Panel>
      </div>
      <Panel title="Size guide">
        <p className="text-xs text-muted-foreground">Each table has a label, unit (cm or in), column headings and rows. The starting values are examples — replace them with your real measurements.</p>
        <textarea aria-label="Size guide data" rows={14} className={`${inputCls} font-mono text-xs`} value={guideText} onChange={(e) => setGuideText(e.target.value)} />
      </Panel>
    </div>
  );
}
