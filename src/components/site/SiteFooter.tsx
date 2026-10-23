import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { categoriesQuery, settingsQuery } from "@/lib/store";
import { normalizeWhatsApp } from "@/lib/pricing";

export function SiteFooter() {
  const { data: s } = useQuery(settingsQuery());
  const { data: cats } = useQuery(categoriesQuery());
  const wa = normalizeWhatsApp(s?.whatsapp_number);
  const socials = [
    ["Instagram", s?.instagram_url],
    ["Facebook", s?.facebook_url],
    ["YouTube", s?.youtube_url],
    ["X", s?.x_url],
  ].filter(([, u]) => u) as [string, string][];

  return (
    <footer className="bg-ink text-ink-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-4 md:px-8">
        <div className="md:col-span-1">
          <p className="font-display text-3xl font-black tracking-[0.15em]">{s?.store_name ?? "ZEON.CO"}</p>
          <p className="mt-3 text-sm text-ink-foreground/70">{s?.tagline ?? "Street Culture Redefined."}</p>
        </div>
        <div>
          <p className="eyebrow mb-4 text-ink-foreground/60">Shop</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/shop">All products</Link></li>
            {cats?.map((c) => (
              <li key={c.id}><Link to="/category/$slug" params={{ slug: c.slug }}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-ink-foreground/60">Brand</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about">About ZEON.CO</Link></li>
            <li><Link to="/contact">Contact</Link></li>
            <li><Link to="/size-guide">Size guide</Link></li>
            <li><Link to="/privacy-policy">Privacy policy</Link></li>
            <li><Link to="/terms">Terms & conditions</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow mb-4 text-ink-foreground/60">Talk to us</p>
          <ul className="space-y-2 text-sm">
            {wa ? (
              <li><a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">WhatsApp enquiries</a></li>
            ) : (
              <li className="text-ink-foreground/60">WhatsApp coming soon</li>
            )}
            {s?.contact_email && <li><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></li>}
            {socials.map(([n, u]) => (
              <li key={n}><a href={u} target="_blank" rel="noopener noreferrer">{n}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-foreground/15">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-ink-foreground/50 md:px-8">
          © {new Date().getFullYear()} {s?.store_name ?? "ZEON.CO"}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
