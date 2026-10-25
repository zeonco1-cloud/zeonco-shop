import type { SizeGuide } from "@/lib/store";

export function SizeGuideTables({ guide }: { guide: unknown }) {
  const g = (guide && typeof guide === "object" ? guide : {}) as SizeGuide;
  const entries = Object.entries(g);
  if (!entries.length) return <p className="text-sm text-muted-foreground">Size guide coming soon.</p>;
  return (
    <div className="space-y-8">
      {entries.map(([k, t]) => (
        <div key={k}>
          <h3 className="eyebrow mb-3">{t.label} <span className="text-muted-foreground">(measurements in {t.unit === "in" ? "inches" : "centimetres"})</span></h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>{t.columns.map((c) => <th key={c} className="border-b border-foreground px-3 py-2 text-left font-semibold">{c}</th>)}</tr>
              </thead>
              <tbody>
                {t.rows.map((r, i) => (
                  <tr key={i} className="border-b border-border">{r.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">Measurements are body/garment guides and may vary slightly. Ask us on WhatsApp if you're between sizes.</p>
    </div>
  );
}
