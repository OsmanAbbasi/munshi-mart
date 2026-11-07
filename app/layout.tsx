import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import { fixtureMode } from "../lib/catalog";
import { WHATSAPP_NUMBER } from "../lib/brand";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "Munshi Mart — Good finds. Local stores.",
    template: "%s | Munshi Mart",
  },
  description:
    "Discover products from independent Pakistani stores. Browse the marketplace or start selling through WhatsApp.",
  icons: { icon: "/brand-mark.svg" },
  openGraph: {
    title: "Munshi Mart",
    description: "Good finds. Local stores.",
    locale: "en_PK",
    type: "website",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {fixtureMode() && (
          <div className="fixture-banner" role="status">
            LOCAL DEMO · Fixture catalog for visual verification. These items
            are not for sale.
          </div>
        )}
        <CartProvider>
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer />
          <CartDrawer />
          <WhatsAppButton
            phoneNumber={WHATSAPP_NUMBER}
            message="Hi! I need help with Munshi Mart."
          />
        </CartProvider>
      </body>
    </html>
  );
}
