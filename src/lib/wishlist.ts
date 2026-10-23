import { useCallback, useSyncExternalStore } from "react";

const KEY = "zeon.wishlist.v1";
const listeners = new Set<() => void>();
let cache: string[] | null = null;

function read(): string[] {
  if (typeof window === "undefined") return [];
  if (cache) return cache;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    cache = [];
  }
  return cache;
}
function write(ids: string[]) {
  cache = ids;
  localStorage.setItem(KEY, JSON.stringify(ids));
  listeners.forEach((l) => l());
}
const EMPTY: string[] = [];

export function useWishlist() {
  const ids = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    read,
    () => EMPTY,
  );
  const toggle = useCallback((id: string) => {
    const cur = read();
    write(cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  }, []);
  return { ids, has: (id: string) => ids.includes(id), toggle };
}
