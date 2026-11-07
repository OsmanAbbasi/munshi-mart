"use client";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice, type Product } from "../../lib/catalog-model";
import Icon from "./Icon";
import SaveButton from "./SaveButton";
import SellerChat from "./SellerChat";
export default function ProductActions({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addProduct, hydrated } = useCart();
  const unavailable = product.quantity === 0 || product.retail_price === null;
  return (
    <div className="product-actions">
      {!unavailable && (
        <label className="quantity-label">
          Quantity
          <input
            type="number"
            min={1}
            max={product.quantity ?? undefined}
            value={quantity}
            onChange={(event) =>
              setQuantity(
                Math.max(
                  1,
                  Math.min(
                    product.quantity ?? 999,
                    Math.floor(Number(event.target.value)) || 1,
                  ),
                ),
              )
            }
          />
        </label>
      )}
      <button
        className="btn btn-primary btn-lg"
        disabled={unavailable || !hydrated}
        onClick={() => {
          if (product.retail_price === null) return;
          addProduct(product, quantity);
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        }}
      >
        <Icon name={added ? "check" : "bag"} />
        {added
          ? "Added to your bag"
          : unavailable
            ? product.quantity === 0
              ? "Out of stock"
              : "Price on request"
            : `Add to bag · ${formatPrice(product.retail_price === null ? null : product.retail_price * quantity)}`}
      </button>
      <SaveButton product={product} />
      <SellerChat
        seller={
          product.sellers?.id === product.seller_id ? product.sellers : null
        }
        product={product}
      />
    </div>
  );
}
