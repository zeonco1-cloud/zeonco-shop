import { describe, expect, it } from "vitest";
import { discountPercent, formatINR, normalizeWhatsApp, whatsappEnquiryUrl } from "@/lib/pricing";

describe("pricing rules", () => {
  it("formats rupees with Indian grouping", () => {
    expect(formatINR(1499)).toBe("₹1,499");
    expect(formatINR(149999)).toBe("₹1,49,999");
  });
  it("calculates discount from original and selling price", () => {
    expect(discountPercent(1499, 1199)).toBe(20);
  });
  it("shows no discount when selling price is not lower", () => {
    expect(discountPercent(999, 999)).toBeNull();
    expect(discountPercent(null, 999)).toBeNull();
    expect(discountPercent(800, 999)).toBeNull();
  });
});

describe("whatsapp enquiry", () => {
  it("normalises numbers with country code", () => {
    expect(normalizeWhatsApp("+91 98765 43210")).toBe("919876543210");
    expect(normalizeWhatsApp("12345")).toBeNull();
    expect(normalizeWhatsApp("")).toBeNull();
  });
  it("prefills only product name and link", () => {
    const url = whatsappEnquiryUrl("+919876543210", "Box Tee", "https://zeon.co/product/box-tee");
    expect(url).toBe(
      "https://wa.me/919876543210?text=" +
        encodeURIComponent("Hi ZEON.CO, I'm interested in Box Tee. https://zeon.co/product/box-tee"),
    );
  });
  it("is unavailable without a configured number", () => {
    expect(whatsappEnquiryUrl("", "Box Tee", "x")).toBeNull();
  });
});
