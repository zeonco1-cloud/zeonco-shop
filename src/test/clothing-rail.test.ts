import { describe, expect, it } from "vitest";
import { railSizes, railViews } from "@/components/site/HangingRail";
import type { ProductImage } from "@/lib/store";

const image = (url: string, alt: string): ProductImage => ({ id: url, url, alt, product_id: "tee", sort_order: 0, created_at: "" });

describe("clothing rail product data", () => {
  it("shows only sizes present on the selected product, not a default S–XXL list", () => {
    expect(railSizes({ sizes: ["M", "XL"] })).toEqual(["M", "XL"]);
    expect(railSizes({ sizes: ["30", "32", "34"] })).toEqual(["30", "32", "34"]);
    expect(railSizes({ sizes: [] })).toEqual([]);
  });
  it("uses the actual labelled backside and preserves the front photo", () => {
    expect(railViews({ product_images: [image("front.jpg", "Tee front"), image("back.jpg", "Tee backside")] })).toEqual({ front: "front.jpg", back: "back.jpg" });
  });
  it("never presents a second unrelated image as the backside", () => {
    expect(railViews({ product_images: [image("front.jpg", "Tee"), image("detail.jpg", "Fabric detail")] })).toEqual({ front: "front.jpg", back: undefined });
  });
});