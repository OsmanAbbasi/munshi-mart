# Munshi Mart frontend architecture

[Frontend README](../README.md) · [Project documentation](../../docs/README.md) · [Database contract](../../docs/DATABASE.md)

Reviewed 8 November 2026 against this frontend checkout. It is a separate nested Git repository, built with Next.js 16.4.5 App Router and React 19.2.8, hosted on Vercel. The WhatsApp bot runs on Oracle; frontend deployment does not restart/update it. Root documentation links are available in the combined workspace; a standalone frontend clone should start with its own README and this file.

## Source map

| Location | Responsibility |
| --- | --- |
| `app/layout.tsx`, `app/page.tsx`, `app/globals.css` | Shared shell/providers, homepage and styling; system fonts rather than build-time Google Fonts. |
| `app/products/` | Marketplace filters/search/sort and active-product detail routes. |
| `app/seller/` | Seller onboarding, legacy UUID query redirect and UUID store pages. |
| `app/stores/` | Store directory: search, sort and family filters over stores with active listings. |
| `app/sitemap.ts`, `app/robots.ts` | Generated from the live catalogue per request; a catalogue error emits only the stable pages. |
| `app/**/opengraph-image.tsx` | Generated share cards via `next/og` (brand, product, store). |
| `app/components/ThemeToggle.tsx` | Light/dark toggle plus the pre-paint script exported for the layout. |
| `app/cart/`, `app/wishlist/` | Device-local saved shopping pages. |
| `app/context/CartContext.tsx` | Existing cart/reducer extended for hydration, persistent cart/wishlist and current catalogue reconciliation. |
| `app/components/` | Catalogue cards/grids/gallery, navigation/categories, saved-list states, seller contacts and checkout UI. |
| `lib/catalog.ts` | `server-only` anonymous Supabase adapter, explicit columns, active status, normalization and errors; fixture opt-in. |
| `lib/catalog-model.ts` | Public DTOs, ID/category/stock/contact normalization, search/sort/filter model, store directory, related products and pagination. |
| `lib/taxonomy.ts` | Two-level category taxonomy and the read-time mapping from stored labels. See [CATEGORY-TAXONOMY.md](CATEGORY-TAXONOMY.md). |
| `lib/shopping.ts` | Saved list/item rules, cart grouping, eligibility and encoded seller inquiry links. |
| `lib/brand.ts` | Munshi Mart branding and separately labelled platform/onboarding WhatsApp contact. |
| `lib/fixtures.ts` | Explicit local example catalogue; fictional public contacts only in development fixture mode. |
| `app/api/catalog/resolve/route.ts` | Read-only POST, up to 100 valid product IDs, returning current public active items. |
| `app/api/checkout/prepare/route.ts` | Read-only POST, validates one seller's unique items/quantities and rechecks current catalogue/contact before handoff. |
| `tests/`, `scripts/` | Catalogue/shopping/adapter unit tests; public live probes and local headless browser verification. |

## Data and visibility contract

Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are used for database access. Server execution does not grant privileged access; RLS and explicit column grants still apply. Never add `SUPABASE_SERVICE_ROLE_KEY`, internal WhatsApp JID reads or wildcard queries.

The product adapter reads `id,seller_id,product_name,retail_price,price_numeric,quantity,description,category,image_urls,created_at,status` plus `sellers(id,store_name,contact_number)`. Exact `active` visibility is consistent across lists/details/saved-ID resolution. Missing, inactive, null or unknown status is excluded. `price_numeric` is preferred over legacy retail text; missing/invalid price remains unknown, and zero stock disables adding.

The owner approved `sellers.contact_number` for public customer inquiries/orders. Server normalization maps only valid international numbers into `public_whatsapp_number` on the public seller DTO. That DTO name is not a required database column. Missing/invalid/local-only contacts disable seller inquiry; no country code is guessed and private `whatsapp_number` is never converted. Platform support is separately labelled and never substitutes as the seller checkout recipient.

