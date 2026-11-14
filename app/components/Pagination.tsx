import Link from "next/link";
import Icon from "./Icon";
import type { Page, SearchParams } from "../../lib/catalog-model";
import { firstParam } from "../../lib/catalog-model";

/**
 * Plain links so paging works without JavaScript and every page is a
 * shareable URL. All other filters are carried across unchanged.
 */
export default function Pagination<T>({
  page,
  basePath,
  params,
}: {
  page: Page<T>;
  basePath: string;
  params: SearchParams;
}) {
  if (page.pageCount <= 1) return null;
  const href = (target: number) => {
    const next = new URLSearchParams();
    for (const key of ["search", "category", "family", "sub", "sort", "q"]) {
      const value = firstParam(params[key]);
      if (value) next.set(key, value);
    }
    if (target > 1) next.set("page", String(target));
    return `${basePath}${next.size ? `?${next}` : ""}`;
  };

  // A compact window around the current page, always including first and last.
  const numbers = new Set<number>([1, page.pageCount]);
  for (let i = page.page - 1; i <= page.page + 1; i++)
    if (i >= 1 && i <= page.pageCount) numbers.add(i);
  const ordered = [...numbers].sort((a, b) => a - b);

  return (
    <nav className="pagination" aria-label="Pagination">
      {page.page > 1 ? (
        <Link href={href(page.page - 1)} rel="prev" className="page-step">
          <Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} />
          Previous
        </Link>
      ) : (
        <span className="page-step is-disabled" aria-hidden="true">
          <Icon name="arrow" size={15} style={{ transform: "rotate(180deg)" }} />
          Previous
        </span>
      )}
      <span className="page-numbers">
        {ordered.map((number, index) => (
          <span key={number} style={{ display: "contents" }}>
            {index > 0 && number - ordered[index - 1] > 1 && (
              <span className="page-gap">…</span>
            )}
            {number === page.page ? (
              <span className="page-number is-current" aria-current="page">
                {number}
              </span>
            ) : (
              <Link href={href(number)} className="page-number">
                {number}
              </Link>
            )}
          </span>
        ))}
      </span>
      {page.page < page.pageCount ? (
        <Link href={href(page.page + 1)} rel="next" className="page-step">
          Next <Icon name="arrow" size={15} />
        </Link>
      ) : (
        <span className="page-step is-disabled" aria-hidden="true">
          Next <Icon name="arrow" size={15} />
        </span>
      )}
    </nav>
  );
}
