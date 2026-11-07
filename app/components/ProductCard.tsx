"use client";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { formatPrice, sellerHref, type Product } from "../../lib/catalog-model";
import ProductImage from "./ProductImage";
import Icon from "./Icon";
import SaveButton from "./SaveButton";
export type { Product } from "../../lib/catalog-model";
export default function ProductCard({
  product,
}: {
  product: Product;
  animationDelay?: number;
}) {
  const { addProduct, hydrated } = useCart();
  const [adding, setAdding] = useState(false);
  const unavailable = product.quantity === 0 || product.retail_price === null;
  return (
    <article className="product-card" data-product-id={product.id}>
      <SaveButton product={product} compact />
      <Link
        href={`/products/${product.id}`}
        className="product-image-link"
        aria-label={`View ${product.product_name}`}
      >
        <ProductImage src={product.image_urls[0]} alt={product.product_name} />
        <span className="product-category">{product.category}</span>
        {product.quantity === 0 && (
          <span className="stock-overlay">Sold out</span>
        )}
      </Link>
      <div className="product-card-body">
        <div className="product-seller">
          {product.sellers ? (
            <Link href={sellerHref(product.sellers.id)}>
              <Icon name="store" size={13} />
              {product.sellers.store_name}
            </Link>
          ) : (
            <span>Independent seller</span>
          )}
        </div>
        <h3>
          <Link href={`/products/${product.id}`}>{product.product_name}</Link>
        </h3>
        <div className="product-card-bottom">
          <div>
            <p className="product-price">{formatPrice(product.retail_price)}</p>
            <span className="stock-note">
              {product.quantity === null
                ? "Ask about availability"
                : product.quantity === 0
                  ? "Currently unavailable"
                  : product.quantity <= 5
                    ? `Only ${product.quantity} left`
                    : "In stock"}
            </span>
          </div>
          <button
            className="add-to-bag"
            disabled={unavailable || !hydrated}
            aria-label={`Add ${product.product_name} to cart`}
            onClick={() => {
              if (product.retail_price === null) return;
              addProduct(product);
              setAdding(true);
              setTimeout(() => setAdding(false), 1200);
            }}
          >
            <Icon name={adding ? "check" : "plus"} size={20} />
          </button>
        </div>
      </div>
    </article>
  );
}
