export const BRAND = "Munshi Mart";
export const TAGLINE = "Good finds. Local stores.";

// Canonical public origin, used for metadata, sitemap and share images.
// Vercel supplies VERCEL_PROJECT_PRODUCTION_URL on deployments; the literal is
// the owner-confirmed production URL and stays the fallback for local builds.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://munshi-mart.vercel.app")
).replace(/\/+$/, "");

// Existing platform contact. Individual seller contacts need an explicitly public field.
export const WHATSAPP_NUMBER = "923460392313";
export const SELL_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Assalam o Alaikum! I want to list my product on Munshi Mart.")}`;
