"use client";
import { useCart } from "../context/CartContext";
import type { Product } from "../../lib/catalog-model";
import Icon from "./Icon";
export default function SaveButton({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const { isSaved, toggleWishlist, hydrated } = useCart();
  const saved = isSaved(product.id);
  return (
    <button
      type="button"
      className={`save-button ${compact ? "card-save" : ""} ${saved ? "is-saved" : ""}`}
      aria-label={`${saved ? "Remove" : "Save"} ${product.product_name}${saved ? " from" : " to"} wishlist`}
      aria-pressed={saved}
      disabled={!hydrated}
      data-save-product={product.id}
      onClick={() => toggleWishlist(product)}
    >
      <Icon name="heart" size={18} />
      {!compact && (saved ? "Saved to wishlist" : "Save to wishlist")}
    </button>
  );
}
