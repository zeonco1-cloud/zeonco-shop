import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { HangingRail } from "@/components/site/HangingRail";
import type { Product } from "@/lib/store";

vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a> }));
vi.mock("@/components/site/ProductCard", () => ({ PriceTag: () => null }));

const products = ["Shirt", "T-shirt"].map((name, i) => ({ id: name, name, slug: name, sizes: ["M", "XL"], price: 1250, original_price: null, product_images: [{ url: `${i}.png`, alt: "Front" }] }) as Product);

describe("rail selection", () => {
  it("starts unselected and ignores pointer movement; only click selects and return clears selection", () => {
    render(<HangingRail products={products} />);
    const first = screen.getByRole("button", { name: "Shirt — select clothing" });
    const second = screen.getByRole("button", { name: "T-shirt — select clothing" });
    expect(first.getAttribute("aria-pressed")).toBe("false");
    expect(second.getAttribute("aria-pressed")).toBe("false");
    fireEvent.pointerEnter(first); fireEvent.pointerMove(first);
    expect(first.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(first);
    expect(first.getAttribute("aria-pressed")).toBe("true");
    expect(second.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(second);
    expect(second.getAttribute("aria-pressed")).toBe("true");
    expect(first.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Return clothing to rail" }));
    expect(second.getAttribute("aria-pressed")).toBe("false");
    cleanup();
  });
});