"use client";
import Icon from "./Icon";

export default function WhatsAppButton({
  phoneNumber,
  message = "Hi! I need help with Munshi Mart.",
}: {
  phoneNumber: string;
  message?: string;
}) {
  return (
    <a
      className="platform-whatsapp"
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Munshi Mart platform support on WhatsApp"
      title="Munshi Mart platform support"
    >
      <Icon name="chat" size={22} />
      <span>Support</span>
    </a>
  );
}
