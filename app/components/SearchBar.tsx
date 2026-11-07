"use client";
import { useRouter } from "next/navigation";
import Icon from "./Icon";
export default function SearchBar({
  onSearch,
  initialValue = "",
}: {
  onSearch?: () => void;
  initialValue?: string;
}) {
  const router = useRouter();
  return (
    <form
      className="search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const search = String(
          new FormData(event.currentTarget).get("search") || "",
        ).trim();
        router.push(
          `/products${search ? `?search=${encodeURIComponent(search)}` : ""}`,
        );
        onSearch?.();
      }}
    >
      <Icon name="search" size={18} />
      <input
        key={initialValue}
        name="search"
        type="search"
        defaultValue={initialValue}
        aria-label="Search the marketplace"
        placeholder="Search products, stores and little discoveries…"
      />
      <button type="submit" aria-label="Search">
        <Icon name="arrow" size={18} />
      </button>
    </form>
  );
}
