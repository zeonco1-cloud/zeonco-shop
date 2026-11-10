export type InstagramReel = { id: string; url: string; title: string };

export function parseReelUrl(input: string): InstagramReel | null {
  try {
    const url = new URL(input.trim());
    if (url.protocol !== "https:" || !["instagram.com", "www.instagram.com"].includes(url.hostname)) return null;
    const match = url.pathname.match(/^\/reel\/([A-Za-z0-9_-]+)\/?$/);
    if (!match?.[1]) return null;
    return { id: match[1], url: `https://www.instagram.com/reel/${match[1]}/`, title: "" };
  } catch {
    return null;
  }
}

// No account feed or fallback list: an empty saved selection stays empty.
export function readReels(value: unknown): InstagramReel[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || typeof item.url !== "string") return [];
    const reel = parseReelUrl(item.url);
    if (!reel || seen.has(reel.id)) return [];
    seen.add(reel.id);
    return [{ ...reel, title: typeof item.title === "string" ? item.title : "" }];
  });
}

export function moveReel(reels: InstagramReel[], index: number, direction: -1 | 1): InstagramReel[] {
  const next = [...reels];
  const target = index + direction;
  const current = next[index];
  const adjacent = next[target];
  if (!current || !adjacent) return next;
  next[index] = adjacent;
  next[target] = current;
  return next;
}