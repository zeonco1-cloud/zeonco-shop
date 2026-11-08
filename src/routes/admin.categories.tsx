import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/pricing";
import { AdminTitle, Toggle, btnPrimary, inputCls } from "@/components/admin/ui";
import { SingleImage } from "@/components/admin/ImageUploader";

export const Route = createFileRoute("/admin/categories")({ component: Categories });

function Categories() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const { data: cats = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const refresh = () => qc.invalidateQueries();
  const update = async (id: string, patch: { image_url?: string | null; name?: string; visible?: boolean }) => {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  };
  const add = async () => {
    const n = name.trim();
    if (!n || n.length > 60) return void toast.error("Enter a category name (max 60 characters)");
    const { error } = await supabase.from("categories").insert({ name: n, slug: slugify(n), sort_order: cats.length + 1 });
    if (error) return void toast.error(error.code === "23505" ? "A category with that name exists" : error.message);
    setName("");
    refresh();
  };
  const move = async (i: number, d: number) => {
    const a = cats[i], b = cats[i + d];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id),
      supabase.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id),
    ]);
    refresh();
  };
  const remove = async (id: string, n: string) => {
    if (!confirm(`Delete category “${n}”? Products in it will become uncategorised.`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
    refresh();
  };
  return (
    <div>
      <AdminTitle>Categories</AdminTitle>
      <div className="mb-6 flex max-w-md gap-2">
        <input aria-label="New category name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="New category name" />
        <button onClick={add} className={btnPrimary}>Add</button>
      </div>
      <ul className="space-y-3">
        {cats.map((c, i) => (
          <li key={c.id} className="flex flex-col gap-4 border border-border bg-card p-4 md:flex-row md:items-center">
            <SingleImage value={c.image_url} folder="categories" onChange={(url) => update(c.id, { image_url: url })} label="Tile image" />
            <div className="flex-1 space-y-2">
              <input aria-label="Category name" className={inputCls} defaultValue={c.name} maxLength={60} onBlur={(e) => e.target.value.trim() && e.target.value !== c.name && update(c.id, { name: e.target.value.trim() })} />
              <p className="text-xs text-muted-foreground">/category/{c.slug}</p>
              <Toggle label="Visible on store" checked={c.visible} onChange={(v) => update(c.id, { visible: v })} />
            </div>
            <div className="flex gap-1">
              <button aria-label="Move up" onClick={() => move(i, -1)} className="p-2"><ArrowUp className="h-4 w-4" /></button>
              <button aria-label="Move down" onClick={() => move(i, 1)} className="p-2"><ArrowDown className="h-4 w-4" /></button>
              <button aria-label="Delete" onClick={() => remove(c.id, c.name)} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
