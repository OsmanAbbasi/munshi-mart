import Link from "next/link";
import {
  categoryOptions,
  filterProducts,
  firstParam,
  SORT_OPTIONS,
  type Product,
  type SearchParams,
} from "../../lib/catalog-model";
import ProductGrid from "../components/ProductGrid";
import CategoryBar from "../components/CategoryBar";
import CatalogError from "../components/CatalogError";
import Icon from "../components/Icon";

export default function ProductsContent({
  products,
  params,
  basePath = "/products",
  error,
  store = false,
}: {
  products: Product[];
  params: SearchParams;
  basePath?: string;
  error: string | null;
  store?: boolean;
}) {
  const search = firstParam(params.search);
  const category = firstParam(params.category);
  const rawSort = firstParam(params.sort);
  const sort =
    rawSort === "retail_price:asc"
      ? "price-asc"
      : rawSort === "retail_price:desc"
        ? "price-desc"
        : SORT_OPTIONS.some((s) => s.value === rawSort)
          ? rawSort
          : "newest";
  const filtered = filterProducts(products, { search, category, sort });
  const categories = categoryOptions(products);
  // Native GET form keeps the complete view shareable and works before hydration.
  return (
    <section className="catalog-section container">
      <form action={basePath} method="get" className="catalog-controls">
        <div className="catalog-search">
          <Icon name="search" size={19} />
          <input
            name="search"
            type="search"
            aria-label={store ? "Search this store" : "Search products"}
            placeholder={
              store
                ? "Find something in this store…"
                : "Find your next good thing…"
            }
            defaultValue={search}
            key={search}
          />
        </div>
        <label className="filter-label">
          Category
          <select name="category" defaultValue={category} key={category}>
            <option value="">All products</option>
            {[...new Set([...categories, ...(category ? [category] : [])])].map(
              (c) => (
                <option key={c}>{c}</option>
              ),
            )}
          </select>
        </label>
        <label className="filter-label">
          Sort by
          <select name="sort" defaultValue={sort} key={sort}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button className="btn btn-primary" type="submit">
          Apply <Icon name="arrow" size={16} />
        </button>
      </form>
      <CategoryBar
        categories={categories}
        selected={category}
        basePath={basePath}
        search={search}
        sort={sort}
      />
      <div className="catalog-count">
        <p role="status">
          {error
            ? "Catalog temporarily unavailable"
            : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}${search ? ` for “${search}”` : ""}${category ? ` in ${category}` : ""}`}
        </p>
        {(search || category || sort !== "newest") && (
          <Link href={basePath}>Clear filters ×</Link>
        )}
      </div>
      {error ? (
        <CatalogError message={error} retryHref={basePath} />
      ) : (
        <ProductGrid
          products={filtered}
          resetHref={basePath}
          emptyMessage={
            search || category
              ? "No matches this time. Try another search or clear your filters."
              : store
                ? "This store has no active listings yet. Come back soon or explore the marketplace."
                : "The shelves are getting ready. Check back soon for new listings."
          }
        />
      )}
    </section>
  );
}
