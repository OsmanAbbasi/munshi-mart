import Link from "next/link";
import {
  categoryOptions,
  filterProducts,
  firstParam,
  paginate,
  SORT_OPTIONS,
  type Product,
  type SearchParams,
} from "../../lib/catalog-model";
import { FAMILIES, familyFromSlug, familyCounts, presentSubcategories } from "../../lib/taxonomy";
import ProductGrid from "../components/ProductGrid";
import TaxonomyFilters from "../components/TaxonomyFilters";
import Pagination from "../components/Pagination";
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
  const family = firstParam(params.family);
  const sub = firstParam(params.sub);
  const activeFamily = family ? familyFromSlug(family) : null;
  const filtered = filterProducts(products, {
    search,
    category,
    sort,
    ...(activeFamily ? { family: activeFamily.slug } : {}),
    ...(sub ? { sub } : {}),
  });
  const categories = categoryOptions(products);
  // Counts come from the whole store/marketplace list so a chip still shows
  // how much it holds while another filter is active.
  const counts = familyCounts(products);
  const stockedFamilies = FAMILIES.filter((f) => (counts.get(f.slug) || 0) > 0);
  const subcategories = activeFamily
    ? presentSubcategories(products, activeFamily.slug)
    : [];
  // Server-side paging: the full catalogue is multiple megabytes of markup.
  const pageData = paginate(filtered, params);
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
          Seller label
          <select name="category" defaultValue={category} key={category}>
            <option value="">Any</option>
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
        {activeFamily && (
          <input type="hidden" name="family" value={activeFamily.slug} />
        )}
        {sub && <input type="hidden" name="sub" value={sub} />}
        <button className="btn btn-primary" type="submit">
          Apply <Icon name="arrow" size={16} />
        </button>
      </form>
      <TaxonomyFilters
        basePath={basePath}
        families={stockedFamilies}
        counts={counts}
        activeFamily={activeFamily}
        subcategories={subcategories}
        activeSub={sub}
        search={search}
        sort={sort}
      />
      <div className="catalog-count">
        <p role="status">
          {error
            ? "Catalog temporarily unavailable"
            : `${pageData.total === 0 ? "No" : pageData.total} ${pageData.total === 1 ? "product" : "products"}${search ? ` for “${search}”` : ""}${sub ? ` in ${sub}` : activeFamily ? ` in ${activeFamily.name}` : category ? ` in ${category}` : ""}${pageData.pageCount > 1 ? ` · showing ${pageData.from}–${pageData.to}` : ""}`}
        </p>
        {(search || category || family || sub || sort !== "newest") && (
          <Link href={basePath}>Clear filters ×</Link>
        )}
      </div>
      {error ? (
        <CatalogError message={error} retryHref={basePath} />
      ) : (
        <ProductGrid
          products={pageData.items}
          resetHref={basePath}
          emptyMessage={
            search || category || family || sub
              ? "No matches this time. Try another search or clear your filters."
              : store
                ? "This store has no active listings yet. Come back soon or explore the marketplace."
                : "The shelves are getting ready. Check back soon for new listings."
          }
        />
      )}
      {!error && <Pagination page={pageData} basePath={basePath} params={params} />}
    </section>
  );
}
