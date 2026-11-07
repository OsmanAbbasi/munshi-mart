"use client";
import { normalizeWhatsAppNumber, type Seller } from "../../lib/catalog-model";
import { WHATSAPP_NUMBER } from "../../lib/brand";
import { useCart } from "../context/CartContext";
import Icon from "./Icon";
export default function SellerChat({
  seller,
  product,
}: {
  seller: Seller | null;
  product?: { id: string; product_name: string };
}) {
  const { hydrated } = useCart();
  const number = normalizeWhatsAppNumber(seller?.public_whatsapp_number);
  const text = `Hello ${seller?.store_name || "there"}! ${product ? `I’m interested in ${product.product_name} on Munshi Mart.\n${hydrated ? new URL(`/products/${product.id}`, window.location.origin).href : ""}` : "I found your store on Munshi Mart and would like to ask about your products."}`;
  return (
    <div className="seller-chat">
      <div>
        {number ? (
          <a
            data-seller-chat={seller?.id}
            className="btn btn-primary"
            href={
              hydrated
                ? `https://wa.me/${number}?text=${encodeURIComponent(text)}`
                : undefined
            }
            aria-disabled={!hydrated}
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="chat" /> Chat with Seller
          </a>
        ) : (
          <>
            <button className="btn btn-outline" disabled>
              <Icon name="chat" /> Seller chat unavailable
            </button>
            <p className="contact-unavailable">
              This store has no approved public WhatsApp contact available.
            </p>
          </>
        )}
      </div>
      <a
        className="platform-support"
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi! I need platform support with Munshi Mart.")}`}
        target="_blank"
        rel="noreferrer"
      >
        Munshi Mart platform support ↗
      </a>
    </div>
  );
}
