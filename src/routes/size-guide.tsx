import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { PageHeader } from "@/components/site/PageShell";
import { SizeGuideTables } from "@/components/site/SizeGuideTables";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size guide — ZEON.CO" },
      { name: "description", content: "Find your size for ZEON.CO tees, shirts and jeans." },
      { property: "og:title", content: "Size guide — ZEON.CO" },
      { property: "og:description", content: "ZEON.CO measurement tables." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: () => {
    const { data: s } = useSuspenseQuery(settingsQuery());
    return (
      <>
        <PageHeader eyebrow="Fit" title="Size guide" />
        <div className="mx-auto max-w-4xl px-4 pb-24 md:px-8"><SizeGuideTables guide={s?.size_guide} /></div>
      </>
    );
  },
});
