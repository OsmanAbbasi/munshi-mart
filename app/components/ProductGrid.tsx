import Link from "next/link";
import ProductCard from "./ProductCard";
import Icon from "./Icon";
import type { Product } from "../../lib/catalog-model";
export default function ProductGrid({
  products,
  emptyMessage = "Try a different search or category.",
  showViewAll = false,
  resetHref = "/products",
}: {
  products: Product[];
  emptyMessage?: string;
  showViewAll?: boolean;
  resetHref?: string;
}) {
  if (!products.length)
    return (
      <div className="empty-state">
        <Icon name="bag" size={38} />
        <h2>No products here just yet</h2>
        <p>{emptyMessage}</p>
        <Link href={resetHref} className="btn btn-outline">
          Browse all listings <Icon name="arrow" size={16} />
        </Link>
      </div>
    );
  return (
    <>
      <div className="product-grid">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
      {showViewAll && (
        <div className="view-all">
          <Link className="btn btn-outline" href="/products">
            Explore the marketplace <Icon name="arrow" size={16} />
          </Link>
        </div>
      )}
    </>
  );
}
