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
          <p className="eyebrow">SELL WITHOUT A DASHBOARD</p>
          <h1>
            If you can send
            <br />
            a voice note,
            <br />
            <em>you can sell online.</em>
          </h1>
          <p>
            No app to install, no listing fee and no forms. Message Munshi on
            WhatsApp in Urdu, Roman Urdu or English, and your store goes live
            with its own shareable page.
          </p>
          <a
            href={SELL_URL}
            target="_blank"
            rel="noreferrer"
            className="btn btn-yellow"
          >
            Open your store on WhatsApp <Icon name="arrow" />
          </a>
        </div>
      </section>
      <section className="container section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AS SIMPLE AS A CONVERSATION</p>
            <h2>From a voice note to a storefront.</h2>
          </div>
        </div>
        <div className="seller-steps">
          {[
            [
              "01",
              "Tell us what you sell",
              "Speak or type in the language you are comfortable with. Munshi understands Urdu, Roman Urdu and English.",
            ],
            [
              "02",
              "Show the good stuff",
              "Send your photos. Munshi checks each one actually matches the product, and asks before using anything it is unsure about.",
            ],
            [
              "03",
              "Make yourself discoverable",
              "Confirm, and your listing joins the marketplace. Buyers message you directly on the number you already use.",
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
