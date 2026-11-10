import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpRight, Plus, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AdminTitle, Field, inputCls } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { settingsQuery } from "@/lib/store";
import { moveReel, parseReelUrl, readReels } from "@/lib/instagram";

export const Route = createFileRoute("/admin/reels")({
  head: () => ({ meta: [
    { title: "Manage Instagram Reels — ZEON.CO" },
    { name: "description", content: "Manage the selected Instagram reels shown in ZEON.CO's Watch The Fits carousel." },
    { property: "og:title", content: "Manage Instagram Reels — ZEON.CO" },
    { property: "og:description", content: "Owner controls for ZEON.CO's curated reels." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: Reels,
});

function Reels() {
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const qc = useQueryClient();
  const [items, setItems] = useState(() => readReels(settings?.selected_reels));
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const { data, error: saveError } = await supabase.from("store_settings")
        .update({ selected_reels: items.map((item) => ({ ...item })) }).eq("id", 1).select("id").single();
      if (saveError) throw saveError;
      if (!data) throw new Error("Reels could not be saved.");
      await qc.invalidateQueries({ queryKey: ["settings"] });
      toast.success("Reels saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save reels. Please try again.");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-6">
      <AdminTitle actions={<Button onClick={save} disabled={saving}><Save />{saving ? "Saving…" : "Save reels"}</Button>}>Watch The Fits</AdminTitle>
      <form className="flex flex-wrap items-end gap-3" onSubmit={(event) => {
        event.preventDefault();
        const reel = parseReelUrl(url);
        if (!reel) return setError("Enter a valid Instagram reel link.");
        if (items.some((item) => item.id === reel.id)) return setError("This reel is already selected.");
        setItems([...items, reel]); setUrl(""); setError("");
      }}>
        <div className="min-w-0 flex-1 basis-64"><Field label="Instagram reel URL" htmlFor="reel-url"><input id="reel-url" type="url" required value={url} onChange={(e) => { setUrl(e.target.value); setError(""); }} placeholder="https://www.instagram.com/reel/…/" className={inputCls} disabled={saving} /></Field></div>
        <Button type="submit" variant="outline" disabled={saving}><Plus />Add reel</Button>
      </form>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!items.length && <p className="py-10 text-muted-foreground">No reels selected.</p>}
      <ol className="divide-y divide-border border-y border-border">
        {items.map((item, index) => (
          <li key={item.id} className="flex flex-wrap items-center gap-4 py-5">
            <span className="w-6 text-sm text-muted-foreground">{index + 1}</span>
            <div className="min-w-0 flex-1 basis-48">
              <input aria-label={`Reel ${index + 1} title`} value={item.title} placeholder="Reel title (optional)" className={inputCls} disabled={saving} maxLength={150} onChange={(e) => setItems(items.map((reel) => reel.id === item.id ? { ...reel, title: e.target.value } : reel))} />
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="mt-2 flex items-center gap-2 break-all text-sm text-muted-foreground">{item.id}<ArrowUpRight className="h-4 w-4 shrink-0" /></a>
            </div>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" title="Move up" aria-label={`Move reel ${index + 1} up`} disabled={saving || index === 0} onClick={() => setItems(moveReel(items, index, -1))}><ArrowUp /></Button>
              <Button variant="outline" size="icon" title="Move down" aria-label={`Move reel ${index + 1} down`} disabled={saving || index === items.length - 1} onClick={() => setItems(moveReel(items, index, 1))}><ArrowDown /></Button>
              <Button variant="ghost" size="icon" title="Remove reel" aria-label={`Remove reel ${index + 1}`} disabled={saving} onClick={() => setItems(items.filter((reel) => reel.id !== item.id))}><Trash2 /></Button>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}