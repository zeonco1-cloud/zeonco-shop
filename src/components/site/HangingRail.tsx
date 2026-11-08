import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState, type CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/store";
import { railSizes, railViews } from "@/lib/clothing-rail";
import { PriceTag } from "./ProductCard";

export { railSizes, railViews } from "@/lib/clothing-rail";

function Hanger() {
  return <svg aria-hidden="true" viewBox="0 0 180 70" className="rail-hanger">
    <path className="rail-hook" d="M90 25V17c0-5 9-6 9-12a9 9 0 0 0-18 0" />
    <path className="rail-wood" d="M90 24 18 54Q12 59 20 62H160Q168 59 162 54L90 24Z" />
    <path className="rail-hook" d="m33 54 57-23 57 23" />
  </svg>;
}

export function HangingRail({ products }: { products: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const selected = products.find((p) => p.id === active);
  const views = selected ? railViews(selected) : { front: undefined, back: undefined };
  const sizes = selected ? railSizes(selected) : [];
  const scrollBy = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: "smooth" });
  const activate = (id: string, item: HTMLButtonElement) => {
    if (id === selected?.id) return;
    setActive(id);
    setShowBack(false);
    setSelectedSize(null);
    const container = scroller.current;
    if (container) {
      const bounds = item.getBoundingClientRect();
      const frame = container.getBoundingClientRect();
      setOffset(frame.left + frame.width / 2 - bounds.left - bounds.width / 2);
    }
  };

  return (
    <section aria-labelledby="rail-title" className="relative overflow-hidden bg-rail-wall py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-4 md:px-8">
        <div>
          <p className="eyebrow text-accent">The showroom</p>
          <h2 id="rail-title" className="display-xl mt-2 text-4xl md:text-6xl">On the rail</h2>
          <p className="eyebrow mt-3 text-muted-foreground">Shirts / T-shirts</p>
        </div>
        <div className="hidden gap-2 md:flex">
          <Button variant="outline" size="icon" onClick={() => scrollBy(-1)} aria-label="Scroll rail left" className="h-11 w-11 rounded-none border-foreground bg-transparent hover:bg-foreground hover:text-background">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => scrollBy(1)} aria-label="Scroll rail right" className="h-11 w-11 rounded-none border-foreground bg-transparent hover:bg-foreground hover:text-background">
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className={`rail-stage mt-10 ${selected ? "rail-has-selection" : ""}`}>
        <div aria-hidden className="rail-bar"><span /><span /></div>
        <div
          ref={scroller}
          className="rail-track scrollbar-none"
          role="list"
          onScroll={() => { if (active) { setActive(null); setShowBack(false); setSelectedSize(null); } }}
        >
          {products.map((p, index) => {
            const images = railViews(p);
            const isActive = selected?.id === p.id;
            return (
              <div
                key={p.id}
                role="listitem"
                className={`rail-slot ${isActive ? "z-20" : "z-0"}`}
                style={{ "--rail-entry-delay": `${index * 85}ms` } as CSSProperties}
              >
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(event) => activate(p.id, event.currentTarget)}
                  aria-pressed={isActive}
                  aria-label={`${p.name} — select clothing`}
                  style={{ "--rail-offset": `${isActive ? offset : 0}px` } as CSSProperties}
                  className={`rail-garment rounded-none p-0 hover:bg-transparent ${isActive ? "rail-selected" : ""}`}
                >
                  {!p.is_demo && <Hanger />}
                  <div className={`rail-shirt ${p.is_demo ? "rail-shirt-demo" : ""} ${isActive && showBack && images.back ? "rail-shirt-back" : ""}`}>
                    {images.front ? (
                      <>
                        <img src={images.front} alt={`${p.name} — front`} loading="lazy" width={300} height={400} className="rail-view rail-view-front absolute inset-0 h-full w-full object-contain object-top shadow-garment" />
                        {images.back && <img src={images.back} alt={`${p.name} — back`} loading="lazy" width={300} height={400} className="rail-view rail-view-back absolute inset-0 h-full w-full object-contain object-top shadow-garment" />}
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs text-muted-foreground">Image unavailable</div>
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
        {!products.length && <p className="absolute inset-x-0 top-32 text-center text-sm text-muted-foreground">No pieces on the rail yet.</p>}
      </div>
      <div className="mx-auto min-h-[240px] max-w-lg px-4 text-center">
        {selected && <>
        <Button variant="ghost" size="icon" className="mb-3" aria-label="Return clothing to rail" onClick={() => { setActive(null); setShowBack(false); setSelectedSize(null); }}><X className="h-4 w-4" /></Button>
        <div className="mb-4 inline-flex border border-border" role="group" aria-label="Clothing view">
          <Button variant={showBack ? "ghost" : "default"} className="min-w-20 rounded-none" aria-pressed={!showBack} onClick={() => setShowBack(false)}>Front</Button>
          <Button variant={showBack ? "default" : "ghost"} className="min-w-20 rounded-none" aria-pressed={showBack} disabled={!views.back} title={views.back ? "Show backside" : "Back photo unavailable"} onClick={() => setShowBack(true)}>Back</Button>
        </div>
        {!views.back && <p className="mb-3 text-xs text-muted-foreground">Back photo unavailable</p>}
        <div key={selected.id} className="rail-details">
          <h3 className="break-words text-base font-semibold">{selected.name}</h3>
          {selected.is_demo && <p className="mt-1 text-xs text-muted-foreground">Demo product</p>}
          <div className="mt-2 flex justify-center"><PriceTag price={Number(selected.price)} original={selected.original_price != null ? Number(selected.original_price) : null} /></div>
          {sizes.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Available sizes">
            {sizes.map((size) => <Button key={size} variant={selectedSize === size ? "default" : "outline"} aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)} className="min-w-11 max-w-full whitespace-normal break-words rounded-none bg-transparent px-3 aria-pressed:bg-primary">{size}</Button>)}
          </div>}
          <Button asChild className="mt-5 rounded-none"><Link to="/product/$slug" params={{ slug: selected.slug }}>View product <ChevronRight /></Link></Button>
        </div>
        </>}
      </div>
    </section>
  );
}
