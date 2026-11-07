import Link from "next/link";
import { redirect } from "next/navigation";
import {
  firstParam,
  isPublicId,
  sellerHref,
  type SearchParams,
} from "../../lib/catalog-model";
import { SELL_URL } from "../../lib/brand";
import Icon from "../components/Icon";

export const metadata = { title: "Sell with us" };
export default async function SellerPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const seller = firstParam(params.seller);
  // Preserve the old query route for safe UUIDs only. Never look up a phone/JID.
  if (seller && isPublicId(seller)) {
    const query = new URLSearchParams();
    for (const key of ["search", "category", "sort"])
      if (firstParam(params[key])) query.set(key, firstParam(params[key]));
    redirect(`${sellerHref(seller)}${query.size ? `?${query}` : ""}`);
  }
  return (
    <>
      <section className="page-intro seller-intro">
        <div className="container">
          <p className="eyebrow">INDEPENDENT SHOP. SHARED POSSIBILITIES.</p>
          <h1>
            Your store.
            <br />
            <em>A whole new audience.</em>
          </h1>
          <p>
            Bring your products to Munshi Mart. Start with a WhatsApp message —
            no complicated forms to fill.
          </p>
          <a
            href={SELL_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-yellow"
          >
            Let’s open your store <Icon name="arrow" />
          </a>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AS SIMPLE AS A CONVERSATION</p>
            <h2>From your phone to the marketplace.</h2>
          </div>
        </div>
        <div className="seller-steps">
          {[
            [
              "01",
              "Tell us what you sell",
              "Send a text or voice note to Munshi. Share a name, price, quantity and description.",
            ],
            [
              "02",
              "Show the good stuff",
              "Add your product photos and store name. Review the details before publishing.",
            ],
            [
              "03",
              "Make yourself discoverable",
              "Confirm your listing. Your active products appear in the marketplace and your own shareable store.",
            ],
          ].map(([number, title, text]) => (
            <article key={number}>
              <span>{number}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
        {seller && !isPublicId(seller) && (
          <p className="notice">
            This older store link cannot be used. Open a product and follow its
            store link to find the public storefront.
          </p>
        )}
        <div className="view-all">
          <Link href="/products" className="btn btn-outline">
            Explore the marketplace <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </>
  );
}
