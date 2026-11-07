import Link from "next/link";
import { notFound } from "next/navigation";
import { getProducts, getSeller } from "../../../lib/catalog";
import { sellerHref, type SearchParams } from "../../../lib/catalog-model";
import ProductsContent from "../../products/ProductsContent";
import CatalogError from "../../components/CatalogError";
import Icon from "../../components/Icon";
import SellerChat from "../../components/SellerChat";

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
  return (
    <>
      <section className="store-banner">
        <div className="container">
          <Link href="/products" className="breadcrumb">
            Marketplace / Independent stores
          </Link>
          <div className="store-profile">
            <span className="store-avatar">
              <Icon name="store" size={38} />
            </span>
            <div>
              <p className="eyebrow">AN INDEPENDENT STORE ON MUNSHI MART</p>
              <h1>{seller.data.store_name}</h1>
              <p>Explore the store’s latest active listings.</p>
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
