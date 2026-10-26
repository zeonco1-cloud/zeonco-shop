import type { ReactNode } from "react";

export const inputCls = "w-full border border-input bg-background px-3 py-2.5 text-base md:text-sm";

export function Field({ label, htmlFor, hint, children }: { label: string; htmlFor?: string; hint?: string | undefined; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="eyebrow mb-1.5 block text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5 accent-[var(--foreground)]" />
      {label}
    </label>
  );
}

export function Panel({ title, children, actions }: { title: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className="border border-border bg-card p-5 md:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-black uppercase">{title}</h2>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export function AdminTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 className="display-xl text-3xl md:text-5xl">{children}</h1>
      {actions}
    </div>
  );
}

export const btnPrimary = "eyebrow inline-flex items-center justify-center gap-2 bg-foreground px-5 py-3 text-background disabled:opacity-50";
export const btnGhost = "eyebrow inline-flex items-center justify-center gap-2 border border-foreground px-4 py-2.5 disabled:opacity-50";
