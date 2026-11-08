import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { PageHeader, Prose } from "@/components/site/PageShell";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy policy — ZEON.CO" },
      { name: "description", content: "How ZEON.CO handles your information." },
      { property: "og:title", content: "Privacy policy — ZEON.CO" },
      { property: "og:description", content: "How ZEON.CO handles your information." },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: () => {
    const { data: s } = useSuspenseQuery(settingsQuery());
    return (
      <>
        <PageHeader title="Privacy policy" />
        <div className="mx-auto max-w-3xl px-4 pb-24 md:px-8">
          <Prose
            text={s?.privacy_text}
            fallback={
              <>
                <p>This website does not require you to create an account. Your wishlist is stored only in your own browser.</p>
                <p>When you contact us on WhatsApp, your messages are handled under WhatsApp's own terms and privacy policy. We use the details you share only to answer your enquiry.</p>
                <p>We do not sell your personal information. Contact us to ask about or delete any information you've shared with us.</p>
              </>
            }
          />
        </div>
      </>
    );
  },
});
