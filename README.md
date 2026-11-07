# Munshi Mart storefront

Existing Next.js 16 / React 19 storefront, branded as **Munshi Mart**. This checkout contains the frontend only. The WhatsApp bot, Oracle deployment, Supabase schema, RLS and storage policies were not changed by the frontend passes.

**Shopping pass:** device-local cart and wishlist persistence, ID-based catalog refresh, direct seller chat gating, and independent per-seller WhatsApp handoffs are now implemented. See `SHOPPING-REPORT.md` for this pass's changes, tests and live contact gap. `FRONTEND-REPORT.md` describes the earlier catalog/design passes.

**Final local verification:** see `FINAL-VERIFICATION-REPORT.md` for the buyer-journey results, fixes, fixture/live separation and next-phase dependencies. The focused keyboard, contrast and intercepted-handoff suite runs with `QA_POLISH=1` against the development fixture preview. Enable only one of `QA_POLISH`, `QA_SHOPPING` or `QA_LIVE` at a time; clear a previous flag or use a separate shell before changing modes.

## Run locally

Use the existing `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are the only Supabase variables the catalog reads. Do not add the bot's service-role credentials.

```powershell
npm install
npm run dev
```

Production checks:

```powershell
npm run lint
npm run build
node --test tests/*.test.mjs
npm run start
```

Fonts use the system stack (Segoe UI / Arial / Helvetica); the build and page no longer request Google Fonts. No deployment or Next hosting configuration was changed. Next currently prints a nonfatal warning about the parent repository's lockfile.

## Routes and catalog behavior

| Route | Behavior |
| --- | --- |
| `/` | Green/yellow homepage, shared categories, latest active listings, seller onboarding links. |
| `/products` | Active marketplace with search, category and newest/numeric-price sorting. |
| `/products/[id]` | Active product details, gallery, stock, cart actions and public store link; absent/inactive/unknown-status products show not found. |
| `/seller` | Existing seller onboarding entry point. |
| `/seller/[id]` | Public store, using the seller's existing UUID, with its own active listings and scoped filters. |
| `/seller?seller=<UUID>` | Redirects to `/seller/<UUID>`; preserves search/category/sort. Old phone/JID query links are not resolved. |
| `/cart` | Persistent cart, current stock/availability, seller groups and individually verified WhatsApp handoffs. |
| `/wishlist` | Persistent saved products, removal and adding available products to the cart. |
| `/api/catalog/resolve` | Read-only POST accepting up to 100 product IDs; returns current active public product DTOs. |
| `/api/checkout/prepare` | Read-only POST rechecking one seller group and returning an encoded WhatsApp inquiry link. No order or stock writes. |

Filter state lives in `search`, `category` and `sort` URL parameters. Sort values: `newest`, `price-asc`, `price-desc`; old `retail_price:asc` / `retail_price:desc` URLs remain understood. The catalog form applies all three together. Category links retain the search and sort. Shared views work on reload, direct navigation and without client JavaScript.

`lib/catalog.ts` uses anonymous, server-side Supabase reads and an explicit projection. It does not bypass RLS. Requests have a timeout and distinguish backend failures from empty results. Public catalog requests fail closed and never silently fall back to demo data. Server data is request-scoped; inactive status changes are checked on each route request.

## Existing fields and decisions

| Purpose | Fields used |
| --- | --- |
| Product identity / store relation | `products.id`, `products.seller_id` → `sellers.id`; all inspected IDs are UUIDs. Store URLs never contain a phone number or WhatsApp JID. |
| Public store profile | `sellers.id`, `sellers.store_name`. Missing name displays “Independent store”; missing seller relation displays an unavailable-store message rather than inventing a profile. |
| Public product display | `product_name`, `description`, `retail_price`, `price_numeric`, `quantity`, `category`, `image_urls`, `created_at`. |
| Visibility | `products.status === 'active'`. The bot publishes `active` and soft-deletes to `inactive`. Null, missing and unknown legacy statuses are excluded consistently, matching the bot's active-only reads. No legacy rows are modified. |
| Price / stock | `price_numeric` preferred, numeric `retail_price` fallback. Existing stock strings normalize to numbers. Missing/invalid prices display “Price on request”; missing stock asks to confirm availability; zero stock disables adding. |
| Categories | Single source in `lib/catalog-model.ts`, based on the bot's current category list. Blank/null categories map to `Other`; newly observed category values are included automatically. Both marketplace and seller pages use the same normalization and options. |
| Images | Existing HTTPS `image_urls` in stored order, with one-image, multiple-image, no-image and failed-image states. Unoptimized `next/image` preserves arbitrary seller/CDN URLs without changing the hosting image allowlist. |

The browser receives public product DTOs, seller UUID/name and only an explicitly approved public WhatsApp contact when provided by a verified source. No `select('*')`, buyer information, internal seller WhatsApp IDs, private phone fields, language preferences or privileged credentials are loaded. The existing cart provider/reducer and `munshi-cart` key are extended rather than replaced by a separate storage system. Old cart snapshots migrate through ID-based reconciliation. `munshi-wishlist` stores saved product snapshots. Neither storage key retains phone numbers or WhatsApp IDs. Persistence starts only after hydration; corrupt/unreadable stored lists are preserved and show an error.

### Data gaps for the next pass

- No public slug was established in the existing code. Verified UUIDs supply stable store URLs now; a future slug can be added without changing product relationships.
- Only store name and ID are established public profile fields. Seller bio, logo, location, banner and public contact consent were not established, so none are inferred or queried.
- The bot stores `whatsapp_number` as a WhatsApp JID, and separately records `contact_number`. Neither establishes public inquiry consent. Live direct chat/checkout stays unavailable until a verified public-contact source is mapped in the server catalog adapter. A zero-row live query confirmed `sellers.public_whatsapp_number` does not exist. The fixture contract uses `public_whatsapp_number` plus `public_whatsapp_inquiries_enabled: true`; those names are not assumed to be real database columns. No schema changes were made. Platform support is separately labeled and never silently substitutes for seller checkout.
- Categories are currently product strings rather than a category table. `Other` handles uncategorized rows without a migration. Add known categories once in `lib/catalog-model.ts`.
- Legacy stock and price values can be strings. They are normalized for display; there are no database writes or inventory-reservation changes.
- Pagination through Supabase responses prevents the normal row cap from silently cutting off the catalog. Search/filter/sort currently run over the server's active catalog results; indexed server-side search and result pagination are an appropriate future scaling pass.
- Buyer sign-in, cross-device sync, actual order recording and stock reservation remain separate work. This pass persists device-local lists and prepares separate seller inquiry messages only.

## Explicit local fixtures

Fixtures are **opt-in** and clearly labeled on every page. They never activate automatically when a live query fails. They include two stores with three products each, an empty store, an inactive product, a null-status legacy product, zero/unknown stock, single/multiple/missing images and an uncategorized product. Images are local SVG illustrations, not real merchandise.

After a production build, start a separate local fixture preview:

```powershell
$env:MUNSHI_CATALOG_FIXTURES='1'
npm run start -- --port 3100
```

In a second shell:

```powershell
node scripts/verify-browser.mjs
```

This uses installed headless Microsoft Edge and Node's built-in DevTools client; no test/browser packages are downloaded. Set `QA_BROWSER` to a compatible Chromium executable if needed. `QA_BASE_URL` defaults to `http://localhost:3100`. Screenshots and machine-readable results go to ignored `.qa/`. The script closes its browser; stop the preview server when done. The browser profile stays in ignored `.qa/`.

Fixture store: `/seller/10000000-0000-4000-8000-000000000001`. Reference product: `/products/20000000-0000-4000-8000-000000000001`. Inactive and legacy fixture products end in `000000000099` and `000000000098`.

### Live verification

Run a read-only probe using only this frontend's anonymous credentials:

```powershell
node --env-file=.env.local scripts/probe-live-catalog.mjs
```

Start a normal production preview in a shell **without** `MUNSHI_CATALOG_FIXTURES`:

```powershell
npm run start -- --port 3101
```

Then run:

```powershell
$env:QA_LIVE='1'
$env:QA_BASE_URL='http://localhost:3101'
node scripts/verify-browser.mjs
```

The probe reads up to 50 active products, 50 status rows and 10 public store profiles into ignored `.qa/live-catalog-probe.json`. Live browser QA uses those actual IDs to check category/store placement, two-store isolation, combined filtering, numeric price sorting, inactive direct links, gallery switching and desktop/mobile layout. These scripts never send WhatsApp messages or write to Supabase.

See `FRONTEND-REPORT.md` for the actual results and changed-file inventory.

## Shopping verification with development-only approved contacts

Public seller-contact fixtures are available **only** when both `NODE_ENV` is `development` (set by `next dev`) and `MUNSHI_CATALOG_FIXTURES=1`. Production builds omit those contacts even if catalog fixtures are explicitly enabled. Do not use a production preview for the direct-chat fixture scenarios.

```powershell
$env:MUNSHI_CATALOG_FIXTURES='1'
npm run dev -- --port 3100
```

In a second shell:

```powershell
$env:QA_SHOPPING='1'
node scripts/verify-browser.mjs
```

The shopping suite seeds a legacy cart in an isolated browser profile, tests reloads and wishlist controls, inspects two sellers' message recipients and encoded product URLs, adds inactive/sold-out/missing-contact fixtures, and intercepts a catalog failure before retrying. It never clicks a WhatsApp handoff link or sends a message. Fictional contacts use reserved `+1 202 555-01xx` examples.

Saved items are rechecked on initial load, saved-ID changes, window focus and explicit retry. Known stock reductions adjust saved quantities with a notice; missing/inactive items remain visible and excluded. Errors preserve snapshots and block handoff until retry. Each seller action checks current product availability, stock, product-to-seller relation and approved contact on the server. The displayed handoff link rechecks again on a normal click before opening WhatsApp in the current tab. The buyer must still send the message; lists remain saved.
