# Munshi Mart — final local frontend verification

Historical verification report, retained as evidence of that stage. See [current README](README.md) and [architecture](docs/ARCHITECTURE.md) for today's contract. [SELLER-CONTACT-UPDATE.md](SELLER-CONTACT-UPDATE.md) supersedes any unresolved-contact blocker below. This report's local results and deployment statements are not a fresh production audit.

7 November 2026. Reviewed `FRONTEND-REPORT.md` (passes 1–2), `SHOPPING-REPORT.md` (pass 3), and the current implementation. Verification is local; nothing was deployed. All changes are inside the storefront.

## Reproduced defects and fixes

| Issue reproduced in the browser | Fix and result |
| --- | --- |
| Escape left the mobile menu open. | Added Escape dismissal and focus return to the menu toggle. |
| Opening the cart dialog left background scrolling and background navigation available. | Lock body scrolling while open, make background siblings inert, and restore their prior states on close/unmount. Keyboard Tab/Shift-Tab containment, Escape, focus return and visible focus now pass. |
| Missing-image description had only 2.86:1 contrast. | Darkened placeholder text; measured 5.56:1 after the fix. Search placeholder text now uses an explicit readable color too. |
| The floating WhatsApp action said only “Chat on WhatsApp,” obscuring the distinction between platform support and seller chat. | Explicit platform-support accessible name and title, a visible desktop Support label, and a compact high-contrast mobile control. Removed the distracting pulsing animation. |

The established dark green/yellow design, routes, catalog integration, saved-list storage keys, seller matching and checkout behavior were preserved. No catalog/schema/contact fields were invented for live use.

The audit driver initially used the DevTools Alt modifier where it intended Shift. Correcting it verified the existing Shift-Tab trap; this was a test-driver issue, not a claimed storefront defect. The driver now rejects conflicting fixture/live/polish flags so results cannot be mislabeled.

## Fixture results — explicitly local demo data

| Suite / scenario | Result |
| --- | --- |
| Existing catalog/responsive browser suite | **62 checks passed**. Homepage, marketplace, combined search/category/numeric sorting, shared URL refresh, two seller stores, product links/gallery, inactive and legacy-null exclusions, unknown stores, empty results, missing images and cart behavior. |
| Existing device-local shopping browser suite | **41 checks passed**. Old-cart hydration, saved quantity/reload, wishlist count/control synchronization, two-seller messages, stale products, zero stock, stock reductions, a missing/invalid-contact store, failed catalog request and Retry catalog recovery. |
| Final polish/buyer-journey browser suite | **41 checks passed**. Keyboard menu/dialog/focus/scroll behavior, measured placeholder contrast, support labeling, empty category, unknown seller/product, overflow at 320/390/768/1440 px, fresh buyer controls and two intercepted handoffs, saved-list preservation and an actual failed-image response followed by successful selection of another image. |
| Production fixture-contact guard | **2 checks passed**. Production product DTOs omit development contacts; production checkout for the fictional contact is blocked with 422. |

The final journey used the actual product save/add controls, added products from two sellers, changed quantity, reloaded and checked the cart/wishlist. Each seller's encoded message had its own normalized recipient, correct product name/quantity and absolute URL from the current local storefront origin. The handoff click performed a fresh server check. Both external document requests were intercepted and fulfilled locally before reaching WhatsApp; the buyer lists remained saved after returning to the storefront. **No WhatsApp message was sent.**

The deliberate catalog failure is an intercepted 503 on the saved-product catalog endpoint, exercising the real browser error/retry flow. The deliberate image failure is an intercepted 404 on a fixture image, exercising the real product-image fallback and gallery recovery. Server catalog error handling is also covered by the existing tests.

No JavaScript runtime exceptions were recorded in the successful suites. These are targeted local checks, not a claim of a full screen-reader or WCAG certification.

## Live results — actual anonymous Supabase catalog

