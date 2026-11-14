import Link from "next/link";
import type { Family } from "../../lib/taxonomy";
import Icon from "./Icon";

/**
 * Store-directory filters, independent of the product filters. A plain GET
 * form so search, family and sort survive reload, direct navigation and a
 * browser with JavaScript disabled — matching the marketplace behaviour.
 */
export default function StoreFilters({
  query,
  family,
  sort,
  families,
  sortOptions,
}: {
  query: string;
  family: string;
  sort: string;
  families: Family[];
  sortOptions: { value: string; label: string }[];
}) {
  const chipHref = (slug: string) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (slug) params.set("family", slug);
    if (sort && sort !== "listings") params.set("sort", sort);
    return `/stores${params.size ? `?${params}` : ""}`;
  };
  const filtered = Boolean(query || family || sort !== "listings");
  return (
    <div className="store-filters">
      <form
        className="catalog-controls"
        role="search"
        action="/stores"
        method="get"
      >
        <div className="catalog-search">
          <Icon name="search" size={19} />
          <input
            name="q"
            type="search"
            aria-label="Search stores"
            placeholder="Store name, or what they sell…"
            defaultValue={query}
            key={query}
          />
        </div>
        <label className="filter-label">
          Sort by
          <select name="sort" defaultValue={sort} key={sort}>
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {/* Preserve the active family when submitting search/sort. */}
        {family && <input type="hidden" name="family" value={family} />}
        <button type="submit" className="btn btn-primary">
          Apply <Icon name="arrow" size={16} />
        </button>
      </form>
      {filtered && (
        <div className="catalog-count">
          <Link href="/stores">Clear filters ×</Link>
        </div>
      )}
      {families.length > 0 && (
        <nav className="chip-row" aria-label="Filter stores by what they sell">
          <Link
            href={chipHref("")}
            className={`chip${family ? "" : " selected"}`}
            aria-current={family ? undefined : "true"}
          >
            All stores
          </Link>
          {families.map((item) => (
            <Link
              key={item.slug}
              href={chipHref(item.slug)}
              className={`chip${family === item.slug ? " selected" : ""}`}
              aria-current={family === item.slug ? "true" : undefined}
            >
              <span aria-hidden="true">{item.symbol}</span>
              {item.name}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
