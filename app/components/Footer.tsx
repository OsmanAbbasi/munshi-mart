import Link from "next/link";
import Icon from "./Icon";
import { SELL_URL } from "../../lib/brand";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div>
          <Link href="/" className="brand">
            <span className="brand-mark">
              <Icon name="bag" size={25} />
            </span>
            <span>
              munshi<span className="brand-mart">mart</span>
            </span>
          </Link>
          <p>
            A little closer to your next good find.
            <br />A marketplace for independent Pakistani stores.
          </p>
        </div>
        <div>
          <h3>Explore</h3>
          <Link href="/products">The marketplace</Link>
          <Link href="/cart">Your shopping bag</Link>
          <Link href="/seller">Sell with Munshi Mart</Link>
        </div>
        <div>
          <h3>From your shop to their doorstep.</h3>
          <p>
            Start with a message. Let Munshi help
            <br />
            you share what you sell.
          </p>
          <a
            href={SELL_URL}
            target="_blank"
            rel="noreferrer"
            className="footer-cta"
          >
            Let’s talk on WhatsApp <Icon name="arrow" size={16} />
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Munshi Mart</span>
        <span>Made for the way Pakistan shops.</span>
        <span>Browse online. Connect on WhatsApp.</span>
      </div>
    </footer>
  );
}
