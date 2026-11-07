import Icon from "./Icon";
export default function CatalogError({
  message,
  retryHref = "/products",
}: {
  message: string;
  retryHref?: string;
}) {
  // A full reload retries the server request even when this URL is already in the router cache.
  return (
    <div className="empty-state catalog-error" role="alert">
      <Icon name="store" size={36} />
      <h2>The shelves are taking a moment</h2>
      <p>{message}</p>
      <a href={retryHref} className="btn btn-primary">
        Try again <Icon name="arrow" size={16} />
      </a>
    </div>
  );
}
