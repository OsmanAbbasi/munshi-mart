import Link from "next/link";
import { sellerHref } from "../../lib/catalog-model";
import Icon from "./Icon";
export default function SellerBadge({
  storeName,
  sellerId,
}: {
  storeName: string;
  sellerId: string;
}) {
  return (
    <Link className="seller-badge" href={sellerHref(sellerId)}>
      <Icon name="store" />
      <span>{storeName}</span>
      <Icon name="arrow" size={16} />
    </Link>
  );
}
