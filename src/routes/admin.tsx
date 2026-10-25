import { createFileRoute, Link, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Image, LayoutDashboard, LogOut, Package, Settings, Tags } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { checkOwner } from "@/lib/admin";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({ meta: [{ title: "Dashboard — ZEON.CO" }, { name: "robots", content: "noindex, nofollow" }] }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/admin/login" });
    if (!(await checkOwner())) throw redirect({ to: "/admin/login" });
    return { email: data.user.email };
  },
  component: AdminLayout,
});

const links = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/categories", label: "Categories", icon: Tags },
  { to: "/admin/gallery", label: "Gallery", icon: Image },
  { to: "/admin/settings", label: "Settings", icon: Settings },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/admin/login", replace: true });
  };
  return (
    <div className="min-h-screen bg-secondary/40 md:flex">
      <aside className="border-b border-border bg-card md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between p-4 md:p-6">
          <p className="font-display text-lg font-black tracking-[0.18em]">ZEON<span className="text-accent">.</span>CO</p>
          <button onClick={signOut} className="md:hidden" aria-label="Sign out"><LogOut className="h-5 w-5" /></button>
        </div>
        <nav className="scrollbar-none flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:px-3">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeOptions={{ exact: "exact" in l }}
              className="flex shrink-0 items-center gap-2 rounded-sm px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              <l.icon className="h-4 w-4" /> {l.label}
            </Link>
          ))}
          <a href="/" target="_blank" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground"><ExternalLink className="h-4 w-4" /> View store</a>
        </nav>
        <button onClick={signOut} className="absolute bottom-6 left-6 hidden items-center gap-2 text-sm text-muted-foreground md:flex"><LogOut className="h-4 w-4" /> Sign out</button>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-10">
        <Outlet />
      </main>
    </div>
  );
}
