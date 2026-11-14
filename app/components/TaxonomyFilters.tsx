import Link from "next/link";
import type { Family } from "../../lib/taxonomy";

/**
 * Two-level category filter: a family chip row, and — once a family is
 * chosen — the subcategory chips actually present in it. Plain links, so the
 * whole view stays shareable and works without JavaScript.
 *
 * Families and subcategories are DERIVED from the stored category plus the
 * product name (see lib/taxonomy.ts), so these work on existing rows that the
 * bot wrote before the taxonomy existed.
 */
export default function TaxonomyFilters({
  basePath,
  families,
  counts,
  activeFamily,
  subcategories,
  activeSub,
  search,
  sort,
}: {
  basePath: string;
  families: Family[];
  counts: Map<string, number>;
  activeFamily: Family | null;
  subcategories: string[];
  activeSub: string;
  search: string;
  sort: string;
}) {
  const href = (familySlug: string, sub?: string) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (familySlug) params.set("family", familySlug);
    if (sub) params.set("sub", sub);
    if (sort && sort !== "newest") params.set("sort", sort);
    return `${basePath}${params.size ? `?${params}` : ""}`;
  };
  if (families.length === 0) return null;
  return (
    <div className="taxonomy-filters">
      <nav className="chip-row" aria-label="Filter by department">
        <Link
          href={href("")}
          className={`chip${activeFamily ? "" : " selected"}`}
          aria-current={activeFamily ? undefined : "true"}
        >
          Everything
        </Link>
        {families.map((family) => (
          <Link
            key={family.slug}
            href={href(family.slug)}
            className={`chip${activeFamily?.slug === family.slug ? " selected" : ""}`}
            aria-current={
              activeFamily?.slug === family.slug ? "true" : undefined
            }
          >
            <span aria-hidden="true">{family.symbol}</span>
            {family.name}
            <span className="chip-count">{counts.get(family.slug) || 0}</span>
          </Link>
        ))}
      </nav>
      {activeFamily && subcategories.length > 1 && (
        <nav
          className="chip-row chip-row-sub"
          aria-label={`Filter within ${activeFamily.name}`}
        >
          <Link
            href={href(activeFamily.slug)}
            className={`chip${activeSub ? "" : " selected"}`}
            aria-current={activeSub ? undefined : "true"}
          >
            Everything in {activeFamily.name}
          </Link>
          {subcategories.map((sub) => (
            <Link
              key={sub}
              href={href(activeFamily.slug, sub)}
              className={`chip${activeSub.toLowerCase() === sub.toLowerCase() ? " selected" : ""}`}
              aria-current={
                activeSub.toLowerCase() === sub.toLowerCase()
                  ? "true"
                  : undefined
              }
            >
              {sub}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
