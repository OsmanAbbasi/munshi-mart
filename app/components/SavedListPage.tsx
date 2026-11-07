"use client";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { formatPrice, sellerHref } from "../../lib/catalog-model";
import { groupCart } from "../../lib/shopping";
import SavedListsStatus from "./SavedListsStatus";
import ShoppingItemRow from "./ShoppingItemRow";
import SellerCheckout from "./SellerCheckout";
import Icon from "./Icon";

export default function SavedListPage({
  wishlist = false,
}: {
  wishlist?: boolean;
}) {
  const state = useCart();
  const items = wishlist ? state.wishlist : state.items;
  const groups = groupCart(items);
  return (
    <div className="container saved-list-page">
      <Link className="breadcrumb" href="/products">
        ← Continue shopping
      </Link>
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR FINDS, KEPT CLOSE</p>
          <h1>{wishlist ? "Your wishlist" : "Your Cart"}</h1>
          <p className="device-note">
            Saved on this device, in this browser. No sign-in or cross-device
            sync.
          </p>
        </div>
        <Link className="text-link" href={wishlist ? "/cart" : "/wishlist"}>
          <Icon name={wishlist ? "bag" : "heart"} />
          {wishlist ? "Open cart" : "Open wishlist"}
        </Link>
      </div>
      <SavedListsStatus />
      {state.hydrated && !items.length ? (
        <div className="empty-state">
          <Icon name={wishlist ? "heart" : "bag"} size={38} />
          <h2>{wishlist ? "Save something you love" : "Your cart is empty"}</h2>
          <p>
            {wishlist
              ? "Use the heart on a product to keep it here."
              : "Discover products from independent stores and add your favourites."}
          </p>
          <Link className="btn btn-primary" href="/products">
            Browse products
          </Link>
        </div>
      ) : wishlist ? (
        <div className="wishlist-items">
          {items.map((item) => (
            <ShoppingItemRow key={item.id} item={item} wishlist />
          ))}
        </div>
      ) : (
        <>
          <div className="cart-toolbar">
            <p>
              {state.totalItems} item{state.totalItems !== 1 ? "s" : ""} saved ·
              Available subtotal:{" "}
              <strong>{formatPrice(state.totalPrice)}</strong>
            </p>
            <button className="remove-saved" onClick={state.clearCart}>
              Clear cart
            </button>
            <button className="btn btn-outline" onClick={state.retryCatalog}>
              Refresh availability
            </button>
          </div>
          <div className="seller-cart-groups">
            {groups.map((group) => (
              <section
                className="seller-cart-group"
                key={group.sellerId || "unknown"}
                data-cart-seller={group.sellerId || "unknown"}
              >
                <div className="seller-group-heading">
                  <Icon name="store" />
                  <h2>
                    {group.sellerId ? (
                      <Link href={sellerHref(group.sellerId)}>
                        {group.name}
                      </Link>
                    ) : (
                      group.name
                    )}
                  </h2>
                </div>
                <div className="seller-group-layout">
                  <div>
                    {group.items.map((item) => (
                      <ShoppingItemRow key={item.id} item={item} />
                    ))}
                  </div>
                  <SellerCheckout
                    key={JSON.stringify(
                      group.items.map((item) => [
                        item.id,
                        item.cartQty,
                        item.availability,
                        item.product?.retail_price,
                        item.product?.sellers?.public_whatsapp_number,
                      ]),
                    )}
                    sellerId={group.sellerId}
                    items={group.items}
                  />
                </div>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
