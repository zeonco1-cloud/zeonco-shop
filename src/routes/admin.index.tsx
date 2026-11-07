import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeWhatsApp } from "@/lib/pricing";
import { AdminTitle, btnPrimary } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/")({ head: () => ({ meta: [ { title: "Overview — ZEON.CO Admin" }, { name: "description", content: "View the ZEON.CO store overview." }, { property: "og:title", content: "Overview — ZEON.CO Admin" }, { property: "og:description", content: "View the ZEON.CO store overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex, nofollow" } ] }), component: Overview });

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin", "overview"],
    queryFn: async () => {
      const [{ data: products }, { data: settings }] = await Promise.all([
        supabase.from("products").select("id,published,stock_status,on_sale,is_demo"),
        supabase.from("store_settings").select("whatsapp_number").eq("id", 1).maybeSingle(),
      ]);
      return { products: products ?? [], settings };
    },
  });
  const ps = data?.products ?? [];
  const stats = [
    ["Products", ps.length],
    ["Published", ps.filter((p) => p.published).length],
    ["Out of stock", ps.filter((p) => p.stock_status === "out_of_stock").length],
    ["On sale", ps.filter((p) => p.on_sale).length],
  ];
  const waMissing = data && !normalizeWhatsApp(data.settings?.whatsapp_number);
  const demo = ps.filter((p) => p.is_demo).length;

  return (
    <div className="space-y-6">
      <AdminTitle actions={<Link to="/admin/products/$id" params={{ id: "new" }} className={btnPrimary}>Add product</Link>}>Overview</AdminTitle>
      {waMissing && (
        <div className="flex gap-3 border border-accent bg-card p-4 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-accent" />
          <p>Your WhatsApp number isn't set yet, so customers can't send enquiries. <Link to="/admin/settings" className="font-semibold underline">Add it in Settings</Link>.</p>
        </div>
      )}
      {demo > 0 && (
        <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
          {demo} demonstration product{demo > 1 ? "s are" : " is"} live with sample images. Edit or delete them in Products once your real inventory is ready.
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map(([k, v]) => (
          <div key={k} className="border border-border bg-card p-5">
            <p className="eyebrow text-muted-foreground">{k}</p>
            <p className="mt-2 font-display text-4xl font-black">{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
