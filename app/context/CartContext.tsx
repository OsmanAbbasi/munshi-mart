"use client";
import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from "react";
import type { Product } from "../../lib/catalog-model";
import {
  CART_KEY,
  WISHLIST_KEY,
  clampQuantity,
  parseSavedItems,
  reconcileSaved,
  savedProduct,
  shoppingItems,
  type SavedItem,
  type ShoppingItem,
} from "../../lib/shopping";
export type CartItem = SavedItem;

interface State {
  items: SavedItem[];
  wishlist: SavedItem[];
  isOpen: boolean;
  hydrated: boolean;
  writableCart: boolean;
  writableWishlist: boolean;
  storageError: string | null;
  catalog: Record<string, Product | null>;
  status: "loading" | "ready" | "error";
  error: string | null;
  revision: number;
  quantityNote: string | null;
}
type Action =
  | {
      type: "HYDRATE";
      items: SavedItem[];
      wishlist: SavedItem[];
      writableCart: boolean;
      writableWishlist: boolean;
      storageError: string | null;
    }
  | { type: "ADD_ITEM"; item: SavedItem }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "UPDATE_QTY"; id: string; qty: number }
  | { type: "TOGGLE_WISHLIST"; item: SavedItem }
  | { type: "REMOVE_WISHLIST"; id: string }
  | {
      type:
        | "CLEAR_CART"
        | "TOGGLE_CART"
        | "OPEN_CART"
        | "CLOSE_CART"
        | "REFRESH"
        | "CATALOG_LOADING";
    }
  | { type: "CATALOG_READY"; ids: string[]; products: Product[] }
  | { type: "CATALOG_ERROR"; error: string }
  | { type: "STORAGE_ERROR" };

