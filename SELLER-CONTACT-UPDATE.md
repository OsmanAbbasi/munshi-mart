# Seller contact update

The owner confirmed that `sellers.contact_number` is provided for public customer inquiries and orders. This supersedes the missing approval/source dependency in the earlier pass reports.

`lib/catalog.ts` now selects that field for seller profiles and product seller joins, validates its international format on the server, and maps it to the existing public WhatsApp DTO. Existing seller chat and per-seller checkout consume that DTO; checkout rechecks the seller before handoff. Missing/invalid contacts remain unavailable. No internal Baileys IDs are selected or converted, no country code is guessed, and raw contact fields are not returned. Fixture contacts remain development-only.

Verification: 20 automated tests passed, ESLint passed, production build passed. Added an adapter regression test for normalization, missing/invalid/local numbers, and exclusion of internal IDs. A read-only live anonymous check found 9 sellers: 8 valid international contacts, 1 missing, 0 invalid. No WhatsApp messages were sent. Run `node --env-file=.env.local scripts/check-seller-contacts.mjs` for a contact-count and active-product seller-join check; it does not print numbers.

All changes are inside the storefront. No schema, policies, bot, environment values, or deployment settings were changed. GitHub push/redeployment is still required to update the public website. This change does not address a separately stalled cart availability request, if reproducible.
