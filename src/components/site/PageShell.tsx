import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pb-8 pt-10 md:px-8 md:pt-16">
      {eyebrow && <p className="eyebrow text-accent">{eyebrow}</p>}
      <h1 className="display-xl mt-2 text-5xl md:text-7xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Prose({ text, fallback }: { text?: string | null; fallback: ReactNode }) {
  if (!text?.trim()) return <div className="space-y-4 leading-relaxed text-foreground/85">{fallback}</div>;
  return (
    <div className="space-y-4 leading-relaxed text-foreground/85">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-line">{para}</p>
      ))}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-dashed border-border px-6 py-16 text-center">
      <p className="font-display text-2xl font-black uppercase">{title}</p>
      {children && <div className="mt-3 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
