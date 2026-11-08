import { describe, expect, it } from "vitest";
import { railSizes, railViews, replaceRailImage, shirtsOnRail } from "@/lib/clothing-rail";
import type { Product, ProductImage } from "@/lib/store";

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
  it("does not use a back-only image as a front", () => {
    expect(railViews({ product_images: [image("back.jpg", "Back")] })).toEqual({ front: undefined, back: "back.jpg" });
  });
  it("front and back replacements and removals preserve other images", () => {
    const images = [image("front.jpg", "Front"), image("back.jpg", "Back"), image("detail.jpg", "Fabric")];
    expect(replaceRailImage(images, "back", "new-back.jpg").map((im) => im.url)).toEqual(["front.jpg", "detail.jpg", "new-back.jpg"]);
    expect(replaceRailImage(images, "front", null).map((im) => im.url)).toEqual(["back.jpg", "detail.jpg"]);
    expect(railViews({ product_images: replaceRailImage(images, "front", "new-front.jpg") }).front).toBe("new-front.jpg");
  });
  it("includes only published real shirts and T-shirts marked for the rail, never jeans or samples", () => {
    const p = (id: string, slug: string, extra = {}) => ({ id, categories: { slug }, in_rail: true, published: true, is_demo: false, rail_order: 0, ...extra }) as Product;
    expect(shirtsOnRail([p("shirt", "shirts"), p("tee", "t-shirts"), p("jeans", "jeans"), p("demo", "shirts", { is_demo: true }), p("draft", "shirts", { published: false }), p("off", "shirts", { in_rail: false })]).map((item) => item.id)).toEqual(["shirt", "tee"]);
  });
  it("shows demo shirts and T-shirts when real rail inventory is unavailable", () => {
    const demo = (id: string, slug: string, extra = {}) => ({ id, categories: { slug }, in_rail: true, published: true, is_demo: true, rail_order: 0, ...extra }) as Product;
    expect(shirtsOnRail([demo("tee", "t-shirts"), demo("shirt", "shirts"), demo("jeans", "jeans"), demo("draft", "shirts", { published: false }), demo("off", "shirts", { in_rail: false })]).map((p) => p.id)).toEqual(["tee", "shirt"]);
  });
});