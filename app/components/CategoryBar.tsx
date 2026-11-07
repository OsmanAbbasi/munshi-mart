import Link from "next/link";
export default function CategoryBar({
  categories,
  selected,
  basePath,
  search,
  sort,
}: {
  categories: string[];
  selected: string;
  basePath: string;
  search: string;
  sort: string;
}) {
  return (
    <nav className="category-bar" aria-label="Product categories">
      {["", ...categories].map((category) => {
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        if (category) params.set("category", category);
        if (sort) params.set("sort", sort);
        return (
          <Link
            key={category}
            href={`${basePath}${params.size ? `?${params}` : ""}`}
            className={
              category.toLowerCase() === selected.toLowerCase()
                ? "selected"
                : ""
            }
            aria-current={
              category.toLowerCase() === selected.toLowerCase()
                ? "true"
                : undefined
            }
          >
            {category || "All products"}
          </Link>
        );
      })}
    </nav>
  );
}
