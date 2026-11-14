import type { MetadataRoute } from "next";
import { SITE_URL } from "../lib/brand";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Device-local pages hold nothing crawlable, and the read-only POST
        // endpoints are not useful search results.
        disallow: ["/api/", "/cart", "/wishlist"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
