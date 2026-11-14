import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cache } from "react";
import {
  isPublicId,
  isPublicProduct,
  normalizeCategory,
  type Product,
  type Seller,
  approvedPublicContact,
  normalizeWhatsAppNumber,
} from "./catalog-model";

// Explicit public projection: approved seller contact only; no buyer data or WhatsApp JIDs,
// wholesale pricing, language settings, or privileged credentials.
const PRODUCT_FIELDS =
  "id,seller_id,product_name,retail_price,price_numeric,quantity,description,category,image_urls,created_at,status,sellers(id,store_name,contact_number)";
export const fixtureMode = () => process.env.MUNSHI_CATALOG_FIXTURES === "1";

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Catalog is not configured");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// Some legacy rows stored a WhatsApp internal media reference instead of an
// uploaded public URL. Those hosts never serve the image to a browser, so a
// card would show a broken frame; treat them as "no image" and let the normal
// missing-image state show. This hides nothing real: the bytes are not public.
const UNSERVABLE_IMAGE_HOSTS = [
  "web.whatsapp.com",
  "mmg.whatsapp.net",
  "media.whatsapp.net",
];
function isUnservableImage(url: string): boolean {
  try {
    return UNSERVABLE_IMAGE_HOSTS.includes(new URL(url).hostname.toLowerCase());
  } catch {
    return true;
  }
}

type Row = Record<string, unknown>;
function sellerFromRow(row: Row | null): Seller | null {
  if (!row || typeof row.id !== "string" || !isPublicId(row.id)) return null;
  // The owner confirmed contact_number is intended for public customer inquiries.
  // Fixture contacts remain development-only. Never use whatsapp_number or a JID.
  const contact = fixtureMode()
    ? process.env.NODE_ENV === "development"
      ? approvedPublicContact(row)
      : null
    : normalizeWhatsAppNumber(row.contact_number);
  return {
    id: row.id,
    ...(contact ? { public_whatsapp_number: contact } : {}),
    store_name:
      typeof row.store_name === "string" && row.store_name.trim()
        ? row.store_name.trim()
        : "Independent store",
  };
}
function productFromRow(row: Row): Product {
  const rawPrice = row.price_numeric ?? row.retail_price;
  const price =
    rawPrice === null || rawPrice === ""
      ? NaN
      : Number(String(rawPrice).replace(/,/g, ""));
  const quantity =
    row.quantity == null || row.quantity === "" ? NaN : Number(row.quantity);
  const related = Array.isArray(row.sellers) ? row.sellers[0] : row.sellers;
  return {
    id: String(row.id),
    seller_id: String(row.seller_id),
    product_name: String(row.product_name || "Untitled product"),
    retail_price: Number.isFinite(price) && price >= 0 ? price : null,
    quantity:
      Number.isFinite(quantity) && quantity >= 0 ? Math.floor(quantity) : null,
    description: typeof row.description === "string" ? row.description : "",
    category: normalizeCategory(row.category),
    image_urls: Array.isArray(row.image_urls)
      ? row.image_urls.filter(
          (url): url is string =>
            typeof url === "string" &&
            ((fixtureMode() && url.startsWith("/fixtures/")) ||
              (/^https:\/\//i.test(url) && !isUnservableImage(url))),
        )
      : [],
    created_at: typeof row.created_at === "string" ? row.created_at : "",
    sellers: sellerFromRow(related as Row | null),
  };
}

export type CatalogResult<T> = { data: T; error: string | null };
const catalogError =
  "We couldn’t load the catalog. Please try again in a moment.";

// Resolve just the saved IDs, rather than downloading the entire marketplace.
export async function getProductsByIds(
  ids: string[],
): Promise<CatalogResult<Product[]>> {
  if (!ids.length) return { data: [], error: null };
  if (ids.length > 100 || ids.some((id) => !isPublicId(id)))
    return { data: [], error: "Invalid saved product IDs." };
  try {
    if (fixtureMode()) {
      const result = await getProducts();
      return {
        data: result.data.filter((p) => ids.includes(p.id)),
        error: result.error,
      };
    }
    const { data, error } = await client()
      .from("products")
      .select(PRODUCT_FIELDS)
      .eq("status", "active")
      .in("id", ids)
      .abortSignal(AbortSignal.timeout(8000));
    if (error) throw new Error("Saved products request failed");
    return {
      data: (data || [])
        .filter((row) => isPublicProduct(row.status))
        .map(productFromRow),
      error: null,
    };
  } catch {
    return { data: [], error: catalogError };
  }
}

export const getProducts = cache(
  async (sellerId?: string): Promise<CatalogResult<Product[]>> => {
    if (sellerId && !isPublicId(sellerId)) return { data: [], error: null };
    try {
      let rows: Row[] = [];
      if (fixtureMode()) {
        const { fixtureProducts, fixtureHiddenProducts } =
          await import("./fixtures");
        rows = [...fixtureProducts, ...fixtureHiddenProducts].filter(
          (p) => !sellerId || p.seller_id === sellerId,
        );
      } else {
        const db = client();
        // Page through the PostgREST row cap rather than silently dropping listings.
        for (let offset = 0; ; offset += 500) {
          let query = db
            .from("products")
            .select(PRODUCT_FIELDS)
            .eq("status", "active")
            .order("id")
            .range(offset, offset + 499);
          if (sellerId) query = query.eq("seller_id", sellerId);
          const { data, error } = await query.abortSignal(
            AbortSignal.timeout(8000),
          );
          if (error) throw new Error("Catalog request failed");
          rows.push(...(data || []));
          if (!data || data.length < 500) break;
        }
      }
      return {
        data: rows
          .filter((row) => isPublicProduct(row.status))
          .map(productFromRow),
        error: null,
      };
    } catch {
      return { data: [], error: catalogError };
    }
  },
);

export const getSeller = cache(
  async (id: string): Promise<CatalogResult<Seller | null>> => {
    if (!isPublicId(id)) return { data: null, error: null };
    try {
      if (fixtureMode()) {
        const { fixtureSellers } = await import("./fixtures");
        return {
          data: sellerFromRow(fixtureSellers.find((s) => s.id === id) || null),
          error: null,
        };
      }
      const { data, error } = await client()
        .from("sellers")
        .select("id,store_name,contact_number")
        .eq("id", id)
        .abortSignal(AbortSignal.timeout(8000))
        .maybeSingle();
      if (error) throw new Error("Store request failed");
      return { data: sellerFromRow(data), error: null };
    } catch {
      return { data: null, error: catalogError };
    }
  },
);

export const getProduct = cache(
  async (id: string): Promise<CatalogResult<Product | null>> => {
    if (!isPublicId(id)) return { data: null, error: null };
    try {
      if (fixtureMode()) {
        const result = await getProducts();
        return {
          data: result.data.find((p) => p.id === id) || null,
          error: result.error,
        };
      }
      const { data, error } = await client()
        .from("products")
        .select(PRODUCT_FIELDS)
        .eq("id", id)
        .eq("status", "active")
        .abortSignal(AbortSignal.timeout(8000))
        .maybeSingle();
      if (error) throw new Error("Product request failed");
      return {
        data:
          data && isPublicProduct(data.status) ? productFromRow(data) : null,
        error: null,
      };
    } catch {
      return { data: null, error: catalogError };
    }
  },
);
