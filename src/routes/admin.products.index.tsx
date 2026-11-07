import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatINR } from "@/lib/pricing";
import { stockLabel } from "@/lib/store";
import { AdminTitle, btnPrimary, inputCls } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/products/")({ head: () => ({ meta: [ { title: "Products — ZEON.CO Admin" }, { name: "description", content: "Manage ZEON.CO products and inventory." }, { property: "og:title", content: "Products — ZEON.CO Admin" }, { property: "og:description", content: "Manage ZEON.CO products and inventory." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" } ] }), component: Products });

function Products() {
  const [q, setQ] = useState("");
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,slug,price,published,stock_status,is_demo,categories(name),product_images(url,sort_order)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const list = (data ?? []).filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      <AdminTitle actions={<Link to="/admin/products/$id" params={{ id: "new" }} className={btnPrimary}>Add product</Link>}>Products</AdminTitle>
      <input aria-label="Search products" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className={`${inputCls} mb-4 max-w-sm`} />
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {error && <p className="text-sm text-destructive">Couldn't load products.</p>}
      {data && list.length === 0 && <p className="text-sm text-muted-foreground">No products yet.</p>}
      <ul className="divide-y divide-border border border-border bg-card">
        {list.map((p) => {
          const img = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url;
          return (
            <li key={p.id}>
              <Link to="/admin/products/$id" params={{ id: p.id }} className="flex items-center gap-4 p-3 hover:bg-secondary/50">
                <div className="h-14 w-12 shrink-0 bg-secondary">{img && <img src={img} alt="" className="h-full w-full object-contain" />}</div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name} {p.is_demo && <span className="eyebrow ml-1 text-[0.55rem] text-accent">Demo</span>}</p>
                  <p className="text-xs text-muted-foreground">{p.categories?.name ?? "No category"} · {stockLabel(p.stock_status)}</p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{formatINR(Number(p.price))}</p>
                  <p className={`text-xs ${p.published ? "text-success" : "text-muted-foreground"}`}>{p.published ? "Published" : "Draft"}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
