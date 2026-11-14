import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProduct, getProducts } from "../../../lib/catalog";
import {
  formatPrice,
  relatedProducts,
  sellerHref,
} from "../../../lib/catalog-model";
import { placeProduct } from "../../../lib/taxonomy";
import StructuredData, {
  productSchema,
  breadcrumbSchema,
} from "../../components/StructuredData";
import ProductGrid from "../../components/ProductGrid";
import SellerBadge from "../../components/SellerBadge";
import ProductGallery from "../../components/ProductGallery";
import Icon from "../../components/Icon";
import ProductActions from "../../components/ProductActions";
import CatalogError from "../../components/CatalogError";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await getProduct(id);
  if (!data) return { title: "Product not found" };
  const placed = placeProduct(data);
  const store = data.sellers?.store_name;
  const description =
    data.description?.trim() ||
    `${data.product_name} — ${placed.subcategory} listed by ${store || "an independent store"} on Munshi Mart.`;
  return {
    title: data.product_name,
    description: description.slice(0, 300),
    alternates: { canonical: `/products/${data.id}` },
    openGraph: {
      type: "website",
      title: data.product_name,
      description: description.slice(0, 200),
      url: `/products/${data.id}`,
      ...(data.image_urls.length ? { images: [data.image_urls[0]] } : {}),
    },
  };
}

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
  // Same store, plus similar items from other stores so a buyer can compare.
  const [storeItems, catalogue] = await Promise.all([
    product.sellers ? getProducts(product.seller_id) : { data: [], error: null },
    getProducts(),
  ]);
  const related = storeItems.data.filter((p) => p.id !== id).slice(0, 4);
  const similar = relatedProducts(product, catalogue.data, 4);
  const placed = placeProduct(product);
  return (
    <div className="container detail-page">
      <StructuredData data={productSchema(product)} />
      <StructuredData
        data={breadcrumbSchema([
          { name: "Marketplace", path: "/products" },
          { name: placed.family.name, path: `/products?family=${placed.family.slug}` },
          { name: product.product_name, path: `/products/${product.id}` },
        ])}
      />
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/products">Marketplace</Link>
        <span>/</span>
        <Link href={`/products?family=${placed.family.slug}`}>
          {placed.family.name}
        </Link>
        <span>/</span>
        <Link
          href={`/products?family=${placed.family.slug}&sub=${encodeURIComponent(placed.subcategory)}`}
        >
          {placed.subcategory}
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
            href={`/products?family=${placed.family.slug}&sub=${encodeURIComponent(placed.subcategory)}`}
          >
            {placed.subcategory}
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
            {product.sellers && (
              <Link className="text-link" href={sellerHref(product.sellers.id)}>
                Visit the store <Icon name="arrow" size={17} />
              </Link>
            )}
          </div>
          <ProductGrid products={related} />
        </section>
      )}
      {similar.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">COMPARE BEFORE YOU MESSAGE</p>
              <h2>Similar, from other stores.</h2>
            </div>
            <Link
              className="text-link"
              href={`/products?family=${placed.family.slug}&sub=${encodeURIComponent(placed.subcategory)}`}
            >
              See all {placed.subcategory} <Icon name="arrow" size={17} />
            </Link>
          </div>
          <ProductGrid products={similar} />
        </section>
      )}
    </div>
  );
}
