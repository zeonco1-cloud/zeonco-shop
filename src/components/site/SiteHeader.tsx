import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, Menu, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { categoriesQuery, settingsQuery } from "@/lib/store";
import { useWishlist } from "@/lib/wishlist";
import { Wordmark } from "./Wordmark";

const navLink = "eyebrow py-2 text-foreground/80 transition-colors hover:text-foreground";

export function SiteHeader() {
  const { data: settings } = useQuery(settingsQuery());
  const { data: categories } = useQuery(categoriesQuery());
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchOpen(false);
    setOpen(false);
    navigate({ to: "/shop", search: { q: q.trim() || undefined } });
  };

  return (
    <>
      {settings?.announcement_enabled && settings.announcement_text && (
        <div className="bg-ink px-4 py-2 text-center text-ink-foreground">
          <p className="eyebrow text-[0.65rem]">{settings.announcement_text}</p>
        </div>
      )}
      <header className={`sticky top-0 z-40 border-b transition-colors ${scrolled ? "border-border bg-background/95 backdrop-blur" : "border-transparent bg-background"}`}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <button className="-ml-2 p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <Wordmark logoUrl={settings?.logo_url} />
          <nav aria-label="Main" className="hidden items-center gap-7 lg:flex">
            <Link to="/shop" className={navLink}>Shop</Link>
            <div className="group relative">
              <button className={navLink} aria-haspopup="true">Categories</button>
              <div className="invisible absolute left-1/2 top-full z-50 w-52 -translate-x-1/2 border border-border bg-card p-2 opacity-0 shadow-lg transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                {categories?.map((c) => (
                  <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="block px-3 py-2 text-sm hover:bg-secondary">
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <Link to="/shop" search={{ sort: "newest", new: true }} className={navLink}>New Arrivals</Link>
            <Link to="/shop" search={{ featured: true }} className={navLink}>Best Sellers</Link>
            <Link to="/shop" search={{ sale: true }} className={`${navLink} text-accent`}>Sale</Link>
          </nav>
          <div className="-mr-2 flex items-center">
            <button className="p-2" aria-label="Search" onClick={() => setSearchOpen((s) => !s)}>
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <Link to="/wishlist" className="relative p-2" aria-label={`Wishlist, ${ids.length} items`}>
              <Heart className="h-5 w-5" />
              {ids.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[0.6rem] font-bold text-accent-foreground">
                  {ids.length}
                </span>
              )}
            </Link>
          </div>
        </div>
        {searchOpen && (
          <form onSubmit={submit} className="border-t border-border bg-background px-4 py-3 md:px-8">
            <label htmlFor="site-search" className="sr-only">Search products</label>
            <input
              id="site-search"
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              maxLength={80}
              placeholder="Search tees, shirts, denim…"
              className="mx-auto block w-full max-w-7xl border-b border-foreground bg-transparent py-2 font-display text-lg outline-none placeholder:text-muted-foreground"
            />
          </form>
        )}
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-[85vw] max-w-sm bg-background p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="border-b border-border p-5">
            <Wordmark logoUrl={settings?.logo_url} />
          </div>
          <nav className="flex flex-col p-5" aria-label="Mobile">
            {[
              { to: "/shop", label: "Shop all", search: {} },
              { to: "/shop", label: "New arrivals", search: { new: true } },
              { to: "/shop", label: "Best sellers", search: { featured: true } },
              { to: "/shop", label: "Sale", search: { sale: true } },
            ].map((l) => (
              <Link key={l.label} to={l.to} search={l.search} onClick={() => setOpen(false)} className="border-b border-border py-4 font-display text-2xl font-black uppercase">
                {l.label}
              </Link>
            ))}
            <p className="eyebrow mt-6 text-muted-foreground">Categories</p>
            {categories?.map((c) => (
              <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} onClick={() => setOpen(false)} className="py-2.5 text-base">
                {c.name}
              </Link>
            ))}
            <div className="mt-6 flex flex-col gap-2 text-sm text-muted-foreground">
              <Link to="/about" onClick={() => setOpen(false)}>About</Link>
              <Link to="/contact" onClick={() => setOpen(false)}>Contact</Link>
              <Link to="/size-guide" onClick={() => setOpen(false)}>Size guide</Link>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
