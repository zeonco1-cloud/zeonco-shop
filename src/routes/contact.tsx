import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { settingsQuery } from "@/lib/store";
import { normalizeWhatsApp } from "@/lib/pricing";
import { PageHeader } from "@/components/site/PageShell";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ZEON.CO" },
      { name: "description", content: "Get in touch with ZEON.CO on WhatsApp or email." },
      { property: "og:title", content: "Contact ZEON.CO" },
      { property: "og:description", content: "Talk to ZEON.CO on WhatsApp." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(settingsQuery()),
  component: Contact,
});

function Contact() {
  const { data: s } = useSuspenseQuery(settingsQuery());
  const wa = normalizeWhatsApp(s?.whatsapp_number);
  return (
    <>
      <PageHeader eyebrow="Get in touch" title="Contact">The fastest way to reach us is WhatsApp — ask about sizes, availability or orders.</PageHeader>
      <div className="mx-auto max-w-7xl space-y-6 px-4 pb-24 md:px-8">
        {wa ? (
          <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="eyebrow inline-block bg-foreground px-8 py-4 text-background">Chat on WhatsApp</a>
        ) : (
          <p className="text-muted-foreground">WhatsApp enquiries open soon.</p>
        )}
        <dl className="grid gap-6 text-sm md:grid-cols-3">
          {s?.contact_email && <div><dt className="eyebrow text-muted-foreground">Email</dt><dd className="mt-1"><a href={`mailto:${s.contact_email}`}>{s.contact_email}</a></dd></div>}
          {s?.contact_phone && <div><dt className="eyebrow text-muted-foreground">Phone</dt><dd className="mt-1">{s.contact_phone}</dd></div>}
          {s?.contact_address && <div><dt className="eyebrow text-muted-foreground">Address</dt><dd className="mt-1 whitespace-pre-line">{s.contact_address}</dd></div>}
        </dl>
      </div>
    </>
  );
}
