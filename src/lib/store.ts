import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Settings = Database["public"]["Tables"]["store_settings"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type ProductRow = Database["public"]["Tables"]["products"]["Row"];
export type ProductImage = Database["public"]["Tables"]["product_images"]["Row"];
export type GalleryImage = Database["public"]["Tables"]["gallery_images"]["Row"];
export type ColorOpt = { name: string; hex: string };
export type Product = Omit<ProductRow, "colors"> & {
  colors: ColorOpt[];
  product_images: ProductImage[];
  categories: Pick<Category, "id" | "name" | "slug"> | null;
};

export type SizeGuide = Record<string, { label: string; unit: string; columns: string[]; rows: string[][] }>;

const PRODUCT_SELECT = "*, product_images(*), categories(id,name,slug)";

function normalize(p: any): Product {
  return {
    ...p,
    colors: Array.isArray(p.colors) ? p.colors : [],
    product_images: [...(p.product_images ?? [])].sort((a: ProductImage, b: ProductImage) => a.sort_order - b.sort_order),
  };
}

export const settingsQuery = () =>
  queryOptions({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("id", 1).maybeSingle();
      if (error) throw error;
      return data as Settings | null;
    },
    staleTime: 60_000,
  });

export const categoriesQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").eq("visible", true).order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export const productsQuery = () =>
  queryOptions({
    queryKey: ["products", "published"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_SELECT)
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data ?? []).map(normalize).filter((p) => !(p.hidden_when_oos && p.stock_status === "out_of_stock"));
    },
    staleTime: 30_000,
  });

export const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("slug", slug).eq("published", true).maybeSingle();
      if (error) throw error;
      return data ? normalize(data) : null;
    },
  });

export const galleryQuery = () =>
  queryOptions({
    queryKey: ["gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

export function mainImage(p: Pick<Product, "product_images">): string | undefined {
  return p.product_images[0]?.url;
}

export function stockLabel(s: string): string {
  return s === "out_of_stock" ? "Out of stock" : s === "low_stock" ? "Low stock" : "In stock";
}
