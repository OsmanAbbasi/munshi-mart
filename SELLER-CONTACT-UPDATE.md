# Seller contact update

Current navigation: [README](README.md), [frontend architecture](docs/ARCHITECTURE.md). This file records the authoritative owner contact decision and the tests at that stage. Its final pending-deployment statement is historical; the owner's later general deployment success report does not establish an independently inspected Vercel revision. No deployment was performed by this documentation pass.

The owner confirmed that `sellers.contact_number` is provided for public customer inquiries and orders. This supersedes the missing approval/source dependency in the earlier pass reports.

`lib/catalog.ts` now selects that field for seller profiles and product seller joins, validates its international format on the server, and maps it to the existing public WhatsApp DTO. Existing seller chat and per-seller checkout consume that DTO; checkout rechecks the seller before handoff. Missing/invalid contacts remain unavailable. No internal Baileys IDs are selected or converted, no country code is guessed, and raw contact fields are not returned. Fixture contacts remain development-only.

Verification: 20 automated tests passed, ESLint passed, production build passed. Added an adapter regression test for normalization, missing/invalid/local numbers, and exclusion of internal IDs. A read-only live anonymous check found 9 sellers: 8 valid international contacts, 1 missing, 0 invalid. No WhatsApp messages were sent. Run `node --env-file=.env.local scripts/check-seller-contacts.mjs` for a contact-count and active-product seller-join check; it does not print numbers.

The same stage's read-only product-to-seller join check returned 561 active products, all linked to valid seller contacts. These are historical sample counts, not a fresh audit or a WhatsApp delivery test. The contact change was committed as `bd81e64`; subsequent deployment attempts and identity corrections are recorded in [deployment and indexing](docs/DEPLOYMENT-AND-INDEXING.md). The chat did not establish a successful production chat/checkout test after that update.

All changes are inside the storefront. No schema, policies, bot, environment values, or deployment settings were changed. GitHub push/redeployment is still required to update the public website. This change does not address a separately stalled cart availability request, if reproducible.
