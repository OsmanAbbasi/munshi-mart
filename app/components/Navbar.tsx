"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useCart } from "../context/CartContext";
import SearchBar from "./SearchBar";
import Icon from "./Icon";
import ThemeToggle from "./ThemeToggle";
export default function Navbar() {
  const { totalItems, toggleCart, wishlistCount } = useCart();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMobileOpen(false);
      menuToggle.current?.focus();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [mobileOpen]);
  return (
    <>
      <div className="announcement">
        <span>Rooted in Pakistan. Open to everyone.</span>
        <Link href="/seller">Your store starts on WhatsApp ↗</Link>
      </div>
      <header className="site-header">
        <div className="container header-main">
          <Link href="/" className="brand" aria-label="Munshi Mart home">
            <span className="brand-mark">
              <Icon name="bag" size={25} />
            </span>
            <span>
              munshi<span className="brand-mart">mart</span>
              <small>GOOD FINDS. LOCAL STORES.</small>
            </span>
          </Link>
          <div className="header-search">
            <SearchBar key={pathname} />
          </div>
          <div className="header-actions">
            <ThemeToggle />
            <Link
              href="/wishlist"
              className="wishlist-toggle"
              aria-label={`Open wishlist, ${wishlistCount} saved items`}
            >
              <Icon name="heart" />
              <span className="cart-count">{wishlistCount}</span>
            </Link>
            <Link href="/seller" className="header-sell">
              <Icon name="store" /> Become a seller
            </Link>
            <button
              onClick={toggleCart}
              className="cart-toggle"
              id="cart-toggle-btn"
              aria-label={`Open cart, ${totalItems} items`}
            >
              <Icon name="bag" />
              <span className="cart-count">{totalItems}</span>
            </button>
            <button
              className="mobile-menu-btn"
              ref={menuToggle}
              aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <Icon name={mobileOpen ? "close" : "menu"} />
            </button>
          </div>
        </div>
        <div className="header-nav">
          <div className="container nav-inner">
            <nav aria-label="Main navigation">
              <Link
                href="/"
                aria-current={pathname === "/" ? "page" : undefined}
              >
                Home
              </Link>
              <Link
                href="/products"
                aria-current={
                  pathname.startsWith("/products") ? "page" : undefined
                }
              >
                The marketplace
              </Link>
              <Link
                href="/stores"
                aria-current={
                  pathname.startsWith("/stores") ? "page" : undefined
                }
              >
                Browse stores
              </Link>
              <Link
                href="/seller"
                aria-current={
                  pathname.startsWith("/seller") ? "page" : undefined
                }
              >
                Sell with us
              </Link>
            </nav>
            <span className="nav-note">
              <span className="status-dot" /> Small shops. A world of
              possibilities.
            </span>
          </div>
        </div>
        {mobileOpen && (
          <div className="mobile-nav container" id="mobile-nav">
            <SearchBar key={pathname} onSearch={() => setMobileOpen(false)} />
            <nav aria-label="Mobile navigation">
              {[
                ["/", "Home"],
                ["/products", "The marketplace"],
                ["/stores", "Browse stores"],
                ["/seller", "Sell with us"],
                ["/cart", "Your cart"],
                ["/wishlist", "Your wishlist"],
              ].map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                >
                  {label}
                  <Icon name="arrow" size={16} />
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
