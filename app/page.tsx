import Link from "next/link";
import { getProducts } from "../lib/catalog";
import { CATEGORIES, filterProducts } from "../lib/catalog-model";
import { SELL_URL } from "../lib/brand";
import ProductGrid from "./components/ProductGrid";
import CatalogError from "./components/CatalogError";
import Icon from "./components/Icon";

export const dynamic = "force-dynamic";
export default async function Home() {
  const { data, error } = await getProducts();
  const latest = filterProducts(data, {}).slice(0, 8);
  return (
    <>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="yellow-dot" /> YOUR EVERYDAY, DISCOVERED.
            </p>
            <h1>
              Your next
              <br />
              good find.
              <br />
              <em>Closer to home.</em>
            </h1>
            <p className="hero-description">
              Big on choice. Close to your community. Discover everyday
              essentials and unexpected favourites from independent Pakistani
              stores.
            </p>
            <div className="hero-actions">
              <Link href="/products" className="btn btn-yellow">
                Explore the marketplace <Icon name="arrow" />
              </Link>
              <Link href="/seller" className="hero-secondary">
                Have something to sell? ↗
              </Link>
            </div>
            <div className="hero-footnote">
              <Icon name="store" size={16} /> Independent stores. One shared
              marketplace.
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
              "store",
              "Discover local stores",
              "Meet the shops behind the products",
            ],
            [
              "bag",
              "Find your everyday",
              "Essentials, favourites and a little more",
            ],
            ["chat", "Keep it conversational", "Connect through WhatsApp"],
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
            <p className="eyebrow">A LITTLE OF EVERYTHING</p>
            <h2>What are you looking for?</h2>
          </div>
          <Link href="/products" className="text-link">
            Shop everything <Icon name="arrow" size={17} />
          </Link>
        </div>
        <div className="category-tiles">
          {CATEGORIES.map((category, i) => (
            <Link
              href={`/products?category=${encodeURIComponent(category)}`}
              key={category}
            >
              <span className="category-symbol">
                {["✿", "⌁", "⌂", "◒", "✧", "◈", "↗", "▤", "✳"][i]}
              </span>
              <span>{category}</span>
              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section container latest-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FRESH ON THE SHELVES</p>
            <h2>Good things, just in.</h2>
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
      <section className="container seller-callout" id="how-it-works">
        <div>
          <p className="eyebrow">YOUR SHOP. A BIGGER WINDOW.</p>
          <h2>
            You bring the products.
            <br />
            We bring them online.
          </h2>
          <p>
            A voice note, a few photos, and a little help from Munshi.
            <br />
            Your next customer could be one message away.
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
              <p>Tell Munshi what you want to sell, in your own words.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>Make it yours</strong>
              <p>Share the details and photos. Review your listing.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>Open your digital doors</strong>
              <p>Confirm your product and share your store with buyers.</p>
            </div>
          </li>
        </ol>
      </section>
    </>
  );
}
