import Link from "next/link";
import { getProducts } from "../../lib/catalog";
import {
  buildStoreDirectory,
  filterStores,
  firstParam,
  formatPrice,
  sellerHref,
  STORE_SORT_OPTIONS,
  type SearchParams,
  type StoreSummary,
} from "../../lib/catalog-model";
import { FAMILIES } from "../../lib/taxonomy";
import CatalogError from "../components/CatalogError";
import StoreFilters from "../components/StoreFilters";
import Icon from "../components/Icon";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Browse stores",
  description:
    "Browse every independent Pakistani store on Munshi Mart. Filter by what they sell, search by name, and open a store to see its listings.",
  alternates: { canonical: "/stores" },
};

function StorePreview({ store }: { store: StoreSummary }) {
  if (store.preview.length === 0)
    return (
      <div className="store-preview">
        <span className="store-preview-empty">
          <Icon name="store" size={18} />
        </span>
      </div>
    );
  return (
    <div className="store-preview" aria-hidden="true">
      {store.preview.map((src, index) => (
        <span key={`${src}-${index}`}>
          {/* Seller/CDN URLs stay unoptimized, matching the catalogue's
              existing image policy. Decorative, so alt is empty. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" loading="lazy" />
        </span>
      ))}
    </div>
  );
}

function StoreCard({ store }: { store: StoreSummary }) {
  const href = sellerHref(store.seller.id);
  return (
    <article className="store-card">
      <Link href={href} aria-label={`Visit ${store.seller.store_name}`}>
        <StorePreview store={store} />
      </Link>
      <div className="store-card-body">
        <h3>
          <Link href={href}>{store.seller.store_name}</Link>
        </h3>
        <div className="store-meta">
          <span>
            <b>{store.productCount}</b>{" "}
            {store.productCount === 1 ? "listing" : "listings"}
          </span>
          {store.inStock > 0 && <span>{store.inStock} in stock</span>}
          {store.lowestPrice !== null && (
            <span>from {formatPrice(store.lowestPrice)}</span>
          )}
        </div>
        {store.families.length > 0 && (
          <div className="store-families">
            {store.families.slice(0, 3).map((family) => (
              <span key={family}>{family}</span>
            ))}
          </div>
        )}
        <div className="store-card-actions">
          <Link href={href} className="btn btn-outline">
            Visit store <Icon name="arrow" size={16} />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default async function StoresPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { data, error } = await getProducts();
  const directory = buildStoreDirectory(data);
  const stores = filterStores(directory, params);
  const query = firstParam(params.q);
  const family = firstParam(params.family);
  const sort = firstParam(params.sort) || "listings";

  // Only offer a family filter for families some store actually sells in.
  const stocked = new Set(directory.flatMap((store) => store.families));
  const familyFilters = FAMILIES.filter((f) => stocked.has(f.name));

  return (
    <>
      <section className="page-intro">
        <div className="container">
          <p className="eyebrow">
            <span className="yellow-dot" /> EVERY SHOP, ONE PLACE
          </p>
          <h1>Browse the stores.</h1>
          <p>
            Every store here is an independent Pakistani seller who lists and
            updates their own products over WhatsApp. Find one by name, or by
            what they stock.
          </p>
        </div>
      </section>
      <section className="container section">
        {error ? (
          <CatalogError message={error} retryHref="/stores" />
        ) : (
          <>
            <StoreFilters
              query={query}
              family={family}
              sort={sort}
              families={familyFilters}
              sortOptions={STORE_SORT_OPTIONS}
            />
            <p className="store-count-note">
              {stores.length === directory.length
                ? `${directory.length} ${directory.length === 1 ? "store" : "stores"} with active listings`
                : `${stores.length} of ${directory.length} stores match`}
            </p>
            {stores.length === 0 ? (
              <div className="empty-state">
                <Icon name="store" size={30} />
                <div>
                  <strong>No stores match this search.</strong>
                  <p className="muted">
                    Try a different name, or clear the filters to see every
                    store.
                  </p>
                </div>
                <Link href="/stores" className="btn btn-outline">
                  Show all stores
                </Link>
              </div>
            ) : (
              <div className="store-grid">
                {stores.map((store) => (
                  <StoreCard key={store.seller.id} store={store} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
