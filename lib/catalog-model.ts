import { placeProduct, familyFromSlug } from "./taxonomy";

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
  // Taxonomy filters. `family` is a slug (pc-hardware); `sub` is a subcategory
  // label. Both are derived, so they work on today's rows without a migration.
  const family = firstParam(params.family).trim().toLowerCase();
  const sub = firstParam(params.sub).trim().toLowerCase();
  const store = firstParam(params.store).trim().toLowerCase();
  return products
    .filter((p) => {
      if (category && p.category.toLowerCase() !== category.toLowerCase())
        return false;
      if (family || sub) {
        const placed = placeProduct(p);
        if (family && placed.family.slug !== family) return false;
        if (sub && placed.subcategory.toLowerCase() !== sub) return false;
      }
      if (store && (p.sellers?.id || "").toLowerCase() !== store) return false;
      if (!search) return true;
      const placed = placeProduct(p);
      // Search also covers the derived family/subcategory so a buyer typing
      // "hobby electronics" or "monitors" finds listings whose stored label
      // is only "Electronics".
      return [
        p.product_name,
        p.description,
        p.category,
        p.sellers?.store_name,
        placed.family.name,
        placed.subcategory,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
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

// --- Taxonomy + store directory helpers ---------------------------------

export const familyHref = (slug: string, extra?: Record<string, string>) => {
  const params = new URLSearchParams({ family: slug, ...(extra || {}) });
  return `/products?${params}`;
};
export const subcategoryHref = (slug: string, sub: string) =>
  familyHref(slug, { sub });
export const storesHref = "/stores";

/** Resolve a `family` URL slug to a family, or null when absent/unknown. */
export const familyFromParams = (params: SearchParams) => {
  const slug = firstParam(params.family).trim().toLowerCase();
  return slug ? familyFromSlug(slug) : null;
};

export interface StoreSummary {
  seller: Seller;
  productCount: number;
  /** Family names this store actually sells in, most-stocked first. */
  families: string[];
  /** Lowest listed price, for a "from Rs. X" line. Null when none priced. */
  lowestPrice: number | null;
  /** Newest listing timestamp, for sorting a directory by activity. */
  latest: string;
  inStock: number;
  /** A few images to build a store preview strip. */
  preview: string[];
  hasContact: boolean;
}

/**
 * Build a browsable store directory from the public product list. Derived from
 * data the catalogue already reads — no extra query and no new columns.
 * Stores with no active listings do not appear.
 */
export function buildStoreDirectory(products: Product[]): StoreSummary[] {
  const byStore = new Map<string, Product[]>();
  for (const product of products) {
    if (!product.sellers) continue;
    const list = byStore.get(product.sellers.id);
    if (list) list.push(product);
    else byStore.set(product.sellers.id, [product]);
  }
  const summaries: StoreSummary[] = [];
  for (const [, items] of byStore) {
    const seller = items[0].sellers!;
    const counts = new Map<string, number>();
    for (const item of items) {
      const name = placeProduct(item).family.name;
      counts.set(name, (counts.get(name) || 0) + 1);
    }
    // A zero/!finite price is "unpriced", not a Rs. 0 product, so it must not
    // become the store's "from" figure.
    const prices = items
      .map((i) => i.retail_price)
      .filter(
        (p): p is number => typeof p === "number" && Number.isFinite(p) && p > 0,
      );
    summaries.push({
      seller,
      productCount: items.length,
      families: [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .map(([name]) => name),
      lowestPrice: prices.length ? Math.min(...prices) : null,
      latest: items.reduce(
        (newest, i) => (i.created_at > newest ? i.created_at : newest),
        items[0].created_at,
      ),
      inStock: items.filter((i) => i.quantity === null || i.quantity > 0).length,
      preview: items.flatMap((i) => i.image_urls).slice(0, 4),
      hasContact: Boolean(seller.public_whatsapp_number),
    });
  }
  return summaries;
}

/**
 * Products in the same subcategory (then family) from OTHER stores, so a buyer
 * can compare before messaging a seller. Computed from the catalogue read the
 * page already performs; no extra query.
 */
export function relatedProducts(
  product: Product,
  catalogue: Product[],
  limit = 4,
): Product[] {
  const placed = placeProduct(product);
  const candidates = catalogue.filter(
    (other) =>
      other.id !== product.id && other.seller_id !== product.seller_id,
  );
  const score = (other: Product) => {
    const otherPlaced = placeProduct(other);
    if (otherPlaced.family.slug !== placed.family.slug) return 0;
    return otherPlaced.subcategory === placed.subcategory ? 2 : 1;
  };
  return candidates
    .map((other) => ({ other, rank: score(other) }))
    .filter((entry) => entry.rank > 0)
    .sort(
      (a, b) =>
        b.rank - a.rank ||
        b.other.created_at.localeCompare(a.other.created_at) ||
        a.other.id.localeCompare(b.other.id),
    )
    .slice(0, limit)
    .map((entry) => entry.other);
}

export const STORE_SORT_OPTIONS = [
  { value: "listings", label: "Most listings" },
  { value: "name", label: "Store name (A–Z)" },
  { value: "recent", label: "Recently active" },
];

/** Search and sort the store directory. Independent of product filters. */
export function filterStores(
  stores: StoreSummary[],
  params: SearchParams,
): StoreSummary[] {
  const search = firstParam(params.q).trim().toLowerCase();
  const family = firstParam(params.family).trim().toLowerCase();
  const familyName = family ? familyFromSlug(family)?.name : null;
  const sort = firstParam(params.sort) || "listings";
  return stores
    .filter((store) => {
      if (familyName && !store.families.includes(familyName)) return false;
      if (!search) return true;
      return [store.seller.store_name, ...store.families]
        .join(" ")
        .toLowerCase()
        .includes(search);
    })
    .sort((a, b) => {
      if (sort === "name")
        return a.seller.store_name.localeCompare(b.seller.store_name);
      if (sort === "recent")
        return (
          b.latest.localeCompare(a.latest) ||
          b.productCount - a.productCount
        );
      return (
        b.productCount - a.productCount ||
        a.seller.store_name.localeCompare(b.seller.store_name)
      );
    });
}

// --- Pagination ---------------------------------------------------------

export const PAGE_SIZE = 24;

export interface Page<T> {
  items: T[];
  page: number;
  pageCount: number;
  total: number;
  from: number;
  to: number;
}

/**
 * Clamp a `page` parameter and slice the filtered list. Server-side slicing
 * keeps the HTML small: the full catalogue is several megabytes of markup,
 * which matters on a mobile connection.
 */
export function paginate<T>(
  items: T[],
  params: SearchParams,
  size = PAGE_SIZE,
): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const requested = Number.parseInt(firstParam(params.page), 10);
  const page = Math.min(
    Math.max(Number.isFinite(requested) ? requested : 1, 1),
    pageCount,
  );
  const start = (page - 1) * size;
  return {
    items: items.slice(start, start + size),
    page,
    pageCount,
    total,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + size, total),
  };
}
