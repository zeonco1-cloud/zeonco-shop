import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { discountPercent, slugify } from "@/lib/pricing";
import { AdminTitle, Field, Panel, Toggle, btnGhost, btnPrimary, inputCls } from "@/components/admin/ui";
import { ImageList, type ImgItem } from "@/components/admin/ImageUploader";
import { FrontBackImages } from "@/components/admin/FrontBackImages";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/admin/products/$id")({
  head: () => ({ meta: [
    { title: "Product editor — ZEON.CO Admin" },
    { name: "description", content: "Manage ZEON.CO product details, sizes and front and back images." },
    { property: "og:title", content: "Product editor — ZEON.CO Admin" },
    { property: "og:description", content: "Manage ZEON.CO product details, sizes and front and back images." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex, nofollow" },
  ] }), component: Editor,
});

type Color = { name: string; hex: string };
const empty = {
  name: "", slug: "", short_description: "", description: "", fabric: "", category_id: "" as string,
  original_price: "" as string, price: "" as string, sizes: "" as string, colors: [] as Color[],
  stock_status: "in_stock", published: false, hidden_when_oos: false, is_new: true, is_featured: false,
  featured_label: "", on_sale: false, in_rail: false, rail_order: 0,
};

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Slug can use lowercase letters, numbers and dashes"),
  short_description: z.string().max(300),
  description: z.string().max(5000),
  fabric: z.string().max(300),
  price: z.number({ invalid_type_error: "Enter a selling price" }).min(0, "Price can't be negative"),
  original_price: z.number().min(0).nullable(),
  colors: z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9a-fA-F]{6}$/) })).max(20),
  sizes: z.array(z.string().trim().min(1).max(20)).max(30),
  featured_label: z.string().max(40),
}).refine((v) => v.original_price == null || v.price <= v.original_price, { message: "Selling price can't be higher than the original price", path: ["price"] });

