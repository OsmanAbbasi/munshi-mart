import Link from "next/link";
import Icon from "./components/Icon";
export default function NotFound() {
  return (
    <div className="container empty-state not-found">
      <Icon name="store" size={45} />
      <p className="eyebrow">NOT ON THESE SHELVES</p>
      <h1>That listing or store isn’t available.</h1>
      <p>
        It may have been removed, made inactive, or the link may be incorrect.
      </p>
      <Link href="/products" className="btn btn-primary">
        Back to the marketplace <Icon name="arrow" />
      </Link>
    </div>
  );
}
