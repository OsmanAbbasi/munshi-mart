"use client";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { normalizeWhatsAppNumber } from "../../lib/catalog-model";
import type { ShoppingItem } from "../../lib/shopping";
import Icon from "./Icon";
export default function SellerCheckout({
  sellerId,
  items,
}: {
  sellerId: string | null;
  items: ShoppingItem[];
}) {
  const { retryCatalog } = useCart();
  const [state, setState] = useState<{
    loading: boolean;
    error?: string;
    url?: string;
    excluded?: number;
  }>({ loading: false });
  const eligible = items.filter((i) => i.availability === "available");
  const pending = items.some(
    (i) => i.availability === "checking" || i.availability === "error",
  );
  const contact = eligible.find((i) => i.product?.sellers?.id === sellerId)
    ?.product?.sellers?.public_whatsapp_number;
  const hasContact = !!normalizeWhatsAppNumber(contact);
  async function prepare(open = false) {
    setState({ loading: true });
    try {
      const response = await fetch("/api/checkout/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          sellerId,
          items: items.map((i) => ({ id: i.id, quantity: i.cartQty })),
        }),
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== "string") {
        if (response.status === 409) retryCatalog();
        throw new Error(
          result.error || "Could not verify this seller group. Please retry.",
        );
      }
      // Defense in depth: only an encoded WhatsApp URL can be used for handoff.
      const url = new URL(result.url);
      if (
        url.origin !== "https://wa.me" ||
        !/^\/[1-9]\d{7,14}$/.test(url.pathname)
      )
        throw new Error("Invalid seller checkout link.");
      setState({
        loading: false,
        url: url.href,
        excluded: result.excluded?.length || 0,
      });
      if (open) window.location.assign(url.href);
    } catch (error) {
      setState({
        loading: false,
        error:
          error instanceof Error
            ? error.message
            : "Checkout could not be checked. Please retry.",
      });
    }
  }
  return (
    <div
      className="seller-checkout"
      data-checkout-seller={sellerId || "unknown"}
    >
      {!hasContact && !pending && (
        <p className="contact-unavailable">
          Seller checkout unavailable: no approved public WhatsApp contact.
        </p>
      )}
      {!eligible.length && !pending && <p>No available products to send.</p>}
      {state.error && (
        <p className="shopping-error" role="alert">
          {state.error}
        </p>
      )}
      {state.url && !pending ? (
        <>
          <p role="status">
            Ready to send this seller’s available items.
            {state.excluded
              ? ` ${state.excluded} unavailable item(s) excluded.`
              : ""}
          </p>
          <a
            className="btn btn-primary"
            href={state.url}
            data-checkout-link={sellerId}
            aria-disabled={state.loading}
            onClick={(event) => {
              event.preventDefault();
              if (!state.loading) void prepare(true);
            }}
          >
            <Icon name="chat" />
            {state.loading
              ? "Rechecking availability…"
              : "Open WhatsApp to send"}
          </a>
        </>
      ) : (
        <button
          className="btn btn-primary"
          disabled={
            state.loading ||
            pending ||
            !eligible.length ||
            !sellerId ||
            !hasContact
          }
          onClick={() => void prepare()}
        >
          <Icon name="chat" />
          {state.loading ? "Checking availability…" : "Order on WhatsApp"}
        </button>
      )}
      <p className="checkout-explanation">
        You still need to send the message in WhatsApp. Your cart stays saved on
        this device. No order is recorded and no stock is reserved.
      </p>
    </div>
  );
}
