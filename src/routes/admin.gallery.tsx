import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AdminTitle, btnPrimary } from "@/components/admin/ui";
import { ImageList, type ImgItem } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/gallery")({ component: Gallery });

function Gallery() {
  const qc = useQueryClient();
  const [items, setItems] = useState<ImgItem[]>([]);
  const [saving, setSaving] = useState(false);
  const { data } = useQuery({
    queryKey: ["admin", "gallery"],
    queryFn: async () => (await supabase.from("gallery_images").select("*").order("sort_order")).data ?? [],
  });
  useEffect(() => { if (data) setItems(data.map((g) => ({ id: g.id, url: g.url, alt: g.alt }))); }, [data]);

  const save = async () => {
    setSaving(true);
    const { error: dErr } = await supabase.from("gallery_images").delete().not("id", "is", null);
    const { error } = dErr ? { error: dErr } : items.length
      ? await supabase.from("gallery_images").insert(items.map((it, i) => ({ url: it.url, alt: it.alt.slice(0, 150), sort_order: i })))
      : { error: null };
    setSaving(false);
    if (error) return void toast.error(error.message);
    toast.success("Gallery saved");
    qc.invalidateQueries();
  };

  return (
    <div className="space-y-6">
      <AdminTitle actions={<button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save gallery"}</button>}>Fashion gallery</AdminTitle>
      <p className="text-sm text-muted-foreground">The first six images appear on the homepage. Use your own photos — don't present them as customer posts unless they are.</p>
      <div className="border border-border bg-card p-5"><ImageList items={items} onChange={setItems} folder="gallery" /></div>
    </div>
  );
}
