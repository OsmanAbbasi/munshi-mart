"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../../lib/catalog-model";
import ShoppingItemRow from "./ShoppingItemRow";
import SavedListsStatus from "./SavedListsStatus";
import Icon from "./Icon";

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalPrice, totalItems } = useCart();
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // A modal must also isolate the background from keyboard and assistive technology.
    const background = new Map<HTMLElement, boolean>();
    const currentDialog = dialog.current;
    if (currentDialog?.parentElement) {
      for (const element of currentDialog.parentElement.children) {
        if (
          !(element instanceof HTMLElement) ||
          element === currentDialog ||
          element.classList.contains("cart-backdrop") ||
          ["SCRIPT", "STYLE"].includes(element.tagName)
        )
          continue;
        background.set(element, element.inert);
        element.inert = true;
      }
    }
    dialog.current
      ?.querySelector<HTMLButtonElement>("#cart-close-btn")
      ?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCart();
      if (event.key === "Tab") {
        const controls = dialog.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled]), input:not([disabled])",
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = previousOverflow;
      for (const [element, wasInert] of background) element.inert = wasInert;
      if (previous?.isConnected && previous !== document.body) previous.focus();
      else
        document.querySelector<HTMLButtonElement>("#cart-toggle-btn")?.focus();
    };
    // closeCart only dispatches to the provider; reopening should control focus.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);
  if (!isOpen) return null;
  return (
    <>
      <div className="backdrop cart-backdrop" onClick={closeCart} />
      <aside
        ref={dialog}
        className="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        <div className="cart-drawer-heading">
          <h2>
            Your Cart <span className="cart-count">{totalItems}</span>
          </h2>
          <button
            id="cart-close-btn"
            aria-label="Close cart"
            onClick={closeCart}
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="cart-drawer-items">
          <SavedListsStatus />
          {items.length ? (
            items.map((item) => <ShoppingItemRow key={item.id} item={item} />)
          ) : (
            <div className="empty-state">
              <Icon name="bag" size={35} />
              <p>Your cart is empty</p>
              <Link href="/products" onClick={closeCart}>
                Browse products
              </Link>
            </div>
          )}
        </div>
        <div className="cart-drawer-footer">
          <p>
            Available subtotal <strong>{formatPrice(totalPrice)}</strong>
          </p>
          <Link
            href="/cart"
            id="checkout-whatsapp-btn"
            onClick={closeCart}
            className="btn btn-primary"
          >
            Review cart & seller checkout <Icon name="arrow" />
          </Link>
          <Link href="/wishlist" onClick={closeCart}>
            Open your wishlist
          </Link>
          <small>
            Availability and each seller’s approved contact are checked before
            WhatsApp opens.
          </small>
        </div>
      </aside>
    </>
  );
}
