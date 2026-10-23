import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import type { Product } from "@/lib/store";
import { mainImage } from "@/lib/store";
import { PriceTag } from "./ProductCard";

export function HangingRail({ products }: { products: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [swaying, setSwaying] = useState<string | null>(null);
  if (!products.length) return null;

  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: "smooth" });
  const activate = (id: string) => {
    setActive(id);
    setSwaying(id);
    window.setTimeout(() => setSwaying((s) => (s === id ? null : s)), 1400);
  };

  return (
    <section aria-labelledby="rail-title" className="relative overflow-hidden bg-rail-wall py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-4 md:px-8">
        <div>
          <p className="eyebrow text-accent">The showroom</p>
          <h2 id="rail-title" className="display-xl mt-2 text-4xl md:text-6xl">On the rail</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Tap a piece to see it up close. Swipe to browse.</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <button onClick={() => scrollBy(-1)} aria-label="Scroll rail left" className="flex h-11 w-11 items-center justify-center border border-foreground transition hover:bg-foreground hover:text-background">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={() => scrollBy(1)} aria-label="Scroll rail right" className="flex h-11 w-11 items-center justify-center border border-foreground transition hover:bg-foreground hover:text-background">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="relative mt-10">
        {/* rail bar */}
        <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-[18px] z-10 h-2.5 rounded-full bg-rail shadow-rail" />
        <div
          ref={scroller}
          className="scrollbar-none relative flex snap-x snap-mandatory gap-2 overflow-x-auto px-[8vw] pb-6 md:gap-6 md:px-16"
          role="list"
        >
          {products.map((p) => {
            const img = mainImage(p);
            const isActive = active === p.id;
            return (
              <div
                key={p.id}
                role="listitem"
                className="relative flex w-[58vw] max-w-[260px] shrink-0 snap-center flex-col items-center md:w-[240px]"
                onMouseEnter={() => activate(p.id)}
                onMouseLeave={() => setActive((a) => (a === p.id ? null : a))}
              >
                <button
                  type="button"
                  onClick={() => activate(p.id)}
                  onFocus={() => setActive(p.id)}
                  aria-expanded={isActive}
                  aria-label={`${p.name} — show details`}
                  className={`relative z-20 block w-full origin-top outline-none transition-transform duration-500 focus-visible:ring-2 focus-visible:ring-ring ${swaying === p.id ? "animate-sway" : ""} ${isActive ? "-translate-y-1" : ""}`}
                >
                  <div className="aspect-[3/4] w-full">
                    {img ? (
                      <img src={img} alt={p.name} loading="lazy" width={300} height={400} className={`h-full w-full object-contain object-top shadow-garment transition duration-500 ${active && !isActive ? "opacity-60" : ""}`} />
                    ) : (
                      <div className="mx-auto mt-10 h-3/4 w-3/4 bg-sand" />
                    )}
                  </div>
                </button>
                <div
                  className={`mt-2 w-full border border-border bg-card p-4 text-center transition-all duration-300 ${isActive ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"}`}
                  aria-hidden={!isActive}
                >
                  <p className="text-sm font-semibold">{p.name}</p>
                  <div className="mt-1 flex justify-center">
                    <PriceTag price={Number(p.price)} original={p.original_price != null ? Number(p.original_price) : null} />
                  </div>
                  <Link
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    tabIndex={isActive ? 0 : -1}
                    className="eyebrow mt-3 inline-block bg-foreground px-4 py-2.5 text-background"
                  >
                    View product
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
