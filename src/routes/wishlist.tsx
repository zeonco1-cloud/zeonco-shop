import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/store";
import { useWishlist } from "@/lib/wishlist";
import { ProductGrid } from "@/components/site/ProductCard";
import { EmptyState, PageHeader } from "@/components/site/PageShell";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your wishlist — ZEON.CO" },
      { name: "description", content: "Pieces you've saved from ZEON.CO." },
      { property: "og:title", content: "Wishlist — ZEON.CO" },
      { property: "og:description", content: "Your saved ZEON.CO pieces." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(productsQuery()),
  component: Wishlist,
});

function Wishlist() {
  const { data } = useSuspenseQuery(productsQuery());
  const { ids } = useWishlist();
  const saved = data.filter((p) => ids.includes(p.id));
  return (
    <>
      <PageHeader eyebrow="Saved" title="Wishlist" />
      <div className="mx-auto max-w-7xl px-4 pb-24 md:px-8">
        {saved.length ? (
          <ProductGrid products={saved} />
        ) : (
          <EmptyState title="Nothing saved yet">
            Tap the heart on any piece to keep it here. <Link to="/shop" className="underline">Start browsing</Link>
          </EmptyState>
        )}
      </div>
    </>
  );
}
