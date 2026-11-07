import {
  isPublicId,
  normalizeWhatsAppNumber,
  type Product,
  type Seller,
} from "./catalog-model";

export const CART_KEY = "munshi-cart";
export const WISHLIST_KEY = "munshi-wishlist";
export const MAX_QUANTITY = 99999;
export interface SavedItem {
  id: string;
  product_name: string;
  retail_price: number | null;
  image_urls?: string[];
  quantity: number | null;
  seller_id?: string;
  sellers?: { id?: string; store_name?: string };
  cartQty: number;
}
export type SavedStatus = "checking" | "available" | "unavailable" | "error";
export interface ShoppingItem extends SavedItem {
  availability: SavedStatus;
  product: Product | null;
}

export function savedProduct(product: Product, cartQty = 1): SavedItem {
  return {
    id: product.id,
    product_name: product.product_name,
    retail_price: product.retail_price,
    image_urls: product.image_urls,
    quantity: product.quantity,
    seller_id: product.seller_id,
    sellers: product.sellers
      ? { id: product.sellers.id, store_name: product.sellers.store_name }
      : undefined,
    cartQty,
  };
}

// Accept the original array/snapshot shape and discard untrusted extra fields,
// including legacy seller phone/JID fields. Product IDs are authoritative on refresh.
export function parseSavedItems(value: string | null): SavedItem[] {
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error("Invalid saved list");
  const unique = new Map<string, SavedItem>();
  for (const raw of parsed) {
    if (!raw || typeof raw !== "object" || !isPublicId(String(raw.id)))
      continue;
    const qty = Number(raw.cartQty ?? 1);
    if (!Number.isFinite(qty) || qty < 1) continue;
    const price = Number(raw.retail_price);
    const stock = Number(raw.quantity);
    const seller = raw.sellers;
    unique.set(raw.id, {
      id: raw.id,
      product_name:
        typeof raw.product_name === "string"
          ? raw.product_name
          : "Saved product",
      retail_price:
        raw.retail_price != null && Number.isFinite(price) && price >= 0
          ? price
          : null,
      image_urls: Array.isArray(raw.image_urls)
        ? raw.image_urls.filter(
            (url: unknown) =>
              typeof url === "string" &&
              (/^https:\/\//.test(url) || url.startsWith("/fixtures/")),
          )
        : [],
      // Keep canonical snapshot key order stable across storage events and refreshes.
      quantity:
        raw.quantity != null && Number.isInteger(stock) && stock >= 0
          ? stock
          : null,
      seller_id:
        typeof raw.seller_id === "string" && isPublicId(raw.seller_id)
          ? raw.seller_id
          : typeof seller?.id === "string" && isPublicId(seller.id)
            ? seller.id
            : undefined,
      sellers:
        seller && typeof seller.store_name === "string"
          ? {
              id:
                typeof seller.id === "string" && isPublicId(seller.id)
                  ? seller.id
                  : undefined,
              store_name: seller.store_name,
            }
          : undefined,
      cartQty: Math.min(MAX_QUANTITY, Math.floor(qty)),
    });
  }
  return [...unique.values()];
}

export function clampQuantity(requested: number, stock: number | null): number {
  return Math.max(
    0,
    Math.min(
      Number.isFinite(requested) ? Math.floor(requested) : 1,
      stock ?? MAX_QUANTITY,
      MAX_QUANTITY,
    ),
  );
}

export function reconcileSaved(
  items: SavedItem[],
  products: Product[],
): SavedItem[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => {
    const p = byId.get(item.id);
    if (!p) return item; // Keep unavailable saved items until the buyer removes them.
    const qty =
      p.quantity === 0
        ? item.cartQty
        : Math.max(1, clampQuantity(item.cartQty, p.quantity));
    return savedProduct(p, qty);
  });
}

export function shoppingItems(
  items: SavedItem[],
  catalog: Record<string, Product | null>,
  status: "loading" | "ready" | "error",
): ShoppingItem[] {
  return items.map((item) => {
    const p = catalog[item.id] ?? null;
    const availability: SavedStatus =
      status === "error"
        ? "error"
        : status === "loading" || !(item.id in catalog)
          ? "checking"
          : !p ||
              p.quantity === 0 ||
              p.retail_price === null ||
              !p.sellers ||
              p.sellers.id !== p.seller_id
            ? "unavailable"
            : "available";
    return { ...item, availability, product: p };
  });
}

export function groupCart(items: ShoppingItem[]) {
  const groups = new Map<
    string,
    { sellerId: string | null; name: string; items: ShoppingItem[] }
  >();
  for (const item of items) {
    // Current catalog relation wins over saved seller snapshots.
    const sellerId = item.product?.seller_id ?? item.seller_id ?? null;
    const key = sellerId || "unknown";
    const group = groups.get(key) || {
      sellerId,
      name:
        item.product?.sellers?.store_name ||
        item.sellers?.store_name ||
        "Seller unavailable",
      items: [],
    };
    group.items.push(item);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function checkoutMessage(
  seller: Seller,
  items: { product: Product; quantity: number }[],
  origin: string,
): string {
  const base = new URL(origin);
  if (!["http:", "https:"].includes(base.protocol))
    throw new Error("Invalid storefront origin");
  return `Hello ${seller.store_name}! I’d like to order from Munshi Mart:\n\n${items.map(({ product, quantity }) => `${product.product_name} × ${quantity}\n${new URL(`/products/${encodeURIComponent(product.id)}`, base.origin).href}`).join("\n\n")}\n\nPlease confirm availability, payment and delivery details. This message is an inquiry, not a confirmed order.`;
}

export function checkoutLink(
  seller: Seller,
  items: { product: Product; quantity: number }[],
  origin: string,
): string | null {
  const number = normalizeWhatsAppNumber(seller.public_whatsapp_number);
  if (
    !number ||
    !items.length ||
    items.some(({ product }) => product.seller_id !== seller.id)
  )
    return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(checkoutMessage(seller, items, origin))}`;
}