Store URLs use seller UUIDs, not phone/JID. Legacy `/seller?seller=<UUID>` redirects preserve search/category/sort; phone/JID legacy links are not resolved. Store name/UUID/contact are established fields; no public slug/logo/bio/location schema is assumed.

Catalogue pages paginate server-side (24 per page, `page` clamped) so one page is ~145 KB rather than the ~3.4 MB a full render produced. Browsing families/subcategories is derived at read time from the stored category plus, for vague stored categories only, the product name; no schema change was made and the legacy `category` filter still works.

Image URLs on hosts that never serve publicly (WhatsApp internal media references found in some legacy rows) are dropped in the adapter, so a card shows the normal missing-image state rather than a broken frame. This hides nothing public: those bytes are not reachable by a browser.

Public route data is request-scoped, not a persistent fallback catalogue. Reads have deadlines and distinguish backend errors from empty results. Supabase responses are paginated to avoid silent row-cap truncation; filter/search/sort run over fetched active catalogue data. Indexed server-side search/result pagination is a future scaling consideration.

## Shopping and checkout

`munshi-cart` and `munshi-wishlist` localStorage hold public product snapshots without contacts/JIDs. They are not authenticated accounts, cloud-synced lists or the private database `saved_products` table. Hydration completes before persistence; corrupt/unreadable storage is preserved with an error. Legacy cart snapshots reconcile by product ID rather than trusting old availability.

On initial load, saved-ID changes, window focus and retry, current active items are fetched. Missing/inactive items remain visible but excluded; known stock reductions adjust quantities with a notice. A failed check keeps saved data and blocks an unverified handoff. Cart groups are separated by seller.

Checkout POST validates seller UUID, 1–100 unique item IDs, integer quantities, active product-to-seller relationships, current price/stock and approved seller contact. Invalid items are excluded; a known stock shortfall requests refresh/review. Responses use `Cache-Control: no-store`. The displayed action rechecks on normal click before opening the encoded seller WhatsApp inquiry. The buyer must send it; lists remain saved. The website does not write orders, take payments, reserve or decrement stock.

## Images, fixtures and verification

Existing HTTPS image URLs retain stored order. Unoptimized `next/image` supports arbitrary seller/CDN HTTPS URLs without changing an allowlist; gallery/missing/broken-image states are handled. Fixture SVGs are clearly examples, not seller uploads.

`MUNSHI_CATALOG_FIXTURES=1` is explicit and labelled; a live error never enables fixtures. Fictional public contacts additionally require `NODE_ENV=development`. Production fixture previews omit those contacts. Keep the variable absent from the actual Vercel deployment.

Run lint, unit tests and build as described in the README; the browser harness supports fixture, live, shopping and polish modes. Use only one QA mode per run. Live anonymous probes are read-only; shopping suites inspect/intercept handoffs without sending messages. `.qa/`, credentials and browser profiles are ignored local artifacts.

## Maintainer handover

The production URL supplied by the owner is `https://munshi-mart.vercel.app/`; the frontend repository is `OsmanAbbasi/munshi-mart`. See [deployment and indexing](DEPLOYMENT-AND-INDEXING.md) for the Git boundary, deployment evidence, commit-author correction and Google verification-file workflow. The verification HTML asset is present; successful Search Console verification and search indexing have not been confirmed. A sitemap and product/store-specific SEO metadata remain future work.

Read [AGENTS.md](../AGENTS.md) before frontend code edits and consult the installed Next.js docs for this pinned release. Preserve anonymous public projection and the approved-contact boundary when changing UX. Catalogue errors must not display fixture merchandise as real data. Cart snapshots are not current authority for stock/price/contact. Deploy through the existing frontend Git/Vercel workflow; no Oracle code upload or SQL migration is needed for documentation-only edits.

Historical implementation reports are [catalogue/design](../FRONTEND-REPORT.md), [shopping](../SHOPPING-REPORT.md) and [verification](../FINAL-VERIFICATION-REPORT.md). Their old unapproved-contact blocker is superseded by [SELLER-CONTACT-UPDATE.md](../SELLER-CONTACT-UPDATE.md). Test counts and deployment statements in those reports describe their original stage, not a fresh check.
