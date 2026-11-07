export interface Seller {
  id: string;
  store_name: string;
  // Only supplied by a verified public-contact adapter, never inferred from a JID.
  public_whatsapp_number?: string;
}

export function normalizeWhatsAppNumber(value: unknown): string | null {
  if (typeof value !== "string" || !/^[+\d\s().-]+$/.test(value.trim()))
    return null;
  let number = value.trim().replace(/[\s().-]/g, "");
  if (number.startsWith("00")) number = number.slice(2);
  if (number.startsWith("+")) number = number.slice(1);
  // Explicit international numbers only; no guessed country code or local leading zero.
  return /^[1-9]\d{7,14}$/.test(number) ? number : null;
}

export function approvedPublicContact(
  row: Record<string, unknown>,
): string | null {
  return row.public_whatsapp_inquiries_enabled === true
    ? normalizeWhatsAppNumber(row.public_whatsapp_number)
    : null;
}

export interface Product {
  id: string;
  seller_id: string;
  product_name: string;
  retail_price: number | null;
  quantity: number | null;
  description: string;
  image_urls: string[];
  category: string;
  created_at: string;
  sellers: Seller | null;
}

export const CATEGORIES = [
  "Fashion",
  "Electronics",
  "Home & Living",
  "Groceries",
  "Beauty",
  "Toys",
  "Sports",
  "Books",
  "Other",
];
export const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
];
export type SearchParams = Record<string, string | string[] | undefined>;
export const firstParam = (value: string | string[] | undefined) =>
  (Array.isArray(value) ? value[0] : value) || "";

export function normalizeCategory(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  return (
    CATEGORIES.find(
      (category) => category.toLowerCase() === text.toLowerCase(),
    ) ||
    text ||
    "Other"
  );
}

export function categoryOptions(products: Product[]): string[] {
  return [...new Set([...CATEGORIES, ...products.map((p) => p.category)])];
}

export function filterProducts(
  products: Product[],
  params: SearchParams,
): Product[] {
  const search = firstParam(params.search).trim().toLowerCase();
  const category = firstParam(params.category);
  const sort = firstParam(params.sort);
  return products
    .filter(
      (p) =>
        (!category || p.category.toLowerCase() === category.toLowerCase()) &&
        (!search ||
          [p.product_name, p.description, p.category, p.sellers?.store_name]
            .join(" ")
            .toLowerCase()
            .includes(search)),
    )
    .sort((a, b) => {
      if (
        sort === "price-asc" ||
        sort === "price-desc" ||
        sort.startsWith("retail_price:")
      ) {
        if (a.retail_price === null)
          return b.retail_price === null ? a.id.localeCompare(b.id) : 1;
        if (b.retail_price === null) return -1;
        const direction =
          sort === "price-desc" || sort === "retail_price:desc" ? -1 : 1;
        return (
          (a.retail_price - b.retail_price) * direction ||
          a.id.localeCompare(b.id)
        );
      }
      return (
        b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id)
      );
    });
}

// Only the known active value is public. Null/unknown legacy statuses fail closed,
// matching the bot's existing active-only search semantics.
export const isPublicProduct = (status: unknown) => status === "active";
export const isPublicId = (id: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
export const sellerHref = (id: string) => `/seller/${encodeURIComponent(id)}`;
export const formatPrice = (price: number | null) =>
  price === null ? "Price on request" : `Rs. ${price.toLocaleString("en-PK")}`;
