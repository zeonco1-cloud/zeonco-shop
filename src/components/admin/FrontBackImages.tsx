import { SingleImage, type ImgItem } from "./ImageUploader";
import { railViews, replaceRailImage } from "@/lib/clothing-rail";

export function FrontBackImages({ items, onChange }: { items: ImgItem[]; onChange: (images: ImgItem[]) => void }) {
  const views = railViews({ product_images: items });
  return <div className="mb-6 grid gap-6 sm:grid-cols-2">
    {(["front", "back"] as const).map((side) => <div key={side}>
      <h3 className="eyebrow mb-3">{side === "front" ? "Front image" : "Back image"}</h3>
      <SingleImage value={views[side]} folder={`products/${side}`} label={`Upload ${side}`} onChange={(url) => onChange(replaceRailImage(items, side, url))} />
    </div>)}
  </div>;
}