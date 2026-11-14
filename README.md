# Munshi Mart storefront

Current handover reviewed **8 November 2026**: [frontend architecture/source map](docs/ARCHITECTURE.md), [agent instructions](AGENTS.md), and [approved seller-contact decision](SELLER-CONTACT-UPDATE.md). In the combined workspace, see the [project documentation index](../docs/README.md) and [database contract](../docs/DATABASE.md). This frontend is a separate Git repository deployed on Vercel; the backend runs on Oracle. The owner reports successful deployment/operation overall; this documentation pass did not inspect the active Vercel revision.

Existing Next.js storefront, branded as **Munshi Mart**; this checkout pins Next 16.4.5 and React 19.2.8. This nested checkout contains the frontend only. The WhatsApp bot, Oracle deployment, Supabase schema, RLS and storage policies were not changed by the frontend passes; separate backend/database security stages are documented at the project root.

**Browsing:** a two-level category taxonomy derived at read time (see [docs/CATEGORY-TAXONOMY.md](docs/CATEGORY-TAXONOMY.md)), a `/stores` directory built from the catalogue read the page already performs, cross-store "similar products" rails, pagination, light/dark theming, and generated SEO assets (sitemap, robots, JSON-LD, Open Graph images). No database migration and no backend change was required for any of it.

**Shopping:** device-local cart and wishlist persistence, ID-based catalog refresh, direct seller chat gating, and independent per-seller WhatsApp handoffs are implemented. The owner approved `sellers.contact_number` for public customer inquiries/orders; the current server adapter validates and maps it into the public seller DTO. The contact blocker in older reports is superseded by [SELLER-CONTACT-UPDATE.md](SELLER-CONTACT-UPDATE.md). [SHOPPING-REPORT.md](SHOPPING-REPORT.md) and [FRONTEND-REPORT.md](FRONTEND-REPORT.md) retain historical changes/test evidence.

**Final local verification:** see `FINAL-VERIFICATION-REPORT.md` for the buyer-journey results, fixes, fixture/live separation and next-phase dependencies. The focused keyboard, contrast and intercepted-handoff suite runs with `QA_POLISH=1` against the development fixture preview. Enable only one of `QA_POLISH`, `QA_SHOPPING` or `QA_LIVE` at a time; clear a previous flag or use a separate shell before changing modes.

## Run locally

For the public URL, GitHub/Vercel update steps, blocked-author troubleshooting and Google Search Console setup, see [deployment and indexing handover](docs/DEPLOYMENT-AND-INDEXING.md). That guide separates the owner's working-site confirmation from changes whose live deployment or Google verification was not confirmed in this chat.

Use the existing `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. These are the only Supabase variables the catalog reads. Do not add the bot's service-role credentials.

```powershell
npm ci
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
| `/stores` | Store directory: every store with active listings, searchable by name and filterable by what it stocks. |
| `/seller` | Existing seller onboarding entry point. |
| `/seller/[id]` | Public store, using the seller's existing UUID, with its own active listings and scoped filters. |
| `/seller?seller=<UUID>` | Redirects to `/seller/<UUID>`; preserves search/category/sort. Old phone/JID query links are not resolved. |
| `/cart` | Persistent cart, current stock/availability, seller groups and individually verified WhatsApp handoffs. |
| `/wishlist` | Persistent saved products, removal and adding available products to the cart. |
| `/sitemap.xml`, `/robots.txt` | Generated from the live catalogue on request; a catalogue error publishes only the stable pages rather than delisting products. |
| `/opengraph-image`, `/products/[id]/opengraph-image`, `/seller/[id]/opengraph-image` | Generated share cards (brand, product, store). Public listing data only; never a seller contact number. |
| `/api/catalog/resolve` | Read-only POST accepting up to 100 product IDs; returns current active public product DTOs. |
| `/api/checkout/prepare` | Read-only POST rechecking one seller group and returning an encoded WhatsApp inquiry link. No order or stock writes. |

