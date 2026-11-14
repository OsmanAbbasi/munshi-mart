import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getSeller } from "../../../lib/catalog";
import { sellerHref, type SearchParams } from "../../../lib/catalog-model";
import { placeProduct } from "../../../lib/taxonomy";
import StructuredData, {
  storeSchema,
  breadcrumbSchema,
} from "../../components/StructuredData";
import ProductsContent from "../../products/ProductsContent";
import CatalogError from "../../components/CatalogError";
import Icon from "../../components/Icon";
import SellerChat from "../../components/SellerChat";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const [seller, products] = await Promise.all([
    getSeller(id),
    getProducts(id),
  ]);
  if (!seller.data) return { title: "Store not found" };
  const count = products.data.length;
  // Name the departments this store actually stocks: useful to a shopper and
  // to search engines, and derived from public listing data only.
  const departments = [
    ...new Set(products.data.map((p) => placeProduct(p).family.name)),
  ].slice(0, 3);
  return {
    title: seller.data.store_name,
    description: `${seller.data.store_name} on Munshi Mart — ${count} active ${count === 1 ? "listing" : "listings"}${departments.length ? ` across ${departments.join(", ")}` : ""}. Browse the store and message the seller on WhatsApp.`,
    alternates: { canonical: sellerHref(id) },
    openGraph: {
      type: "website",
      title: seller.data.store_name,
      description: `${count} active ${count === 1 ? "listing" : "listings"} from an independent Pakistani store.`,
      url: sellerHref(id),
    },
  };
}

export default async function SellerStorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const [seller, products, filters] = await Promise.all([
    getSeller(id),
    getProducts(id),
    searchParams,
  ]);
  if (seller.error)
    return (
      <div className="container section">
        <CatalogError message={seller.error} retryHref={sellerHref(id)} />
      </div>
    );
  if (!seller.data) notFound();
  const departments = [
    ...new Set(products.data.map((p) => placeProduct(p).family.name)),
  ];
  return (
    <>
      <StructuredData
        data={storeSchema(seller.data, products.data.length)}
      />
      <StructuredData
        data={breadcrumbSchema([
          { name: "Stores", path: "/stores" },
          { name: seller.data.store_name, path: sellerHref(id) },
        ])}
      />
      <section className="store-banner">
        <div className="container">
          <Link href="/stores" className="breadcrumb">
            Marketplace / Browse stores
          </Link>
          <div className="store-profile">
            <span className="store-avatar">
              <Icon name="store" size={38} />
            </span>
            <div>
              <p className="eyebrow">AN INDEPENDENT STORE ON MUNSHI MART</p>
              <h1>{seller.data.store_name}</h1>
              <p>
                {products.data.length > 0
                  ? `${products.data.length} active ${products.data.length === 1 ? "listing" : "listings"}${departments.length ? ` · ${departments.slice(0, 3).join(" · ")}` : ""}`
                  : "This store has no active listings right now."}
              </p>
            </div>
            <span className="store-label">
              THE LOCAL FINDS CLUB <Icon name="leaf" />
            </span>
          </div>
          <SellerChat seller={seller.data} />
        </div>
      </section>
      <ProductsContent
        products={products.data}
        error={products.error}
        params={filters}
        basePath={sellerHref(id)}
        store
      />
    </>
  );
}
