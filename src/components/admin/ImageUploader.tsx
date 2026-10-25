import { ArrowDown, ArrowUp, Loader2, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadImage } from "@/lib/admin";

/** Single-image picker that uploads immediately and returns the stored URL. */
export function SingleImage({ value, onChange, folder, label = "Upload image" }: { value: string | null | undefined; onChange: (url: string | null) => void; folder: string; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadImage(f, folder));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="flex items-center gap-4">
      <div className="h-24 w-24 shrink-0 overflow-hidden border border-border bg-secondary">
        {value && <img src={value} alt="" className="h-full w-full object-cover" />}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="eyebrow inline-flex items-center gap-2 border border-foreground px-3 py-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {busy ? "Uploading…" : label}
        </button>
        {value && <button type="button" onClick={() => onChange(null)} className="text-left text-xs underline">Remove</button>}
      </div>
    </div>
  );
}

export type ImgItem = { id?: string; url: string; alt: string };

/** Multi-image list with upload, reorder and remove. */
export function ImageList({ items, onChange, folder }: { items: ImgItem[]; onChange: (items: ImgItem[]) => void; folder: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const add = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    setProgress({ done: 0, total: list.length });
    const added: ImgItem[] = [];
    for (const f of list) {
      try {
        added.push({ url: await uploadImage(f, folder), alt: "" });
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
      setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
    }
    onChange([...items, ...added]);
    setProgress(null);
    if (ref.current) ref.current.value = "";
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map((it, i) => (
          <div key={it.url} className="border border-border bg-background p-2">
            <div className="relative aspect-[4/5] bg-secondary">
              <img src={it.url} alt="" className="h-full w-full object-contain" />
              {i === 0 && <span className="eyebrow absolute left-1 top-1 bg-foreground px-1.5 py-0.5 text-[0.55rem] text-background">Main</span>}
            </div>
            <input aria-label="Image description" value={it.alt} maxLength={150} placeholder="Alt text" onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} className="mt-2 w-full border border-input px-2 py-1 text-xs" />
            <div className="mt-1 flex justify-between">
              <button type="button" aria-label="Move earlier" onClick={() => move(i, -1)} className="p-1"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" aria-label="Move later" onClick={() => move(i, 1)} className="p-1"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" aria-label="Remove image" onClick={() => onChange(items.filter((_, k) => k !== i))} className="p-1 text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => add(e.target.files)} />
      <button type="button" disabled={!!progress} onClick={() => ref.current?.click()} className="eyebrow mt-3 inline-flex items-center gap-2 border border-dashed border-foreground px-4 py-3">
        {progress ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading {progress.done}/{progress.total}</> : <><Upload className="h-4 w-4" /> Add images</>}
      </button>
      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG, WebP or AVIF, up to 5 MB each. Transparent PNGs look best on the clothing rail.</p>
    </div>
  );
}
