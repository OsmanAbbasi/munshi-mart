import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "./context/CartContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import WhatsAppButton from "./components/WhatsAppButton";
import { fixtureMode } from "../lib/catalog";
import { WHATSAPP_NUMBER, SITE_URL } from "../lib/brand";
import { themeScript } from "./components/ThemeToggle";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Munshi Mart — Pakistan's WhatsApp-native marketplace",
    template: "%s | Munshi Mart",
  },
  description:
    "Shop independent Pakistani stores, browse by category or store, and talk to sellers on WhatsApp. Listings are created by voice or text through Munshi, the WhatsApp assistant for sellers.",
  applicationName: "Munshi Mart",
  keywords: [
    "Pakistan marketplace",
    "online shopping Pakistan",
    "WhatsApp shopping",
    "independent stores Pakistan",
    "RC hobby Pakistan",
    "gaming PC Pakistan",
  ],
  icons: { icon: "/brand-mark.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Munshi Mart — Pakistan's WhatsApp-native marketplace",
    description:
      "Independent Pakistani stores in one marketplace. Browse by category or store and message sellers directly on WhatsApp.",
    url: SITE_URL,
    siteName: "Munshi Mart",
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Munshi Mart",
    description: "Good finds. Local stores. Powered by WhatsApp.",
  },
  robots: { index: true, follow: true },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the saved/system theme before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
