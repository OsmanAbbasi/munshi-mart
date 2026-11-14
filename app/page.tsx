import Link from "next/link";
import { getProducts } from "../lib/catalog";
import { filterProducts, buildStoreDirectory, sellerHref } from "../lib/catalog-model";
import { FAMILIES, familyCounts } from "../lib/taxonomy";
import { SELL_URL } from "../lib/brand";
import ProductGrid from "./components/ProductGrid";
import CatalogError from "./components/CatalogError";
import Icon from "./components/Icon";
import StructuredData, { siteSchema } from "./components/StructuredData";

export const dynamic = "force-dynamic";
export default async function Home() {
  const { data, error } = await getProducts();
  const latest = filterProducts(data, {}).slice(0, 8);
  // Tiles are driven by live stock, so a shopper never lands on an empty shelf.
  const counts = familyCounts(data);
  const families = FAMILIES.filter((f) => (counts.get(f.slug) || 0) > 0)
    .sort((a, b) => (counts.get(b.slug) || 0) - (counts.get(a.slug) || 0))
    .slice(0, 8);
  const directory = buildStoreDirectory(data);
  const stores = [...directory]
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6);
  const totalProducts = data.length;
  const storeTotal = directory.length;
  return (
    <>
      {siteSchema().map((schema, index) => (
        <StructuredData key={index} data={schema} />
      ))}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="yellow-dot" /> PAKISTAN&rsquo;S WHATSAPP-NATIVE
              MARKETPLACE
            </p>
            <h1>
              A shop that runs
              <br />
              on a voice note.
              <br />
              <em>Yours, in minutes.</em>
            </h1>
            <p className="hero-description">
              Every product here was listed by a Pakistani seller speaking or
              typing to Munshi on WhatsApp &mdash; no dashboards, no
              spreadsheets, no setup fee. You browse the shelves here, then
              message the shopkeeper directly.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-yellow">
                Start browsing <Icon name="arrow" />
              </Link>
              <Link href="/seller" className="hero-secondary">
                Open your own store free ↗
              </Link>
            </div>
            <div className="hero-footnote">
              <Icon name="store" size={16} />
              {totalProducts > 0
                ? `${totalProducts.toLocaleString("en-PK")} listings · ${storeTotal} independent ${storeTotal === 1 ? "store" : "stores"} · Urdu, Roman Urdu or English`
                : "Independent stores. One shared marketplace."}
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <span className="art-star star-one">✳</span>
            <span className="art-star star-two">✦</span>
            <div className="art-bag">
              <div className="art-handle" />
              <div className="art-bag-logo">
                <Icon name="bag" size={48} />
                <span>
                  munshi
                  <br />
                  <b>mart.</b>
                </span>
              </div>
              <span className="bag-caption">
                A LITTLE LOCAL GOES A LONG WAY.
              </span>
            </div>
            <div className="art-label label-one">
              <Icon name="leaf" /> Local stores.
              <br />
              <strong>Lovely discoveries.</strong>
            </div>
            <div className="art-label label-two">
              A good find
              <br />
              <strong>starts here. ↗</strong>
            </div>
            <div className="art-caption">
              THE EVERYDAY FINDS CLUB — EST. IN PAKISTAN
            </div>
          </div>
        </div>
      </section>
      <div className="promise-strip">
        <div className="container">
          {[
            [
              "chat",
              "Listed by voice or text",
              "Sellers talk to Munshi; the shelf updates itself",
            ],
            [
              "store",
              "Real shopkeepers",
              "Browse each independent store on its own page",
            ],
            [
              "bag",
              "No account needed",
              "Pick what you want, then message the seller",
            ],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <span className="promise-icon">
                <Icon name={icon as "store" | "bag" | "chat"} size={24} />
              </span>
              <span>
                <strong>{title}</strong>
                <small>{text}</small>
              </span>
            </div>
          ))}
        </div>
      </div>
      <section className="section container">
        <div className="section-heading">
          <div>
            <p className="eyebrow">BROWSE BY DEPARTMENT</p>
            <h2>What are you looking for?</h2>
          </div>
          <Link href="/products" className="text-link">
            Shop everything <Icon name="arrow" size={17} />
          </Link>
        </div>
        {families.length > 0 ? (
          <div className="family-grid">
            {families.map((family) => (
              <Link
                className="family-card reveal"
                href={`/products?family=${family.slug}`}
                key={family.slug}
              >
                <span className="family-symbol" aria-hidden="true">
                  {family.symbol}
                </span>
                <strong>{family.name}</strong>
                <small>{family.tagline}</small>
                <span className="family-count">
                  {counts.get(family.slug)}{" "}
                  {counts.get(family.slug) === 1 ? "listing" : "listings"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="muted">
            Departments appear here as our stores add their listings.
          </p>
        )}
      </section>
      <section className="section container latest-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH ON THE SHELVES</p>
            <h2>Just listed.</h2>
          </div>
          <Link className="text-link" href="/products">
            View all products <Icon name="arrow" size={17} />
          </Link>
        </div>
        {error ? (
          <CatalogError message={error} retryHref="/" />
        ) : (
          <ProductGrid
            products={latest}
            emptyMessage="Our independent stores are getting their shelves ready. Check back soon."
          />
        )}
      </section>
      {stores.length > 0 && (
        <section className="section container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE SHOPS BEHIND THE PRODUCTS</p>
              <h2>Meet the stores.</h2>
            </div>
            <Link className="text-link" href="/stores">
              Browse all stores <Icon name="arrow" size={17} />
            </Link>
          </div>
          <div className="store-rail">
            {stores.map((store) => (
              <Link
                key={store.seller.id}
                href={sellerHref(store.seller.id)}
                className="store-pill reveal"
              >
                <span className="store-pill-mark" aria-hidden="true">
                  <Icon name="store" size={17} />
                </span>
                <span>
                  <strong>{store.seller.store_name}</strong>
                  <small>
                    {store.productCount}{" "}
                    {store.productCount === 1 ? "listing" : "listings"}
                    {store.families[0] ? ` · ${store.families[0]}` : ""}
                  </small>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="container seller-callout" id="how-it-works">
        <div>
          <p className="eyebrow">YOUR SHOP. A BIGGER WINDOW.</p>
          <h2>
            You bring the products.
            <br />
            Munshi brings them online.
          </h2>
          <p>
            Send a voice note in Urdu, Roman Urdu or English. Munshi writes the
            listing, checks your photos and puts it on the shelf.
            <br />
            No commission to start, and your customers reach you on the number
            you already use.
          </p>
          <a
            href={SELL_URL}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            Start selling on WhatsApp <Icon name="arrow" size={18} />
          </a>
        </div>
        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>Say hello on WhatsApp</strong>
              <p>
                Tell Munshi what you are selling, in your own words — speak or
                type, whichever is easier.
              </p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Check it over</strong>
              <p>
                Munshi drafts the price, stock and description. You correct
                anything that is off before it goes live.
              </p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Open your doors</strong>
              <p>
                Publish, and your store gets its own page to share with
                customers anywhere.
              </p>
            </div>
          </li>
        </ol>
      </section>
    </>
  );
}