- The existing read-only probe succeeded: **50 active product samples**, **9 public store profiles**, and **50 status samples**, including inactive rows.
- The live production-preview browser suite passed **46 checks**. At 1440×1100 and 390×844, it checked the homepage, marketplace, seller entry/store and product detail routes. It verified the same real product in its marketplace category and correct seller store, isolation between two populated stores, combined filtering and numeric price sorting, inactive exclusion from both stores and marketplace, unavailable direct URLs for real inactive products, and a live multi-image gallery.
- Live pages correctly show seller contact unavailable and platform support separately. **Successful direct seller chat and per-seller checkout are NOT verified on live data.** Those successful paths were exercised only with development fixtures.

## Commands and final checks

```powershell
node --test tests/*.test.mjs
npm run lint
npm run build
```

Results: **19 tests passed**, **lint passed with zero errors/warnings**, and **production build passed**, including TypeScript and all storefront/read-only API routes. Next's existing nonfatal parent-lockfile warning remains. Hosting/root configuration and dependency manifests were not changed.

Browser commands, each in a shell with no other QA mode enabled:

```powershell
# Fixture catalog + approved development contacts: next dev, MUNSHI_CATALOG_FIXTURES=1, port 3100
node scripts/verify-browser.mjs
$env:QA_SHOPPING='1'; node scripts/verify-browser.mjs
$env:QA_POLISH='1'; node scripts/verify-browser.mjs

# Separate live production preview, no MUNSHI_CATALOG_FIXTURES, port 3101
node --env-file=.env.local scripts/probe-live-catalog.mjs
$env:QA_LIVE='1'; $env:QA_BASE_URL='http://localhost:3101'; node scripts/verify-browser.mjs
```

Clear the previous QA flag before selecting another, or use separate shells. The production contact guard uses a separate `next start` process with catalog fixtures enabled; approved fixture contacts still remain disabled because `NODE_ENV` is production.

## Remaining issues and next-phase dependencies

**Frontend:** no outstanding reproducible blocker in the tested journeys. Local screenshots and machine-readable results are retained in ignored `.qa/`: `browser-results.json`, `shopping-browser-results.json`, `polish-before-fixes.json`, `polish-browser-results.json`, `live-browser-results.json`, and final desktop/mobile cart/wishlist screenshots. External seller images can still be missing or unreachable; the frontend now shows the verified fallback.

**Live seller-contact data:** pass 3's zero-row query confirmed `sellers.public_whatsapp_number` does not exist, and the integration has no verified public WhatsApp approval mapping. A dedicated approved contact source and permission/normalization contract must be established and wired into the server catalog adapter. Neither `contact_number` nor an internal WhatsApp ID is used as consent. Live seller checkout remains intentionally unavailable until this dependency is supplied.

**Supabase access/storage policies:** anonymous public reads work. The probe also returned inactive IDs/status rows; frontend filtering is not a database access boundary. A separate database access-policy/storage review is still required for the next phase. This pass neither audits nor changes RLS, storage policies or privileged access, and does not certify them as production-ready.

**Buyer accounts and orders:** saved lists remain device/browser-local. Buyer sign-in, cross-device sync, order recording, payment/delivery flows and stock reservation remain deferred. Checkout prepares an inquiry only and preserves the cart.

## Files changed in this verification pass

- `app/components/Navbar.tsx`: mobile Escape dismissal and focus return.
- `app/components/CartDrawer.tsx`: modal scroll lock, background isolation and restoration.
- `app/components/WhatsAppButton.tsx`: clear platform-support labeling and simpler control.
- `app/globals.css`: placeholder contrast, compact support styling and contained drawer scrolling.
- `scripts/verify-browser.mjs`: reproducible polish audit, failed-image and intercepted-handoff checks, correct keyboard modifier and exclusive QA mode selection.
- `README.md`: final verification instructions.
- `FINAL-VERIFICATION-REPORT.md`: this report.

Bot, Supabase schema/RLS/storage policies, environment files, deployment configuration, package manifests and lockfiles were left untouched. Local preview processes are stopped after verification; the storefront can be run with the existing README commands.