const initial: State = {
  items: [],
  wishlist: [],
  isOpen: false,
  hydrated: false,
  writableCart: false,
  writableWishlist: false,
  storageError: null,
  catalog: {},
  status: "loading",
  error: null,
  revision: 0,
  quantityNote: null,
};
function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "HYDRATE":
      return {
        ...state,
        ...action,
        hydrated: true,
        status: "loading",
        revision: state.revision + 1,
      };
    case "ADD_ITEM": {
      const existing = state.items.find((i) => i.id === action.item.id);
      const current = state.catalog[action.item.id];
      if (action.item.id in state.catalog && !current)
        return {
          ...state,
          quantityNote:
            "That product is no longer available. Refresh the catalog.",
        };
      const stock = current ? current.quantity : action.item.quantity;
      const requested = (existing?.cartQty || 0) + action.item.cartQty;
      const qty = clampQuantity(requested, stock);
      if (!qty)
        return { ...state, quantityNote: "This product is out of stock." };
      const item = {
        ...(current ? savedProduct(current) : action.item),
        cartQty: qty,
      };
      return {
        ...state,
        isOpen: true,
        items: existing
          ? state.items.map((i) => (i.id === item.id ? item : i))
          : [...state.items, item],
        quantityNote:
          requested > qty ? "Quantity limited to the current stock." : null,
      };
    }
    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.id !== action.id) };
    case "UPDATE_QTY": {
      if (action.qty <= 0)
        return {
          ...state,
          items: state.items.filter((i) => i.id !== action.id),
        };
      const p = state.catalog[action.id];
      if (state.status !== "ready" || !p || p.quantity === 0) return state;
      const qty = Math.max(1, clampQuantity(action.qty, p.quantity));
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, cartQty: qty } : i,
        ),
        quantityNote:
          qty < action.qty ? "Quantity limited to the current stock." : null,
      };
    }
    case "TOGGLE_WISHLIST":
      return {
        ...state,
        wishlist: state.wishlist.some((i) => i.id === action.item.id)
          ? state.wishlist.filter((i) => i.id !== action.item.id)
          : [...state.wishlist, action.item],
      };
    case "REMOVE_WISHLIST":
      return {
        ...state,
        wishlist: state.wishlist.filter((i) => i.id !== action.id),
      };
    case "CLEAR_CART":
      return { ...state, items: [] };
    case "TOGGLE_CART":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN_CART":
      return { ...state, isOpen: true };
    case "CLOSE_CART":
      return { ...state, isOpen: false };
    case "REFRESH":
      return {
        ...state,
        revision: state.revision + 1,
        status: "loading",
        error: null,
      };
    case "CATALOG_LOADING":
      return { ...state, status: "loading", error: null };
    case "CATALOG_READY": {
      const catalog = Object.fromEntries(
        action.ids.map((id) => [
          id,
          action.products.find((p) => p.id === id) || null,
        ]),
      );
      const items = reconcileSaved(state.items, action.products);
      return {
        ...state,
        catalog,
        items,
        wishlist: reconcileSaved(state.wishlist, action.products),
        status: "ready",
        error: null,
        quantityNote: items.some(
          (item, i) => item.cartQty !== state.items[i]?.cartQty,
        )
          ? "Some quantities were reduced to match current stock. Please review your cart."
          : state.quantityNote,
      };
    }
    case "CATALOG_ERROR":
      return { ...state, status: "error", error: action.error };
    case "STORAGE_ERROR":
      return {
        ...state,
        storageError:
          "Device storage is unavailable or full. Changes may not survive a reload.",
      };
  }
}
interface CartContextType {
  items: ShoppingItem[];
  wishlist: ShoppingItem[];
  isOpen: boolean;
  hydrated: boolean;
  totalItems: number;
  totalPrice: number;
  wishlistCount: number;
  catalogStatus: State["status"];
  catalogError: string | null;
  storageError: string | null;
  quantityNote: string | null;
  addItem: (item: CartItem) => void;
  addProduct: (product: Product, quantity?: number) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleWishlist: (product: Product) => void;
  removeWishlist: (id: string) => void;
  isSaved: (id: string) => boolean;
  retryCatalog: () => void;
}
const CartContext = createContext<CartContextType | null>(null);
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  useEffect(() => {
    const hydrate = () => {
      let items: SavedItem[] = [],
        wishlist: SavedItem[] = [],
        writableCart = true,
        writableWishlist = true;
      try {
        items = parseSavedItems(localStorage.getItem(CART_KEY));
      } catch {
        writableCart = false;
      }
      try {
        wishlist = parseSavedItems(localStorage.getItem(WISHLIST_KEY));
      } catch {
        writableWishlist = false;
      }
      dispatch({
        type: "HYDRATE",
        items,
        wishlist,
        writableCart,
        writableWishlist,
        storageError:
          writableCart && writableWishlist
            ? null
            : "A saved list could not be read. Its stored contents have been preserved; device storage may be unavailable.",
      });
    };
    hydrate();
    const storage = (event: StorageEvent) => {
      if (
        event.key === CART_KEY ||
        event.key === WISHLIST_KEY ||
        event.key === null
      )
        hydrate();
    };
    const focus = () => dispatch({ type: "REFRESH" });
    window.addEventListener("storage", storage);
    window.addEventListener("focus", focus);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("focus", focus);
    };
  }, []);
  useEffect(() => {
    if (!state.hydrated || !state.writableCart) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(state.items));
    } catch {
      dispatch({ type: "STORAGE_ERROR" });
    }
  }, [state.items, state.hydrated, state.writableCart]);
  useEffect(() => {
    if (!state.hydrated || !state.writableWishlist) return;
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(state.wishlist));
    } catch {
      dispatch({ type: "STORAGE_ERROR" });
    }
  }, [state.wishlist, state.hydrated, state.writableWishlist]);
  const idsKey = [
    ...new Set([...state.items, ...state.wishlist].map((i) => i.id)),
  ]
    .sort()
    .join(",");
  useEffect(() => {
    if (!state.hydrated) return;
    const controller = new AbortController();
    const ids = idsKey ? idsKey.split(",") : [];
    async function refresh() {
      dispatch({ type: "CATALOG_LOADING" });
      try {
        const products: Product[] = [];
        for (let offset = 0; offset < ids.length; offset += 100) {
          const response = await fetch("/api/catalog/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            signal: controller.signal,
            body: JSON.stringify({ ids: ids.slice(offset, offset + 100) }),
          });
          const result = await response.json();
          if (!response.ok || result.error || !Array.isArray(result.data))
            throw new Error("Could not refresh saved products. Please retry.");
          products.push(...result.data);
        }
        if (!controller.signal.aborted)
          dispatch({ type: "CATALOG_READY", ids, products });
      } catch {
        if (!controller.signal.aborted)
          dispatch({
            type: "CATALOG_ERROR",
            error:
              "Could not refresh saved products. Your saved lists are intact. Retry before ordering.",
          });
      }
    }
    void refresh();
    return () => controller.abort();
  }, [idsKey, state.hydrated, state.revision]);
  const items = shoppingItems(state.items, state.catalog, state.status);
  const wishlist = shoppingItems(state.wishlist, state.catalog, state.status);
  return (
    <CartContext.Provider
      value={{
        items,
        wishlist,
        hydrated: state.hydrated,
        isOpen: state.isOpen,
        totalItems: items.reduce((sum, i) => sum + i.cartQty, 0),
        totalPrice: items
          .filter((i) => i.availability === "available")
          .reduce(
            (sum, i) => sum + (i.product?.retail_price ?? 0) * i.cartQty,
            0,
          ),
        wishlistCount: wishlist.length,
        catalogStatus: state.status,
        catalogError: state.error,
        storageError: state.storageError,
        quantityNote: state.quantityNote,
        addItem: (item) => dispatch({ type: "ADD_ITEM", item }),
        addProduct: (product, quantity = 1) =>
          dispatch({ type: "ADD_ITEM", item: savedProduct(product, quantity) }),
        removeItem: (id) => dispatch({ type: "REMOVE_ITEM", id }),
        updateQty: (id, qty) => dispatch({ type: "UPDATE_QTY", id, qty }),
        clearCart: () => dispatch({ type: "CLEAR_CART" }),
        toggleCart: () => dispatch({ type: "TOGGLE_CART" }),
        openCart: () => dispatch({ type: "OPEN_CART" }),
        closeCart: () => dispatch({ type: "CLOSE_CART" }),
        toggleWishlist: (product) =>
          dispatch({ type: "TOGGLE_WISHLIST", item: savedProduct(product) }),
        removeWishlist: (id) => dispatch({ type: "REMOVE_WISHLIST", id }),
        isSaved: (id) => state.wishlist.some((i) => i.id === id),
        retryCatalog: () => dispatch({ type: "REFRESH" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
