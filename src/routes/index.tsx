import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { categoriesQuery, galleryQuery, productsQuery, settingsQuery } from "@/lib/store";
import { discountPercent } from "@/lib/pricing";
import { ProductGrid } from "@/components/site/ProductCard";
import { HangingRail } from "@/components/site/HangingRail";
import { InstagramReels } from "@/components/site/InstagramReels";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ZEON.CO — Street Culture Redefined | Premium Streetwear India" },
      { name: "description", content: "Premium streetwear tees, shirts, denim and accessories. Explore the ZEON.CO collection and enquire on WhatsApp." },
      { property: "og:title", content: "ZEON.CO — Street Culture Redefined" },
      { property: "og:description", content: "Premium streetwear tees, shirts, denim and accessories from ZEON.CO." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(settingsQuery()),
      queryClient.ensureQueryData(categoriesQuery()),
      queryClient.ensureQueryData(productsQuery()),
      queryClient.ensureQueryData(galleryQuery()),
    ]),
  component: Home,
});

function SectionHead({ eyebrow, title, to, search, cta }: { eyebrow: string; title: string; to: string; search?: any; cta?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow text-accent">{eyebrow}</p>
        <h2 className="display-xl mt-2 text-4xl md:text-6xl">{title}</h2>
      </div>
      {cta && (
        <Link to={to} search={search} className="eyebrow group flex shrink-0 items-center gap-2 border-b border-foreground pb-1">
          {cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}

function Home() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  const { data: cats } = useSuspenseQuery(categoriesQuery());
  const { data: products } = useSuspenseQuery(productsQuery());
  const { data: gallery } = useSuspenseQuery(galleryQuery());

  const newArrivals = products.filter((p) => p.is_new).slice(0, 8);
  const featured = products.filter((p) => p.is_featured).slice(0, 4);
  const sale = products.filter((p) => p.on_sale && discountPercent(p.original_price, p.price)).slice(0, 4);
  const rail = products.filter((p) => p.in_rail).sort((a, b) => a.rail_order - b.rail_order);
  const heroImg = s?.hero_image_url || "/demo/hero.jpg";
  const headline = s?.hero_headline || "OWN YOUR EVERYDAY.";

  return (
    <>
      {/* HERO */}
      <section className="relative h-[calc(100svh-6rem)] min-h-[520px] overflow-hidden bg-ink">
        <img src={heroImg} alt="ZEON.CO campaign" fetchPriority="high" width={1920} height={1152} className="animate-reveal absolute inset-0 h-full w-full object-cover object-[72%_center] md:object-center" />
        <div className="bg-hero-scrim absolute inset-0" />
        <div className="relative mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 text-ink-foreground md:justify-center md:px-8 md:pb-0">
          <p className="eyebrow animate-rise text-ink-foreground/80">{s?.tagline || "Street Culture Redefined."}</p>
          <h1 className="display-xl animate-rise mt-4 max-w-3xl text-[14.5vw] [animation-delay:120ms] md:text-[8.5rem]">
            {headline}
          </h1>
          <p className="animate-rise mt-5 max-w-md text-base text-ink-foreground/85 [animation-delay:240ms] md:text-lg">{s?.hero_subtext}</p>
          <div className="animate-rise mt-8 flex flex-wrap items-center gap-5 [animation-delay:360ms]">
            <a href={s?.hero_cta_link || "/shop"} className="eyebrow bg-ink-foreground px-7 py-4 text-ink transition hover:bg-sand">
              {s?.hero_cta_text || "SHOP THE COLLECTION"}
            </a>
            <Link to="/shop" search={{ new: true }} className="eyebrow border-b border-ink-foreground pb-1">New arrivals</Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      {cats.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <SectionHead eyebrow="Shop by category" title="Find your fit" to="/shop" cta="Shop all" />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {cats.map((c) => (
              <Link key={c.id} to="/category/$slug" params={{ slug: c.slug }} className="group relative block aspect-[3/4] overflow-hidden bg-secondary">
                {c.image_url && <img src={c.image_url} alt="" loading="lazy" width={600} height={800} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-ink-foreground">
                  <span className="font-display text-xl font-black uppercase md:text-2xl">{c.name}</span>
                  <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {s?.show_new_arrivals !== false && newArrivals.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pb-16 md:px-8 md:pb-24">
          <SectionHead eyebrow="Just landed" title="New arrivals" to="/shop" search={{ new: true }} cta="View all new arrivals" />
          <ProductGrid products={newArrivals} />
        </section>
      )}

      {s?.show_rail !== false && <HangingRail products={rail} />}

      {s?.show_best_sellers !== false && featured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <SectionHead eyebrow="Curated" title="Best sellers" to="/shop" search={{ featured: true }} cta="View all" />
          <ProductGrid products={featured} />
        </section>
      )}

      {s?.show_sale !== false && sale.length > 0 && (
        <section className="bg-ink py-16 text-ink-foreground md:py-24">
          <div className="mx-auto max-w-7xl px-4 md:px-8">
            <div className="mb-8 flex items-end justify-between">
              <div>
                <p className="eyebrow text-sand">Special offers</p>
                <h2 className="display-xl mt-2 text-4xl md:text-6xl">On sale</h2>
              </div>
              <Link to="/shop" search={{ sale: true }} className="eyebrow border-b border-ink-foreground pb-1">Shop sale</Link>
            </div>
            <div className="rounded-sm bg-background p-3 text-foreground md:p-6">
              <ProductGrid products={sale} />
            </div>
          </div>
        </section>
      )}

      <InstagramReels />

      {s?.show_gallery !== false && gallery.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-8 md:py-24">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="eyebrow text-accent">The feed</p>
              <h2 className="display-xl mt-2 text-4xl md:text-6xl">Seen in ZEON</h2>
            </div>
            {s?.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" className="eyebrow border-b border-foreground pb-1">Follow on Instagram</a>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
            {gallery.slice(0, 6).map((g, i) => (
              <div key={g.id} className={`overflow-hidden bg-secondary ${i === 0 ? "row-span-2" : ""}`}>
                <img src={g.url} alt={g.alt || "ZEON.CO style"} loading="lazy" className={`h-full w-full object-cover transition duration-700 hover:scale-105 ${i === 0 ? "aspect-[3/4] md:aspect-auto" : "aspect-square"}`} />
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
