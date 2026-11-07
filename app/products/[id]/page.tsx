import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "../../../lib/catalog";
import { formatPrice } from "../../../lib/catalog-model";
import ProductGrid from "../../components/ProductGrid";
import SellerBadge from "../../components/SellerBadge";
import ProductGallery from "../../components/ProductGallery";
import ProductActions from "../../components/ProductActions";
import CatalogError from "../../components/CatalogError";

export const dynamic = "force-dynamic";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getProduct(id);
  if (result.error)
    return (
      <div className="container section">
        <CatalogError
          message={result.error}
          retryHref={`/products/${encodeURIComponent(id)}`}
        />
      </div>
    );
  if (!result.data) notFound();
  const product = result.data;
  const related = product.sellers
    ? (await getProducts(product.seller_id)).data
        .filter((p) => p.id !== id)
        .slice(0, 4)
    : [];
  return (
    <div className="container detail-page">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">Marketplace</Link>
        <span>/</span>
        <Link
          href={`/products?category=${encodeURIComponent(product.category)}`}
        >
          {product.category}
        </Link>
        <span>/</span>
        <span>{product.product_name}</span>
      </nav>
      <div className="product-detail-grid">
        <ProductGallery
          images={product.image_urls}
          name={product.product_name}
        />
        <section className="product-info">
          <Link
            className="eyebrow"
            href={`/products?category=${encodeURIComponent(product.category)}`}
          >
            {product.category}
          </Link>
          <h1>{product.product_name}</h1>
          {product.sellers ? (
            <SellerBadge
              sellerId={product.sellers.id}
              storeName={product.sellers.store_name}
            />
          ) : (
            <p className="muted">Store details unavailable</p>
          )}
          <p className="detail-price">{formatPrice(product.retail_price)}</p>
          <p
            className={`availability ${product.quantity === 0 ? "unavailable" : ""}`}
          >
            <span className="status-dot" />
            {product.quantity === null
              ? "Contact us to confirm availability"
              : product.quantity === 0
                ? "Currently out of stock"
                : `${product.quantity} available`}
          </p>
          <div className="product-description">
            <h2>A closer look</h2>
            <p>
              {product.description ||
                "The seller hasn’t added a description yet. Ask about this product on WhatsApp."}
            </p>
          </div>
          <ProductActions product={product} />
          <p className="detail-note">
            Listed by an independent seller. Confirm availability and purchase
            details before ordering.
          </p>
        </section>
      </div>
      {related.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THERE’S MORE TO DISCOVER</p>
              <h2>More from this store.</h2>
            </div>
          </div>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
