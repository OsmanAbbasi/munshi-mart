import type { MetadataRoute } from "next";
import { getProducts } from "../lib/catalog";
import { buildStoreDirectory, sellerHref } from "../lib/catalog-model";
import { FAMILIES, familyCounts } from "../lib/taxonomy";
import { SITE_URL } from "../lib/brand";

// Reads the live catalogue on request, so newly published listings appear
// without a redeploy. Matches the site's force-dynamic catalogue policy.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = (path: string) => `${SITE_URL}${path}`;
  const staticEntries: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "daily", priority: 1 },
    { url: url("/products"), changeFrequency: "daily", priority: 0.9 },
    { url: url("/stores"), changeFrequency: "daily", priority: 0.8 },
    { url: url("/seller"), changeFrequency: "monthly", priority: 0.5 },
  ];

  // A catalogue failure must not produce a sitemap that delists every product,
  // so on error we publish only the stable pages.
  const { data, error } = await getProducts();
  if (error) return staticEntries;

  const counts = familyCounts(data);
  const familyEntries: MetadataRoute.Sitemap = FAMILIES.filter(
    (family) => (counts.get(family.slug) || 0) > 0,
  ).map((family) => ({
    url: url(`/products?family=${family.slug}`),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = data.map((product) => ({
    url: url(`/products/${product.id}`),
    lastModified: new Date(product.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const storeEntries: MetadataRoute.Sitemap = buildStoreDirectory(data).map(
    (store) => ({
      url: url(sellerHref(store.seller.id)),
      lastModified: new Date(store.latest),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }),
  );

  return [
    ...staticEntries,
    ...familyEntries,
    ...storeEntries,
    ...productEntries,
  ];
}
