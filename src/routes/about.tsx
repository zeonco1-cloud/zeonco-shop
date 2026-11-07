import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { PageHeader, Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ZEON.CO" },
      { name: "description", content: "The story behind ZEON.CO — Street Culture Redefined." },
      { property: "og:title", content: "About ZEON.CO" },
      { property: "og:description", content: "The story behind ZEON.CO streetwear." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: About,
});

function About() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  return (
    <>
      <PageHeader eyebrow="Our story" title="Street culture, redefined" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 md:grid-cols-2 md:px-8">
        <img src="/demo/hero.jpg" alt="ZEON.CO campaign" loading="lazy" className="aspect-[4/5] w-full object-cover object-right" />
        <div className="max-w-xl self-center">
          <Prose
            text={s?.about_text}
            fallback={
              <>
                <p>ZEON.CO makes everyday streetwear for people who dress with intent — clean silhouettes, honest fabrics and colours pulled from the city.</p>
                <p>Every piece is designed to be worn hard and styled your way.</p>
              </>
            }
          />
        </div>
      </div>
    </>
  );
}
