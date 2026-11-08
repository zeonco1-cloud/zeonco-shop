import type { Product } from "@/lib/store";

type RailImage = { url: string; alt: string };
export const isBackImage = (image: RailImage) => /\b(back(?:side)?|rear)\b/i.test(image.alt);
export const isFrontImage = (image: RailImage) => /\bfront\b/i.test(image.alt);

export function railViews(product: { product_images: RailImage[] }) {
  const back = product.product_images.find(isBackImage);
  const front = product.product_images.find(isFrontImage) ?? product.product_images.find((image) => !isBackImage(image));
  return { front: front?.url, back: back?.url };
}

export function railSizes(product: Pick<Product, "sizes">) {
  return [...new Set(product.sizes.map((size) => size.trim()).filter(Boolean))];
}

export function shirtsOnRail(products: Product[]) {
  const eligible = products.filter((p) => p.in_rail && p.published && ["shirts", "t-shirts", "tshirts"].includes(p.categories?.slug ?? ""));
  const real = eligible.filter((p) => !p.is_demo);
  return (real.length ? real : eligible).sort((a, b) => a.rail_order - b.rail_order);
}

export function replaceRailImage<T extends RailImage>(images: T[], side: "front" | "back", url: string | null): RailImage[] {
  const current = side === "back" ? images.find(isBackImage) : images.find(isFrontImage) ?? images.find((image) => !isBackImage(image));
  const remaining = images.filter((image) => image !== current);
  if (!url) return remaining;
  const replacement = { url, alt: side === "front" ? "Front" : "Back" };
  return side === "front" ? [replacement, ...remaining] : [...remaining, replacement];
}