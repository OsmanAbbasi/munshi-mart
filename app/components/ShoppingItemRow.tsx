"use client";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../../lib/catalog-model";
import type { ShoppingItem } from "../../lib/shopping";
import ProductImage from "./ProductImage";
export default function ShoppingItemRow({
  item,
  wishlist = false,
}: {
  item: ShoppingItem;
  wishlist?: boolean;
}) {
  const { updateQty, removeItem, removeWishlist, addProduct } = useCart();
  const current = item.product;
  const available = item.availability === "available";
  return (
    <article
      className={`shopping-item ${available ? "" : "shopping-item-unavailable"}`}
      data-saved-id={item.id}
      data-availability={item.availability}
    >
      <Link className="shopping-item-image" href={`/products/${item.id}`}>
        <ProductImage
          src={current?.image_urls[0] || item.image_urls?.[0]}
          alt={current?.product_name || item.product_name}
        />
      </Link>
      <div className="shopping-item-copy">
        <Link className="shopping-item-name" href={`/products/${item.id}`}>
          {current?.product_name || item.product_name}
        </Link>
        <p>{formatPrice(current?.retail_price ?? item.retail_price)}</p>
        <p className="item-availability">
          {item.availability === "checking"
            ? "Checking availability…"
            : item.availability === "error"
              ? "Catalog check failed — retry before ordering"
              : !available
                ? "Unavailable — excluded from checkout"
                : current?.quantity === null
                  ? "Stock to be confirmed with seller"
                  : `${current?.quantity} in stock`}
        </p>
        {wishlist ? (
          <button
            className="btn btn-outline"
            disabled={!available}
            onClick={() => current && addProduct(current)}
          >
            Add to cart
          </button>
        ) : (
          <label className="shopping-quantity">
            Quantity
            <input
              type="number"
              min={1}
              max={current?.quantity ?? undefined}
              value={item.cartQty}
              disabled={!available}
              aria-label={`Quantity for ${item.product_name}`}
              onChange={(event) =>
                updateQty(item.id, Number(event.target.value) || 1)
              }
            />
          </label>
        )}
        <button
          className="remove-saved"
          aria-label={`Remove ${item.product_name} from ${wishlist ? "wishlist" : "cart"}`}
          onClick={() =>
            wishlist ? removeWishlist(item.id) : removeItem(item.id)
          }
        >
          Remove
        </button>
      </div>
    </article>
  );
}
