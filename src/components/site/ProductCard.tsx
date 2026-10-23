import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/store";
import { mainImage } from "@/lib/store";
import { discountPercent, formatINR } from "@/lib/pricing";
import { useWishlist } from "@/lib/wishlist";

export function PriceTag({ price, original, size = "sm" }: { price: number; original: number | null; size?: "sm" | "lg" }) {
  const pct = discountPercent(original, price);
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 ${size === "lg" ? "text-2xl" : "text-sm"}`}>
      <span className="font-bold">{formatINR(price)}</span>
      {pct && (
        <>
          <span className="text-muted-foreground line-through">{formatINR(original)}</span>
          <span className={`font-bold text-accent ${size === "lg" ? "text-base" : "text-xs"}`}>−{pct}%</span>
        </>
      )}
    </div>
  );
}

export function WishlistButton({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  const { has, toggle } = useWishlist();
  const on = has(id);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(id);
      }}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Save ${name} to wishlist`}
      className={`flex h-10 w-10 items-center justify-center rounded-full bg-card/90 transition hover:bg-card ${className}`}
    >
      <Heart className={`h-4 w-4 ${on ? "fill-foreground" : ""}`} />
    </button>
  );
}

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const img = mainImage(product);
  const pct = discountPercent(product.original_price, product.price);
  const oos = product.stock_status === "out_of_stock";
  return (
    <article className="group relative">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
          {img ? (
            <img
              src={img}
              alt={product.product_images[0]?.alt || product.name}
              loading={priority ? "eager" : "lazy"}
              width={600}
              height={750}
              className={`h-full w-full object-contain p-4 transition duration-700 group-hover:scale-105 ${oos ? "opacity-60" : ""}`}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {pct && <span className="eyebrow bg-accent px-2 py-1 text-[0.6rem] text-accent-foreground">−{pct}%</span>}
            {product.is_new && !oos && <span className="eyebrow bg-card px-2 py-1 text-[0.6rem]">New</span>}
            {oos && <span className="eyebrow bg-ink px-2 py-1 text-[0.6rem] text-ink-foreground">Out of stock</span>}
          </div>
        </div>
        <div className="mt-3 space-y-1 pr-2">
          <h3 className="font-sans text-sm font-semibold leading-snug">{product.name}</h3>
          <PriceTag price={Number(product.price)} original={product.original_price != null ? Number(product.original_price) : null} />
        </div>
      </Link>
      <WishlistButton id={product.id} name={product.name} className="absolute right-2 top-2" />
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-5 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
