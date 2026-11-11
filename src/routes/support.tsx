import { createFileRoute, Link, Outlet, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { createThread, deleteThread, listThreads } from "@/lib/support.functions";
import { getVisitorToken, prioritySupportUrl } from "@/lib/support";
import { settingsQuery } from "@/lib/store";

export const Route = createFileRoute("/support")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Customer Assistant — ZEON.CO Help & Support" },
      { name: "description", content: "Ask the ZEON.CO assistant about products, sizes and delivery, or get priority help on WhatsApp." },
      { property: "og:title", content: "ZEON.CO Customer Assistant" },
      { property: "og:description", content: "Instant answers about ZEON.CO products, sizing and delivery, plus priority WhatsApp support." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SupportLayout,
});

export const threadsKey = ["support-threads"] as const;

export function useStartChat() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const start = async () => {
    setBusy(true);
    try {
      const t = await createThread({ data: { token: getVisitorToken() } });
      await qc.invalidateQueries({ queryKey: threadsKey });
      navigate({ to: "/support/$threadId", params: { threadId: t.id } });
    } finally {
      setBusy(false);
    }
  };
  return { start, busy };
}

function SupportLayout() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const { data: threads } = useQuery({ queryKey: threadsKey, queryFn: () => listThreads({ data: { token: getVisitorToken() } }) });
  const { data: settings } = useQuery(settingsQuery());
  const { start, busy } = useStartChat();
  const wa = prioritySupportUrl(settings?.whatsapp_number);

  const remove = async (id: string) => {
    await deleteThread({ data: { token: getVisitorToken(), threadId: id } });
    await qc.invalidateQueries({ queryKey: threadsKey });
    if (params.threadId === id) navigate({ to: "/support" });
  };

  return (
    <div className="mx-auto grid max-w-7xl gap-0 md:grid-cols-[260px_1fr] md:px-8 md:py-8">
      <aside className="border-b border-border p-4 md:border md:border-r-0 md:p-5">
        <button onClick={start} disabled={busy} className="eyebrow flex w-full items-center justify-center gap-2 bg-foreground px-4 py-3 text-background disabled:opacity-60">
          <Plus className="h-4 w-4" /> New chat
        </button>
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="eyebrow mt-2 flex w-full items-center justify-center gap-2 border border-foreground px-4 py-3">
            <MessageCircle className="h-4 w-4" /> Priority WhatsApp
          </a>
        )}
        <p className="eyebrow mt-6 text-muted-foreground">Your chats</p>
        <ul className="scrollbar-none mt-2 flex gap-2 overflow-x-auto md:max-h-[60vh] md:flex-col md:overflow-y-auto">
          {threads?.length === 0 && <li className="text-sm text-muted-foreground">No chats yet.</li>}
          {threads?.map((t) => (
            <li key={t.id} className="group flex shrink-0 items-center gap-1">
              <Link
                to="/support/$threadId"
                params={{ threadId: t.id }}
                className="block max-w-[200px] truncate rounded-sm px-3 py-2 text-sm hover:bg-secondary md:max-w-none md:flex-1"
                activeProps={{ className: "bg-secondary font-semibold" }}
              >
                {t.title}
              </Link>
              <button onClick={() => remove(t.id)} aria-label={`Delete chat ${t.title}`} className="p-1.5 text-muted-foreground hover:text-foreground">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </aside>
      <section className="min-h-[70vh] md:border md:border-border">
        <Outlet />
      </section>
    </div>
  );
}
