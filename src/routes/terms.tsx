import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { PageHeader, Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & conditions — ZEON.CO" },
      { name: "description", content: "Terms for using the ZEON.CO website." },
      { property: "og:title", content: "Terms — ZEON.CO" },
      { property: "og:description", content: "Terms for using the ZEON.CO website." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: () => {
    const { data: s } = useSuspenseQuery(settingsQuery());
    return (
      <>
        <PageHeader title="Terms & conditions" />
        <div className="mx-auto max-w-3xl px-4 pb-24 md:px-8">
          <Prose
            text={s?.terms_text}
            fallback={
              <>
                <p>Product information, prices and availability on this site may change without notice. Prices are shown in Indian Rupees (₹).</p>
                <p>Opening a WhatsApp chat is an enquiry only — no order is confirmed until we agree the details with you directly.</p>
              </>
            }
          />
        </div>
      </>
    );
  },
});