Filter state lives in `search`, `family`, `sub`, `category`, `sort` and `page` URL parameters. Sort values: `newest`, `price-asc`, `price-desc`; old `retail_price:asc` / `retail_price:desc` URLs remain understood. `family`/`sub` are the two-level [category taxonomy](docs/CATEGORY-TAXONOMY.md); `category` remains the legacy raw stored label so existing links keep working. Results are paginated at 24 per page, server-side, and `page` is clamped to the valid range. Shared views work on reload, direct navigation and without client JavaScript.

Catalogue pages are **paginated**: the full live catalogue rendered in one page was ~3.4 MB of HTML, which matters on a Pakistani mobile connection. One marketplace page is now ~145 KB.

The site has a **light/dark theme**. A small blocking script in `app/layout.tsx` applies the saved or system choice before first paint; the preference is stored in `munshi-theme` and the toggle lives in the header. Colours are CSS custom properties in `app/globals.css`, with a `[data-theme="dark"]` override block — add new colours as tokens rather than literals so both themes stay correct.

`lib/catalog.ts` uses anonymous, server-side Supabase reads and an explicit projection. It does not bypass RLS. Requests have a timeout and distinguish backend failures from empty results. Public catalog requests fail closed and never silently fall back to demo data. Server data is request-scoped; inactive status changes are checked on each route request.

## Existing fields and decisions

| Purpose | Fields used |
| --- | --- |
| Product identity / store relation | `products.id`, `products.seller_id` → `sellers.id`; all inspected IDs are UUIDs. Store URLs never contain a phone number or WhatsApp JID. |
| Public store profile | `sellers.id`, `sellers.store_name`, owner-approved `sellers.contact_number`. Missing name displays “Independent store”; missing seller relation displays an unavailable-store message rather than inventing a profile. |
| Public product display | `product_name`, `description`, `retail_price`, `price_numeric`, `quantity`, `category`, `image_urls`, `created_at`. |
| Visibility | `products.status === 'active'`. The bot publishes `active` and soft-deletes to `inactive`. Null, missing and unknown legacy statuses are excluded consistently, matching the bot's active-only reads. No legacy rows are modified. |
| Price / stock | `price_numeric` preferred, numeric `retail_price` fallback. Existing stock strings normalize to numbers. Missing/invalid prices display “Price on request”; missing stock asks to confirm availability; zero stock disables adding. |
| Categories | Single source in `lib/catalog-model.ts`, based on the bot's current category list. Blank/null categories map to `Other`; newly observed category values are included automatically. Both marketplace and seller pages use the same normalization and options. |
| Images | Existing HTTPS `image_urls` in stored order, with one-image, multiple-image, no-image and failed-image states. Unoptimized `next/image` preserves arbitrary seller/CDN URLs without changing the hosting image allowlist. |

The browser receives public product DTOs, seller UUID/name and only an explicitly approved public WhatsApp contact when provided by a verified source. No `select('*')`, buyer information, internal seller WhatsApp IDs, private phone fields, language preferences or privileged credentials are loaded. The existing cart provider/reducer and `munshi-cart` key are extended rather than replaced by a separate storage system. Old cart snapshots migrate through ID-based reconciliation. `munshi-wishlist` stores saved product snapshots. Neither storage key retains phone numbers or WhatsApp IDs. Persistence starts only after hydration; corrupt/unreadable stored lists are preserved and show an error.

### Current public contact and remaining data gaps

- No public slug was established in the existing code. Verified UUIDs supply stable store URLs now; a future slug can be added without changing product relationships.
- Store name, UUID and the owner-approved public `contact_number` are established public profile fields. Seller bio, logo, location and banner are not inferred or queried.
- The bot's `whatsapp_number` is an internal WhatsApp JID and remains private. The current server adapter reads the separately stored, owner-approved `contact_number`, validates international format and maps it to `public_whatsapp_number` in the DTO. Missing/invalid/local-only numbers disable seller chat/checkout; no country code is guessed. `public_whatsapp_number` and fixture `public_whatsapp_inquiries_enabled` are not assumed database columns. No schema change was required for this contact mapping. Platform support is separately labeled and never silently substitutes for seller checkout. See [the approval/update record](SELLER-CONTACT-UPDATE.md).
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
