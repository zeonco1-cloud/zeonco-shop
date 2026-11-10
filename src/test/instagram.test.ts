import { describe, expect, it } from "vitest";
import { selectedReels } from "@/lib/instagram";

describe("selected Instagram reels", () => {
  it("includes only the reel explicitly selected by the owner", () => {
    expect(selectedReels.map((reel) => reel.id)).toEqual(["DewaNaONx_3"]);
    expect(selectedReels.map((reel) => reel.url)).toEqual(["https://www.instagram.com/reel/DewaNaONx_3/"]);
  });
});