import { createFileRoute } from "@tanstack/react-router";
import { categoriesQuery, productsQuery } from "@/lib/store";
import { ShopView, validateShopSearch } from "@/components/site/ShopView";
import { PageHeader } from "@/components/site/PageShell";

export const Route = createFileRoute("/shop")({
  validateSearch: validateShopSearch,
  head: () => ({
    meta: [
      { title: "Shop all — ZEON.CO" },
      { name: "description", content: "Shop ZEON.CO streetwear: tees, shirts, jeans and accessories. Filter by size, color and price." },
      { property: "og:title", content: "Shop all — ZEON.CO" },
      { property: "og:description", content: "Browse the full ZEON.CO streetwear collection." },
    ],
  }),
  loader: ({ context: { queryClient } }) => Promise.all([queryClient.ensureQueryData(productsQuery()), queryClient.ensureQueryData(categoriesQuery())]),
  component: Shop,
});

function Shop() {
  const search = Route.useSearch();
  const title = search.sale ? "Sale" : search.new ? "New arrivals" : search.featured ? "Best sellers" : "Shop all";
  return (
    <>
      <PageHeader eyebrow="The collection" title={title} />
      <ShopView search={search} />
    </>
  );
}
