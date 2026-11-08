import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { categoriesQuery, productsQuery } from "@/lib/store";
import { ShopView, validateShopSearch } from "@/components/site/ShopView";
import { PageHeader } from "@/components/site/PageShell";

export const Route = createFileRoute("/category/$slug")({
  validateSearch: validateShopSearch,
  loader: async ({ context: { queryClient }, params }) => {
    const [cats] = await Promise.all([queryClient.ensureQueryData(categoriesQuery()), queryClient.ensureQueryData(productsQuery())]);
    const category = cats.find((c) => c.slug === params.slug);
    if (!category) throw notFound();
    return { category };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.category.name ?? "Category";
    return {
      meta: [
        { title: `${name} — ZEON.CO` },
        { name: "description", content: `Shop ${name} from ZEON.CO — premium streetwear.` },
        { property: "og:title", content: `${name} — ZEON.CO` },
        { property: "og:description", content: `Shop ${name} from ZEON.CO.` },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="display-xl text-5xl">Category not found</h1>
      <Link to="/shop" className="eyebrow mt-6 inline-block underline">Shop all</Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useLoaderData();
  const search = Route.useSearch();
  return (
    <>
      <PageHeader eyebrow="Category" title={category.name} />
      <ShopView search={search} fixedCategory={category.slug} />
    </>
  );
}