function Editor() {
  const { id } = Route.useParams();
  const isNew = id === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState(empty);
  const [images, setImages] = useState<ImgItem[]>([]);
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  const { data: cats } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });
  const { data: existing, isLoading } = useQuery({
    queryKey: ["admin", "product", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*, product_images(*)").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (!existing) return;
    setF({
      name: existing.name, slug: existing.slug, short_description: existing.short_description, description: existing.description,
      fabric: existing.fabric, category_id: existing.category_id ?? "", original_price: existing.original_price?.toString() ?? "",
      price: existing.price.toString(), sizes: existing.sizes.join(", "), colors: (existing.colors as Color[]) ?? [],
      stock_status: existing.stock_status, published: existing.published, hidden_when_oos: existing.hidden_when_oos, is_new: existing.is_new,
      is_featured: existing.is_featured, featured_label: existing.featured_label, on_sale: existing.on_sale, in_rail: existing.in_rail, rail_order: existing.rail_order,
    });
    setImages([...existing.product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => ({ id: i.id, url: i.url, alt: i.alt })));
  }, [existing]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));
  const pct = discountPercent(f.original_price ? Number(f.original_price) : null, f.price ? Number(f.price) : null);

  const save = async () => {
    const parsed = schema.safeParse({
      ...f,
      price: f.price === "" ? NaN : Number(f.price),
      original_price: f.original_price === "" ? null : Number(f.original_price),
      sizes: f.sizes.split(",").map((s) => s.trim()).filter(Boolean),
    });
    if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Check the form");
    const v = parsed.data;
    setSaving(true);
    try {
      const row = {
        name: v.name, slug: v.slug, short_description: v.short_description, description: v.description, fabric: v.fabric,
        category_id: f.category_id || null, price: v.price, original_price: v.original_price, sizes: v.sizes, colors: v.colors,
        stock_status: f.stock_status, published: f.published, hidden_when_oos: f.hidden_when_oos, is_new: f.is_new,
        is_featured: f.is_featured, featured_label: v.featured_label, on_sale: f.on_sale, in_rail: f.in_rail, rail_order: Number(f.rail_order) || 0,
      };
      let pid = id;
      if (isNew) {
        const { data, error } = await supabase.from("products").insert(row).select("id").single();
        if (error) throw error;
        pid = data.id;
      } else {
        const { error } = await supabase.from("products").update(row).eq("id", id);
        if (error) throw error;
      }
      if (images.length) {
        const { error } = await supabase.from("product_images").insert(images.map((im, i) => ({ product_id: pid, url: im.url, alt: im.alt.slice(0, 150), sort_order: i })));
        if (error) throw error;
      }
      const previousIds = existing?.product_images.map((image) => image.id) ?? [];
      if (!isNew && previousIds.length) {
        const { error } = await supabase.from("product_images").delete().in("id", previousIds);
        if (error) throw error;
      }
      await qc.invalidateQueries();
      toast.success("Product saved");
      if (isNew) navigate({ to: "/admin/products/$id", params: { id: pid }, replace: true });
    } catch (e: any) {
      toast.error(e?.code === "23505" ? "That slug is already used by another product." : e?.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return void toast.error(error.message);
    await qc.invalidateQueries();
    toast.success("Product deleted");
    navigate({ to: "/admin/products" });
  };

  if (!isNew && isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!isNew && !existing && !isLoading) return <p>Product not found. <Link to="/admin/products" className="underline">Back</Link></p>;

  return (
    <div className="space-y-6 pb-24">
      <AdminTitle actions={
        <div className="flex gap-2">
          {!isNew && f.published && <a href={`/product/${f.slug}`} target="_blank" className={btnGhost}>Preview</a>}
          <button onClick={save} disabled={saving} className={btnPrimary}>{saving ? "Saving…" : "Save"}</button>
        </div>
      }>{isNew ? "New product" : "Edit product"}</AdminTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Panel title="Details">
            <Field label="Name" htmlFor="name">
              <input id="name" className={inputCls} value={f.name} maxLength={120} onChange={(e) => { set("name", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} />
            </Field>
            <Field label="URL slug" htmlFor="slug" hint={`/product/${f.slug || "…"}`}>
              <input id="slug" className={inputCls} value={f.slug} onChange={(e) => { setSlugTouched(true); set("slug", slugify(e.target.value)); }} />
            </Field>
            <Field label="Short description" htmlFor="sd"><input id="sd" className={inputCls} maxLength={300} value={f.short_description} onChange={(e) => set("short_description", e.target.value)} /></Field>
            <Field label="Full description" htmlFor="desc"><textarea id="desc" rows={5} className={inputCls} maxLength={5000} value={f.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <Field label="Fabric / material" htmlFor="fab"><input id="fab" className={inputCls} maxLength={300} value={f.fabric} onChange={(e) => set("fabric", e.target.value)} /></Field>
          </Panel>
          <Panel title="Images"><FrontBackImages items={images} onChange={setImages} /><ImageList items={images} onChange={setImages} folder="products" /></Panel>
          <Panel title="Variants">
            <Field label="Sizes" htmlFor="sizes" hint="Comma separated, e.g. S, M, L, XL"><input id="sizes" className={inputCls} value={f.sizes} onChange={(e) => set("sizes", e.target.value)} /></Field>
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Colors</p>
              <div className="space-y-2">
                {f.colors.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input type="color" aria-label="Color swatch" value={c.hex} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, hex: e.target.value } : x)))} className="h-10 w-12 border border-input" />
                    <input aria-label="Color name" className={inputCls} value={c.name} maxLength={40} onChange={(e) => set("colors", f.colors.map((x, k) => (k === i ? { ...x, name: e.target.value } : x)))} />
                    <button type="button" aria-label="Remove color" onClick={() => set("colors", f.colors.filter((_, k) => k !== i))} className="p-2 text-destructive"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => set("colors", [...f.colors, { name: "", hex: "#1d1b19" }])} className="mt-2 inline-flex items-center gap-1 text-sm underline"><Plus className="h-4 w-4" /> Add color</button>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Pricing (₹)">
            <Field label="Selling price" htmlFor="price"><input id="price" type="number" min={0} step="1" className={inputCls} value={f.price} onChange={(e) => set("price", e.target.value)} /></Field>
            <Field label="Original price" htmlFor="op" hint="Leave empty when not discounted"><input id="op" type="number" min={0} step="1" className={inputCls} value={f.original_price} onChange={(e) => set("original_price", e.target.value)} /></Field>
            {pct && <p className="text-sm font-semibold text-accent">Shows as −{pct}%</p>}
          </Panel>
          <Panel title="Organisation">
            <Field label="Category" htmlFor="cat">
              <select id="cat" className={inputCls} value={f.category_id} onChange={(e) => set("category_id", e.target.value)}>
                <option value="">None</option>
                {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Availability" htmlFor="stock">
              <select id="stock" className={inputCls} value={f.stock_status} onChange={(e) => set("stock_status", e.target.value)}>
                <option value="in_stock">In stock</option>
                <option value="low_stock">Low stock</option>
                <option value="out_of_stock">Out of stock</option>
              </select>
            </Field>
            <Toggle label="Published (visible on store)" checked={f.published} onChange={(v) => set("published", v)} />
            <Toggle label="Hide when out of stock" checked={f.hidden_when_oos} onChange={(v) => set("hidden_when_oos", v)} />
          </Panel>
          <Panel title="Storefront sections">
            <Toggle label="New arrival" checked={f.is_new} onChange={(v) => set("is_new", v)} />
            <Toggle label="Best seller / featured" checked={f.is_featured} onChange={(v) => set("is_featured", v)} />
            <Toggle label="Show in sale section" checked={f.on_sale} onChange={(v) => set("on_sale", v)} />
            <Toggle label="Hang on the clothing rail" checked={f.in_rail} onChange={(v) => set("in_rail", v)} />
            {f.in_rail && <Field label="Rail position" htmlFor="ro"><input id="ro" type="number" className={inputCls} value={f.rail_order} onChange={(e) => set("rail_order", Number(e.target.value))} /></Field>}
          </Panel>
          {!isNew && (
            <AlertDialog>
              <AlertDialogTrigger className="eyebrow w-full border border-destructive py-3 text-destructive">Delete product</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Delete “{f.name}”?</AlertDialogTitle>
                <AlertDialogDescription>This permanently removes the product and its image list. This can't be undone.</AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={remove}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
}
