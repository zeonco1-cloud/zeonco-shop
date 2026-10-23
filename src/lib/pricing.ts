/** Format a number as Indian Rupees, e.g. ₹1,499 (no decimals when whole). */
export function formatINR(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(Number(value))) return "";
  const n = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/** Discount percent (rounded down) or null when there is no valid discount. */
export function discountPercent(original: number | null | undefined, price: number | null | undefined): number | null {
  const o = Number(original);
  const p = Number(price);
  if (!original || !Number.isFinite(o) || !Number.isFinite(p) || o <= 0 || p < 0 || p >= o) return null;
  const pct = Math.floor(((o - p) / o) * 100);
  return pct >= 1 ? pct : null;
}

/** Normalise a WhatsApp number to digits only (with country code). Returns null when invalid. */
export function normalizeWhatsApp(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "").replace(/^00/, "");
  if (digits.length < 10 || digits.length > 15) return null;
  if (digits.startsWith("0")) return null;
  return digits;
}

export function whatsappEnquiryUrl(number: string | null | undefined, productName: string, productUrl: string): string | null {
  const n = normalizeWhatsApp(number);
  if (!n) return null;
  const text = `Hi ZEON.CO, I'm interested in ${productName}. ${productUrl}`;
  return `https://wa.me/${n}?text=${encodeURIComponent(text)}`;
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
