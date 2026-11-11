export function AssistantMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden className={`inline-flex shrink-0 items-center justify-center rounded-full bg-foreground font-display font-black tracking-tight text-background ${className}`}>
      Z<span className="text-accent">.</span>
    </span>
  );
}
