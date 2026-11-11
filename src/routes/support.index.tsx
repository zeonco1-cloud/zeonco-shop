import { createFileRoute } from "@tanstack/react-router";
import { useStartChat } from "./support";
import { AssistantMark } from "@/components/support/AssistantMark";

export const Route = createFileRoute("/support/")({ component: SupportHome });

function SupportHome() {
  const { start, busy } = useStartChat();
  return (
    <div className="flex h-full min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <AssistantMark className="h-14 w-14 text-lg" />
      <h1 className="display-xl mt-5 text-4xl md:text-5xl">Ask ZEON</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">Sizes, fits, prices, delivery — get an instant answer. Need a person? Tap Priority WhatsApp.</p>
      <button onClick={start} disabled={busy} className="eyebrow mt-6 bg-foreground px-7 py-4 text-background disabled:opacity-60">Start a chat</button>
    </div>
  );
}
