# Munshi Mart — frontend passes 1 and 2

Completed locally on 7 November 2026. All edits are inside `munshi-storefront`. No deployment was performed.

## Delivered

- Renamed the public frontend **Munshi Mart** and established a responsive forest-green, yellow and warm-paper design across the homepage, header, mobile navigation, marketplace, seller stores and product cards. Added a matching vector brand mark and removed unsupported hardcoded seller/product-count claims.
- Confirmed the original failures before changing code: misplaced seller-page `use client`, build-time Google Font fetching, and 7 lint errors / 7 warnings. The seller entry page is now a server component with no misplaced directive. Interactive components declare `use client` first. The font uses a system stack and makes no remote font requests.
- Preserved `/`, `/products`, `/products/[id]`, `/seller` and `/cart`. Added stable public `/seller/[id]` stores using verified existing seller UUIDs. Safe legacy `/seller?seller=<UUID>` links redirect; phone/JID links do not resolve a store.
- Implemented active-only catalog reads, shared category normalization, combined search/filter/sort URL state, loading, empty, error and unavailable states. Direct product URLs apply the same visibility rule as lists.
- Completed product information, store links, mobile galleries, one/multiple/missing/failed images, availability, numeric price normalization and existing cart actions.
- Moved catalog access to server-only anonymous Supabase reads with an explicit public projection. Private seller IDs used for WhatsApp messaging, seller phone fields, buyer data and service-role credentials are excluded from browser DTOs.
- Kept the cart reducer, localStorage behavior, quantity/removal controls and platform WhatsApp checkout handoff. Updated branding, public seller type and image rendering. Inquiries use the existing platform contact pending a confirmed public seller-contact field.

## Verification

| Check | Result |
| --- | --- |
| `npm run lint` | Pass, zero errors and warnings. |
| `npm run build` | Pass, including TypeScript and all routes. No Google Font request. |
| `node --test tests/*.test.mjs` | 8 passing tests: filter combinations/numeric sorting, category normalization, safe public IDs, server DTO privacy, active/legacy statuses and backend error handling. |
| Fixture browser suite | 62 passing checks using production Next.js and headless Edge. |
| Live catalog browser suite | 45 passing checks using production Next.js and the existing anonymous Supabase integration. |
| Responsive routes | Homepage, marketplace, seller onboarding, individual store and product detail checked at 1440×1100 and 390×844. No horizontal overflow. Mobile navigation and cart exercised. |
| Marketplace/store consistency | Same live product found in its category and correct seller store. |
| Seller isolation | Two populated live stores show distinct products and correct store links; fixture stores also isolated. |
| Filter combinations | Search + category + numeric sort verified together. Fixture controls retain other selections; shared URLs survive refresh. |
| Inactive products | Real inactive direct URLs show unavailable; inactive IDs absent from marketplace and both tested stores. Inactive and null-status fixture direct URLs also excluded. |
| Galleries/availability | Live multi-image gallery switching; fixtures cover single, multiple and missing images, zero and unknown stock. |
| Empty/unknown states | Fixture no-match search, known empty store and unknown store verified. |
| Runtime | No JavaScript runtime exceptions in either browser suite. |

The first live requests failed/timed out in the restricted environment. A later read-only anonymous probe succeeded with network access: 50 active product samples, 9 seller profiles and sampled active/inactive statuses. Live browser verification then succeeded. There are no outstanding live checks from the requested two-store/category/inactive-route scenarios. Fixtures remain useful for deterministic empty, unknown-stock and legacy-null cases, without changing real data.

Screenshots and detailed check results are retained locally in ignored `.qa/`: `desktop-home.png`, `mobile-home.png`, `live-desktop-home.png`, `live-mobile-store.png`, `live-mobile-product.png`, `browser-results.json`, and `live-browser-results.json`. The browser suite can reproduce them using the README instructions. External seller images may load slowly or fail independently of the catalog; broken main/card images have a fallback.

Next still emits a nonfatal warning about the parent repository's lockfile. Its suggested hosting/root configuration changes were deliberately outside this task's scope and were not applied.

## Catalog contract and next-pass gaps

- **Store links:** `products.seller_id` joins `sellers.id`; store URLs use the seller UUID. No public slug is established. Product URLs retain `products.id`.
- **Seller profile:** only `sellers.id` and `store_name` are selected. Public bio, logo, location and banner fields/consent are not established.
- **Visibility:** only exact `status: active` is public, matching the bot. `inactive`, null and unknown legacy statuses fail closed. No rows were changed.
- **Categories:** existing product `category` strings, centralized in `lib/catalog-model.ts`. Canonical bot categories are supplemented by observed catalog categories, such as live `Jewellery` and `Bags`. Blank categories map to `Other`. No category table is required for this pass.
- **Price/stock:** `price_numeric`, `retail_price` and `quantity`; live stock strings normalize to numbers. Missing price/stock has explicit display behavior.
- **Images:** ordered `image_urls`; no storage changes or migrations. Arbitrary existing HTTPS CDN URLs remain supported.
- **WhatsApp:** the bot's `whatsapp_number` contains a messaging JID and must not be digit-stripped into a public phone. It also stores `contact_number`, but a consented public seller contact field and normalization rule are still needed before exposing individual seller chat. The existing platform contact remains available for product inquiries and cart checkout.
- Search currently processes the paginated active catalog on the server. Indexed database search and paginated public results are future scaling work, without affecting current URL behavior.
- Buyer verification, wishlist/cart persistence changes and multi-item WhatsApp order integration remain separate passes.

## Changed-file inventory

Existing routes/layout and styles:

- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/products/page.tsx`, `app/products/ProductsContent.tsx`, `app/products/[id]/page.tsx`
- `app/seller/page.tsx`, `app/cart/page.tsx`

Existing components/types:

- `app/components/Navbar.tsx`, `Footer.tsx`, `SearchBar.tsx`, `CategoryBar.tsx`
- `app/components/ProductCard.tsx`, `ProductGrid.tsx`, `SellerBadge.tsx`
- `app/components/CartDrawer.tsx`, `WhatsAppButton.tsx`
- `app/context/CartContext.tsx` (public seller type only; reducer/persistence unchanged)

Added routes and components:

- `app/seller/[id]/page.tsx`
- `app/loading.tsx`, `app/error.tsx`, `app/not-found.tsx`
- `app/components/CatalogError.tsx`, `Icon.tsx`, `ProductActions.tsx`, `ProductGallery.tsx`, `ProductImage.tsx`

Catalog, assets, verification and documentation:

- Added `lib/catalog.ts`, `catalog-model.ts`, `brand.ts`, `fixtures.ts`; removed obsolete browser client `lib/supabase.js`.
- Added `public/brand-mark.svg` and local demo illustrations `public/fixtures/{tote,tote-detail,headphones,mug,notebook}.svg`.
- Added `scripts/probe-live-catalog.mjs`, `scripts/verify-browser.mjs`, `tests/catalog.test.mjs`, `tests/catalog-data.test.mjs`.
- Updated `.gitignore` to exclude local QA artifacts, replaced boilerplate `README.md`, and added this report.

No application dependencies, package manifests, lockfiles, `next.config.ts`, environment files or deployment settings were changed.
