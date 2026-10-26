import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { categoriesQuery, productsQuery } from "@/lib/store";
import { discountPercent } from "@/lib/pricing";
import { ProductGrid } from "./ProductCard";
import { EmptyState } from "./PageShell";

export type ShopSearch = {
  q?: string | undefined;
  cat?: string | undefined;
  size?: string | undefined;
  color?: string | undefined;
  min?: number | undefined;
  max?: number | undefined;
  sale?: boolean | undefined;
  new?: boolean | undefined;
  featured?: boolean | undefined;
  sort?: "newest" | "price-asc" | "price-desc" | undefined;
};

export function validateShopSearch(s: Record<string, unknown>): ShopSearch {
  const str = (v: unknown) => (typeof v === "string" && v.length <= 80 ? v : undefined);
  const num = (v: unknown) => (v === undefined || v === "" ? undefined : Number.isFinite(Number(v)) ? Number(v) : undefined);
  const bool = (v: unknown) => (v === true || v === "true" ? true : undefined);
  const sort = ["newest", "price-asc", "price-desc"].includes(String(s["sort"])) ? (s["sort"] as ShopSearch["sort"]) : undefined;
  return { q: str(s["q"]), cat: str(s["cat"]), size: str(s["size"]), color: str(s["color"]), min: num(s["min"]), max: num(s["max"]), sale: bool(s["sale"]), new: bool(s["new"]), featured: bool(s["featured"]), sort };
}

const PAGE = 24;

export function ShopView({ search, fixedCategory }: { search: ShopSearch; fixedCategory?: string }) {
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(PAGE);
  const cat = fixedCategory ?? search.cat;

  const set = (patch: Partial<ShopSearch>) => {
    setLimit(PAGE);
    navigate({ to: ".", search: (prev: ShopSearch) => ({ ...prev, ...patch }), replace: true });
  };

  const pool = useMemo(() => (cat ? products.filter((p) => p.categories?.slug === cat) : products), [products, cat]);
  const allSizes = useMemo(() => [...new Set(pool.flatMap((p) => p.sizes))], [pool]);
  const allColors = useMemo(() => [...new Set(pool.flatMap((p) => p.colors.map((c) => c.name)))], [pool]);

  const results = useMemo(() => {
    const q = search.q?.toLowerCase().trim();
    let r = pool.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (search.size && !p.sizes.includes(search.size)) return false;
      if (search.color && !p.colors.some((c) => c.name === search.color)) return false;
      if (search.min != null && Number(p.price) < search.min) return false;
      if (search.max != null && Number(p.price) > search.max) return false;
      if (search.sale && !discountPercent(p.original_price, p.price)) return false;
      if (search.new && !p.is_new) return false;
      if (search.featured && !p.is_featured) return false;
      return true;
    });
    if (search.sort === "price-asc") r = [...r].sort((a, b) => Number(a.price) - Number(b.price));
    else if (search.sort === "price-desc") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    return r;
  }, [pool, search]);

  const hasFilters = !!(search.q || search.size || search.color || search.min != null || search.max != null || search.sale || search.new || search.featured || (!fixedCategory && search.cat));
  const clear = () => navigate({ to: ".", search: {}, replace: true });

  const chip = (active: boolean) => `border px-3 py-2 text-xs font-semibold transition ${active ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
      <div className="sticky top-16 z-20 -mx-4 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-background/95 px-4 py-3 backdrop-blur md:mx-0 md:px-0">
        <div className="flex items-center gap-3">
          <button onClick={() => setShowFilters((v) => !v)} className="eyebrow flex items-center gap-2" aria-expanded={showFilters}>
            <SlidersHorizontal className="h-4 w-4" /> Filters
          </button>
          <span className="text-xs text-muted-foreground" aria-live="polite">{results.length} {results.length === 1 ? "product" : "products"}</span>
          {hasFilters && <button onClick={clear} className="text-xs underline">Clear all</button>}
        </div>
        <label className="flex items-center gap-2 text-xs">
          <span className="sr-only md:not-sr-only">Sort</span>
          <select value={search.sort ?? "newest"} onChange={(e) => set({ sort: e.target.value as ShopSearch["sort"] })} className="border border-border bg-background px-2 py-2 text-xs">
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      {showFilters && (
        <div className="grid gap-6 border-b border-border py-6 md:grid-cols-4">
          <div className="md:col-span-1">
            <label htmlFor="q" className="eyebrow mb-2 block text-muted-foreground">Search</label>
            <input id="q" defaultValue={search.q} maxLength={80} onKeyDown={(e) => e.key === "Enter" && set({ q: (e.target as HTMLInputElement).value || undefined })} onBlur={(e) => set({ q: e.target.value || undefined })} placeholder="Product name" className="w-full border border-border bg-card px-3 py-2 text-sm" />
          </div>
          {!fixedCategory && (
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Category</p>
              <div className="flex flex-wrap gap-2">
                {cats.map((c) => (
                  <button key={c.id} className={chip(search.cat === c.slug)} onClick={() => set({ cat: search.cat === c.slug ? undefined : c.slug })}>{c.name}</button>
                ))}
              </div>
            </div>
          )}
          {allSizes.length > 0 && (
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Size</p>
              <div className="flex flex-wrap gap-2">
                {allSizes.map((s) => (
                  <button key={s} className={chip(search.size === s)} onClick={() => set({ size: search.size === s ? undefined : s })}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {allColors.length > 0 && (
            <div>
              <p className="eyebrow mb-2 text-muted-foreground">Color</p>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c) => (
                  <button key={c} className={chip(search.color === c)} onClick={() => set({ color: search.color === c ? undefined : c })}>{c}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <p className="eyebrow mb-2 text-muted-foreground">Price (₹)</p>
            <div className="flex items-center gap-2">
              <input type="number" min={0} aria-label="Minimum price" defaultValue={search.min} onBlur={(e) => set({ min: e.target.value ? Number(e.target.value) : undefined })} className="w-24 border border-border bg-card px-2 py-2 text-sm" placeholder="Min" />
              <span>–</span>
              <input type="number" min={0} aria-label="Maximum price" defaultValue={search.max} onBlur={(e) => set({ max: e.target.value ? Number(e.target.value) : undefined })} className="w-24 border border-border bg-card px-2 py-2 text-sm" placeholder="Max" />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button className={chip(!!search.sale)} onClick={() => set({ sale: search.sale ? undefined : true })}>Sale only</button>
            <button className={chip(!!search.new)} onClick={() => set({ new: search.new ? undefined : true })}>New</button>
            <button className={chip(!!search.featured)} onClick={() => set({ featured: search.featured ? undefined : true })}>Best sellers</button>
          </div>
        </div>
      )}

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptyState title={search.q ? `No results for “${search.q}”` : "Nothing here yet"}>
            {hasFilters ? <button onClick={clear} className="underline">Clear filters</button> : "New pieces are on the way."}
          </EmptyState>
        ) : (
          <>
            <ProductGrid products={results.slice(0, limit)} />
            {results.length > limit && (
              <div className="mt-12 text-center">
                <button onClick={() => setLimit((l) => l + PAGE)} className="eyebrow border border-foreground px-8 py-3 hover:bg-foreground hover:text-background">Load more</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
