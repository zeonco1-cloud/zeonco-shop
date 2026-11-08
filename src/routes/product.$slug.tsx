import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { MessageCircle, X, ZoomIn } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { productQuery, productsQuery, settingsQuery, stockLabel } from "@/lib/store";
import { whatsappEnquiryUrl } from "@/lib/pricing";
import { PriceTag, ProductGrid, WishlistButton } from "@/components/site/ProductCard";
import { SizeGuideTables } from "@/components/site/SizeGuideTables";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context: { queryClient }, params }) => {
    const [product] = await Promise.all([
      queryClient.ensureQueryData(productQuery(params.slug)),
      queryClient.ensureQueryData(settingsQuery()),
      queryClient.ensureQueryData(productsQuery()),
    ]);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.product;
    if (!p) return { meta: [{ title: "Product unavailable — ZEON.CO" }, { name: "robots", content: "noindex" }] };
    const desc = p.short_description || `${p.name} from ZEON.CO`;
    const img = p.product_images[0]?.url;
    const abs = img?.startsWith("http") ? img : undefined;
    return {
      meta: [
        { title: `${p.name} — ZEON.CO` },
        { name: "description", content: desc },
        { property: "og:title", content: `${p.name} — ZEON.CO` },
        { property: "og:description", content: desc },
        { property: "og:type", content: "product" },
        ...(abs ? [{ property: "og:image", content: abs }, { name: "twitter:image", content: abs }] : []),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description || desc,
            brand: { "@type": "Brand", name: "ZEON.CO" },
            offers: {
              "@type": "Offer",
              priceCurrency: "INR",
              price: Number(p.price),
              availability: p.stock_status === "out_of_stock" ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="display-xl text-5xl">Product unavailable</h1>
      <p className="mt-3 text-muted-foreground">This piece isn't available right now.</p>
      <Link to="/shop" className="eyebrow mt-6 inline-block bg-foreground px-6 py-3 text-background">Back to shop</Link>
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productQuery(slug));
  const { data: settings } = useSuspenseQuery(settingsQuery());
  const { data: all } = useSuspenseQuery(productsQuery());
  const p = product!;
  const [idx, setIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(p.colors[0]?.name ?? null);
  const [guide, setGuide] = useState(false);
  const [url, setUrl] = useState(`/product/${p.slug}`);
  useEffect(() => setUrl(`${window.location.origin}/product/${p.slug}`), [p.slug]);
  useEffect(() => setIdx(0), [p.id]);

  const images = p.product_images;
  const oos = p.stock_status === "out_of_stock";
  const wa = whatsappEnquiryUrl(settings?.whatsapp_number, p.name, url);
  const related = all.filter((x) => x.id !== p.id && x.category_id && x.category_id === p.category_id).slice(0, 4);

  return (
    <div className="pb-28">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 md:grid-cols-2 md:gap-14 md:px-8 md:pt-12">
        {/* Gallery */}
        <div>
          <button onClick={() => images.length && setZoom(true)} className="group relative block aspect-[4/5] w-full overflow-hidden bg-secondary" aria-label="Open full-screen image">
            {images[idx] ? (
              <img src={images[idx].url} alt={images[idx].alt || p.name} width={900} height={1125} className="h-full w-full object-contain p-6" />
            ) : (
              <span className="text-sm text-muted-foreground">No image</span>
            )}
            <ZoomIn className="absolute bottom-3 right-3 h-5 w-5 opacity-60 group-hover:opacity-100" />
          </button>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((im, i) => (
                <button key={im.id} onClick={() => setIdx(i)} aria-label={`Show image ${i + 1}`} aria-current={i === idx} className={`h-20 w-16 shrink-0 bg-secondary ${i === idx ? "ring-2 ring-foreground" : ""}`}>
                  <img src={im.url} alt="" className="h-full w-full object-contain p-1" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="md:py-4">
          {p.categories && (
            <Link to="/category/$slug" params={{ slug: p.categories.slug }} className="eyebrow text-accent">{p.categories.name}</Link>
          )}
          <div className="mt-2 flex items-start justify-between gap-4">
            <h1 className="font-display text-3xl font-black uppercase leading-tight md:text-5xl">{p.name}</h1>
            <WishlistButton id={p.id} name={p.name} className="shrink-0 border border-border" />
          </div>
          <div className="mt-4"><PriceTag size="lg" price={Number(p.price)} original={p.original_price != null ? Number(p.original_price) : null} /></div>
          <p className={`eyebrow mt-3 ${oos ? "text-destructive" : p.stock_status === "low_stock" ? "text-accent" : "text-success"}`}>{stockLabel(p.stock_status)}</p>
          {p.short_description && <p className="mt-5 text-foreground/85">{p.short_description}</p>}

          {p.colors.length > 0 && (
            <fieldset className="mt-7">
              <legend className="eyebrow mb-3">Color: <span className="text-muted-foreground">{color}</span></legend>
              <div className="flex flex-wrap gap-3">
                {p.colors.map((c) => (
                  <label key={c.name} className="cursor-pointer">
                    <input type="radio" name="color" className="peer sr-only" checked={color === c.name} onChange={() => setColor(c.name)} />
                    <span title={c.name} className="block h-9 w-9 rounded-full border border-border ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring" style={{ background: c.hex }} />
                    <span className="sr-only">{c.name}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {p.sizes.length > 0 && (
            <fieldset className="mt-7">
              <div className="mb-3 flex items-center justify-between">
                <legend className="eyebrow">Size</legend>
                <button type="button" onClick={() => setGuide(true)} className="text-xs underline">Size guide</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s) => (
                  <label key={s} className="cursor-pointer">
                    <input type="radio" name="size" className="peer sr-only" checked={size === s} onChange={() => setSize(s)} />
                    <span className="flex h-11 min-w-12 items-center justify-center border border-border px-3 text-sm font-semibold peer-checked:border-foreground peer-checked:bg-foreground peer-checked:text-background peer-focus-visible:ring-2 peer-focus-visible:ring-ring">{s}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          <div className="mt-8 hidden md:block"><EnquiryButton wa={wa} oos={oos} /></div>

          {settings?.delivery_info && (
            <div className="mt-8 border-t border-border pt-5 text-sm text-muted-foreground">
              <p className="eyebrow mb-2 text-foreground">Delivery</p>
              <p className="whitespace-pre-line">{settings.delivery_info}</p>
            </div>
          )}
          {p.description && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="eyebrow mb-2">Details</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/85">{p.description}</p>
            </div>
          )}
          {p.fabric && (
            <div className="mt-6 border-t border-border pt-5">
              <p className="eyebrow mb-2">Fabric</p>
              <p className="text-sm text-foreground/85">{p.fabric}</p>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
          <h2 className="display-xl mb-8 text-3xl md:text-5xl">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}

      {/* Sticky mobile enquiry */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-3 backdrop-blur md:hidden">
        <EnquiryButton wa={wa} oos={oos} />
      </div>

      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="h-[92vh] max-w-5xl border-0 bg-card p-0 [&>button]:hidden">
          <DialogTitle className="sr-only">{p.name} image viewer</DialogTitle>
          <button onClick={() => setZoom(false)} aria-label="Close" className="absolute right-3 top-3 z-10 rounded-full bg-background p-2"><X className="h-5 w-5" /></button>
          <div className="flex h-full snap-x snap-mandatory overflow-x-auto">
            {images.map((im) => (
              <img key={im.id} src={im.url} alt={im.alt || p.name} className="h-full w-full shrink-0 snap-center object-contain p-4" />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={guide} onOpenChange={setGuide}>
        <DialogContent className="max-h-[85vh] overflow-y-auto bg-background">
          <DialogTitle className="font-display text-2xl font-black uppercase">Size guide</DialogTitle>
          <SizeGuideTables guide={settings?.size_guide} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EnquiryButton({ wa, oos }: { wa: string | null; oos: boolean }) {
  if (!wa) {
    return (
      <div className="border border-dashed border-border px-4 py-3 text-center text-sm text-muted-foreground">
        WhatsApp enquiries open soon — the store is still setting up its contact number.
      </div>
    );
  }
  return (
    <a href={wa} target="_blank" rel="noopener noreferrer" className="eyebrow flex w-full items-center justify-center gap-2 bg-foreground px-6 py-4 text-background transition hover:bg-accent">
      <MessageCircle className="h-4 w-4" /> {oos ? "Ask about availability on WhatsApp" : "Enquire on WhatsApp"}
    </a>
  );
}
