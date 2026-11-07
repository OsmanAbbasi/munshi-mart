# Munshi Mart — device-local shopping and seller handoff

Completed inside `munshi-storefront`; the bot, Supabase schema/RLS/storage, dependency manifests and deployment configuration are unchanged.

## Behavior delivered

- Extended the existing cart provider/reducer and preserved the `munshi-cart` storage key and original snapshot-array shape. Saved product IDs, names and quantities survive migration. Legacy private seller contact/JID fields are discarded rather than reused.
- Added `munshi-wishlist`, heart controls on cards/details, a header count/link and `/wishlist`. Both lists persist after reload; controls share the same provider. Changes in another tab are observed through storage events.
- Avoided the initial hydration overwrite: lists are read before persistence is enabled. Malformed or unreadable storage is kept intact and reported. Storage write failures warn that changes may not survive reload.
- Resolved saved IDs against active products through a read-only storefront endpoint. Names, prices, seller relations and stock refresh from current data. Missing/inactive/sold-out items stay visible as unavailable. Known stock limits cap additions/quantity changes, and stock reductions adjust quantities with a notice. Unknown stock is explicitly described as needing seller confirmation.
- Catalog fetch failures are errors with a Retry catalog action; saved lists are retained and checkout is blocked until a successful check. No failed fetch is treated as an empty catalog or automatic deletion.
- Grouped cart products by current `products.seller_id`, falling back to saved grouping only for unavailable snapshots. Each group has its own contact/availability state and Order on WhatsApp action. An unavailable group does not block the others.
- Rechecked current active status, stock, product-to-seller relation and approved contact before preparing each seller message. Unavailable/wrong-seller items are excluded; excess stock quantities require a refresh/review. Each message contains only that seller's product names, integer quantities and absolute product URLs based on the current request/storefront origin.
- Preparing an inquiry reveals an encoded handoff link. A normal click rechecks again before opening WhatsApp. Cart storage is never cleared. Copy explains that the buyer must send the message, no order is recorded and no stock is reserved.

## Public seller contact: exact live gap

The existing code and earlier report establish only seller UUID/name as public profile fields. The bot stores `whatsapp_number` as an internal WhatsApp JID and also stores `contact_number`; neither establishes permission for public WhatsApp inquiries. They are not read into public DTOs or converted into recipients.

Live checks in this pass:

- Anonymous `sellers(id,store_name)` reads succeeded.
- OpenAPI/schema metadata access returned 401, so broader column metadata could not be inspected through that endpoint.
- A zero-row column-existence query returned PostgreSQL `42703`: **`column sellers.public_whatsapp_number does not exist`**. No phone values were read.

There is therefore no verified approved live public-contact mapping in this storefront. Live seller/product pages show **Seller chat unavailable**, and their seller checkout is disabled with a reason. The existing platform support number remains separately labeled; it never becomes the recipient of a seller order inquiry.

To enable real seller chat, establish an authorized public source containing a normalized international WhatsApp number plus explicit permission for public inquiries (or an equivalent documented public-view contract). Then map that source in the server catalog adapter for both product and seller reads. The fixture names `public_whatsapp_number` and `public_whatsapp_inquiries_enabled` are an example contract, not a schema migration or a claim that live columns exist. No `contact_number` opt-in is inferred.

Development fixtures explicitly approve two fictional international contacts and include another store with an invalid contact. They are consumed only under `next dev` with `MUNSHI_CATALOG_FIXTURES=1`. Production DTOs omit them, and production checkout rejects them. Normalization accepts international digits, `+` or `00` notation and display punctuation; it rejects local leading-zero numbers, JIDs, letters, extensions and invalid E.164-length syntax. No country code is guessed.

## Verification

- `node --test tests/*.test.mjs`: **19 tests passed**, including the original eight. Added legacy storage compatibility/privacy, malformed storage, stable cross-tab serialization, current stock/seller reconciliation, failure-vs-unavailability behavior, contact approval/normalization, correctly encoded multilingual messages, wrong-seller exclusion, stock conflicts, duplicate IDs and missing-contact/backend-error cases.
- New shopping browser suite: **41 checks passed** at desktop and mobile sizes. It covered legacy-cart hydration/reload, quantity persistence, header counts, wishlist control synchronization/removal/reload, two-seller recipients/messages, stale and zero-stock items, independent missing-contact groups, catalog-failure interception and retry, stock limits, and responsive cart/wishlist pages. No WhatsApp handoff link was opened and no message was sent.
- Existing catalog/responsive browser regression suite: **62 checks passed**, with the former platform-checkout assertion updated to require seller-specific checkout.
- Production fixture guard: **2 checks passed** — fixture contacts absent from production product DTOs and fixture seller checkout blocked with 422.
- `npm run lint`: pass with no errors/warnings.
- `npm run build`: pass, including TypeScript and the new wishlist/read-only API routes. The existing nonfatal parent-lockfile warning remains; hosting configuration was not changed.

Direct-chat and successful per-seller checkout scenarios used development fixtures because approved live seller contacts are unavailable. The live catalog remains anonymous/public; no live seller messages, orders, stock updates or policy changes were attempted. Buyer sign-in and cross-device sync remain deferred.

Reproduction is documented in README.md. Local screenshots and machine-readable results are in ignored `.qa/`, including `shopping-browser-results.json`, `shopping-production-guard.json`, `desktop-shopping-cart.png`, `mobile-shopping-cart.png`, `desktop-wishlist.png` and `mobile-wishlist.png`.

## Files changed for this pass

- `app/context/CartContext.tsx`: cart/wishlist hydration, guarded persistence, reconciliation, counts and retry state.
- `lib/shopping.ts` (new): compatible snapshot parsing, stock limits, reconciliation, seller grouping and message/link construction.
- `lib/catalog-model.ts`, `lib/catalog.ts`, `lib/fixtures.ts`: public-contact contract, development-only fixture mapping and targeted active-product reads.
- `app/api/catalog/resolve/route.ts`, `app/api/checkout/prepare/route.ts` (new): read-only saved-product refresh and seller handoff preparation. They never insert/update/delete records.
- `app/cart/page.tsx`, `app/wishlist/page.tsx` (new): saved-list routes.
- `app/components/SavedListPage.tsx`, `ShoppingItemRow.tsx`, `SavedListsStatus.tsx`, `SellerCheckout.tsx`, `SellerChat.tsx`, `SaveButton.tsx` (new): shared list UI, per-seller checkout, explicit chat states and heart controls.
- `app/components/CartDrawer.tsx`, `ProductCard.tsx`, `ProductActions.tsx`, `Navbar.tsx`, `Icon.tsx`, `app/seller/[id]/page.tsx`, `app/globals.css`: integration into existing shopping/design components. Drawer also supports Escape and keyboard focus containment.
- `tests/shopping.test.mjs` (new), `scripts/verify-browser.mjs`, `README.md`, `SHOPPING-REPORT.md` (new): tests, reproducible browser checks and handoff documentation.
