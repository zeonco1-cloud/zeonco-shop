import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/store";
import { mainImage } from "@/lib/store";
import { PriceTag } from "./ProductCard";

export function railViews(product: Pick<Product, "product_images">) {
  const back = product.product_images.find((image) => /\b(back(?:side)?|rear)\b/i.test(image.alt));
  const front = product.product_images.find((image) => image !== back)?.url ?? mainImage(product);
  return { front, back: back?.url };
}

export function railSizes(product: Pick<Product, "sizes">) {
  return [...new Set(product.sizes.map((size) => size.trim()).filter(Boolean))];
}

export function HangingRail({ products }: { products: Product[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [showBack, setShowBack] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [swayCycle, setSwayCycle] = useState(0);
  if (!products.length) return null;

  const selected = products.find((p) => p.id === active) ?? products[0];
  if (!selected) return null;
  const views = railViews(selected);
  const sizes = railSizes(selected);
  const scrollBy = (dir: number) => {
    setSwayCycle((cycle) => cycle + 1);
    scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.7, behavior: "smooth" });
  };
  const activate = (id: string, item: HTMLButtonElement) => {
    if (id === selected.id) return;
    setActive(id);
    setSwayCycle((cycle) => cycle + 1);
    setShowBack(false);
    setSelectedSize(null);
    const container = scroller.current;
    const slot = item.parentElement;
    if (container && slot && window.matchMedia("(max-width: 767px)").matches) {
      container.scrollTo({ left: slot.offsetLeft - (container.clientWidth - slot.clientWidth) / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    }
  };

  return (
    <section aria-labelledby="rail-title" className="relative overflow-hidden bg-rail-wall py-16 md:py-24">
      <div className="mx-auto flex max-w-7xl items-end justify-between px-4 md:px-8">
        <div>
          <p className="eyebrow text-accent">The showroom</p>
          <h2 id="rail-title" className="display-xl mt-2 text-4xl md:text-6xl">On the rail</h2>
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

      <div className="relative mt-10">
        {/* rail bar */}
        <div aria-hidden className="rail-chrome pointer-events-none absolute left-0 right-0 top-[48px] h-2.5 rounded-full shadow-rail" />
        <div
          ref={scroller}
          className="scrollbar-none relative flex snap-x snap-mandatory gap-2 overflow-x-auto px-12 pb-24 pt-[48px] md:gap-6 md:px-20"
          onTouchStart={() => setSwayCycle((cycle) => cycle + 1)}
          onWheel={() => setSwayCycle((cycle) => cycle + 1)}
          role="list"
        >
          {products.map((p) => {
            const images = railViews(p);
            const isActive = selected.id === p.id;
            return (
              <div
                key={p.id}
                role="listitem"
                className={`relative flex w-[54vw] max-w-[240px] shrink-0 snap-center flex-col items-center md:w-[240px] ${isActive ? "z-20" : "z-0"}`}
              >
                <Button
                  variant="ghost"
                  type="button"
                  onClick={(event) => activate(p.id, event.currentTarget)}
                  aria-pressed={isActive}
                  aria-label={`${p.name} — select clothing`}
                  className={`rail-garment relative block h-auto w-full origin-top rounded-none p-0 hover:bg-transparent ${isActive ? "scale-[1.22]" : "scale-100"}`}
                >
                  <div key={swayCycle} className={`relative aspect-[3/4] w-full origin-top ${swayCycle > 0 ? "rail-sway" : ""}`}>
                    {images.front ? (
                      <>
                        <img src={images.front} alt={`${p.name} — front`} loading="lazy" width={300} height={400} className={`rail-view absolute inset-0 h-full w-full object-contain object-top shadow-garment ${isActive && showBack && images.back ? "opacity-0" : "opacity-100"}`} />
                        {images.back && <img src={images.back} alt={`${p.name} — back`} loading="lazy" width={300} height={400} className={`rail-view absolute inset-0 h-full w-full object-contain object-top shadow-garment ${isActive && showBack ? "opacity-100" : "opacity-0"}`} />}
                      </>
                    ) : (
                      <div className="mx-auto mt-10 h-3/4 w-3/4 bg-sand" />
                    )}
                  </div>
                </Button>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mx-auto min-h-[240px] max-w-lg px-4 text-center">
        <div className="mb-4 inline-flex border border-border" role="group" aria-label="Clothing view">
          <Button variant={showBack ? "ghost" : "default"} className="min-w-20 rounded-none" aria-pressed={!showBack} onClick={() => setShowBack(false)}>Front</Button>
          <Button variant={showBack ? "default" : "ghost"} className="min-w-20 rounded-none" aria-pressed={showBack} disabled={!views.back} title={views.back ? "Show backside" : "Back photo unavailable"} onClick={() => setShowBack(true)}>Back</Button>
        </div>
        {!views.back && <p className="mb-3 text-xs text-muted-foreground">Back photo unavailable</p>}
        <div key={selected.id} className="rail-details">
          <h3 className="break-words text-base font-semibold">{selected.name}</h3>
          <div className="mt-2 flex justify-center"><PriceTag price={Number(selected.price)} original={selected.original_price != null ? Number(selected.original_price) : null} /></div>
          {sizes.length > 0 && <div className="mt-4 flex flex-wrap justify-center gap-2" role="group" aria-label="Available sizes">
            {sizes.map((size) => <Button key={size} variant={selectedSize === size ? "default" : "outline"} aria-pressed={selectedSize === size} onClick={() => setSelectedSize(size)} className="min-w-11 max-w-full whitespace-normal break-words rounded-none bg-transparent px-3 aria-pressed:bg-primary">{size}</Button>)}
          </div>}
          <Button asChild className="mt-5 rounded-none"><Link to="/product/$slug" params={{ slug: selected.slug }}>View product <ChevronRight /></Link></Button>
        </div>
      </div>
    </section>
  );
}
