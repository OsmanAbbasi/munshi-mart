import type { Product } from "../../lib/catalog-model";
import { placeProduct } from "../../lib/taxonomy";
import { BRAND, SITE_URL } from "../../lib/brand";

/**
 * Emits schema.org JSON-LD. Only data already public on the page is included:
 * no seller phone number, no internal WhatsApp JID, no buyer information.
 *
 * Prices are declared only when actually known. The site takes no payment and
 * reserves no stock, so availability reflects display state only.
 */
export default function StructuredData({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      // Static, server-rendered object we construct ourselves; JSON.stringify
      // escaping is sufficient here. `<` is escaped so a stray product name
      // can never open a tag.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function productSchema(product: Product) {
  const placed = placeProduct(product);
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.product_name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.image_urls.length ? { image: product.image_urls } : {}),
    category: `${placed.family.name} > ${placed.subcategory}`,
    url: `${SITE_URL}/products/${product.id}`,
    ...(product.sellers
      ? {
          brand: { "@type": "Brand", name: product.sellers.store_name },
          offers: {
            "@type": "Offer",
            url: `${SITE_URL}/products/${product.id}`,
            priceCurrency: "PKR",
            ...(product.retail_price !== null
              ? { price: product.retail_price }
              : {}),
            availability:
              product.quantity === 0
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            seller: {
              "@type": "Organization",
              name: product.sellers.store_name,
              url: `${SITE_URL}/seller/${product.sellers.id}`,
            },
          },
        }
      : {}),
  };
}

export function storeSchema(
  seller: { id: string; store_name: string },
  productCount: number,
) {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    name: seller.store_name,
    url: `${SITE_URL}/seller/${seller.id}`,
    parentOrganization: { "@type": "Organization", name: BRAND },
    ...(productCount
      ? {
          makesOffer: {
            "@type": "OfferCatalog",
            name: `${seller.store_name} listings`,
            numberOfItems: productCount,
          },
        }
      : {}),
  };
}

export function siteSchema() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: BRAND,
      url: SITE_URL,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: BRAND,
      url: SITE_URL,
      description:
        "A Pakistani marketplace where independent sellers list products over WhatsApp using Munshi, a voice and text assistant.",
      areaServed: "PK",
    },
  ];
}

export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}
