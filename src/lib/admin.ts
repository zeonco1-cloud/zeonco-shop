import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export function validateImage(file: File): string | null {
  if (!TYPES.includes(file.type)) return "Only JPG, PNG, WebP or AVIF images are allowed.";
  if (file.size > MAX_BYTES) return "Images must be 5 MB or smaller.";
  return null;
}

/** Upload an image to storage and return a long-lived URL. Only owners can upload (enforced by storage policies). */
export async function uploadImage(file: File, folder: string): Promise<string> {
  const err = validateImage(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;
  const { data, error: sErr } = await supabase.storage.from("media").createSignedUrl(path, TEN_YEARS);
  if (sErr || !data) throw sErr ?? new Error("Could not create image link");
  return data.signedUrl;
}

/** Best-effort removal of an uploaded file given its stored URL. */
export async function removeUploaded(url: string) {
  const m = url.match(/\/object\/sign\/media\/([^?]+)/);
  if (m) await supabase.storage.from("media").remove([decodeURIComponent(m[1])]);
}

export async function checkOwner(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_owner");
  return !error && data === true;
}
