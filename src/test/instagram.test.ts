import { describe, expect, it } from "vitest";
import { moveReel, parseReelUrl, readReels } from "@/lib/instagram";

describe("selected Instagram reels", () => {
  it("includes only the reel explicitly selected by the owner", () => {
    const reels = readReels([{ url: "https://www.instagram.com/reel/DewaNaONx_3/" }]);
    expect(reels.map((reel) => reel.id)).toEqual(["DewaNaONx_3"]);
    expect(reels.map((reel) => reel.url)).toEqual(["https://www.instagram.com/reel/DewaNaONx_3/"]);
  });
  it("does not restore removed reels from a fallback", () => {
    expect(readReels([])).toEqual([]);
  });
  it("accepts reel links and strips tracking parameters", () => {
    expect(parseReelUrl("https://www.instagram.com/reel/DewaNaONx_3/?igsh=abc")?.url).toBe("https://www.instagram.com/reel/DewaNaONx_3/");
  });
  it("rejects non-reel and untrusted links", () => {
    for (const url of ["https://instagram.com.evil.test/reel/abc/", "https://www.instagram.com/p/abc/", "http://instagram.com/reel/abc/", "not a URL"]) expect(parseReelUrl(url)).toBeNull();
  });
  it("shows each selected reel only once", () => {
    expect(readReels([{ url: "https://instagram.com/reel/abc/" }, { url: "https://www.instagram.com/reel/abc/" }])).toHaveLength(1);
  });
  it("preserves dashboard order and supports moving reels", () => {
    const reels = readReels([{ url: "https://instagram.com/reel/first/" }, { url: "https://instagram.com/reel/second/" }]);
    expect(moveReel(reels, 1, -1).map((r) => r.id)).toEqual(["second", "first"]);
    expect(moveReel(reels, 0, 1).map((r) => r.id)).toEqual(["second", "first"]);
    expect(moveReel(reels, 0, -1)).toEqual(reels);
  });
});