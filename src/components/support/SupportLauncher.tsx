import { Link, useRouterState } from "@tanstack/react-router";
import { AssistantMark } from "./AssistantMark";

export function SupportLauncher() {
  const hidden = useRouterState({ select: (s) => s.location.pathname.startsWith("/support") || s.location.pathname.startsWith("/admin") });
  if (hidden) return null;
  return (
    <Link to="/support" aria-label="Chat with the ZEON assistant" className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-foreground py-2 pl-2 pr-4 text-background shadow-lg transition hover:scale-105">
      <AssistantMark className="h-9 w-9 bg-background text-sm text-foreground" />
      <span className="eyebrow text-[0.7rem]">Ask ZEON</span>
    </Link>
  );
}
