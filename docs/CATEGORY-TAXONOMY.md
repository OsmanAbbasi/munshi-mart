# Category taxonomy

[Frontend README](../README.md) · [Architecture](ARCHITECTURE.md) · [Agent instructions](../AGENTS.md)

Added November 2026. The storefront browses products through a two-level
taxonomy defined once in [`lib/taxonomy.ts`](../lib/taxonomy.ts). This is the
single source of truth for the website; the WhatsApp bot has **not** been
changed yet, and the mapping below is what makes that safe.

## Why it is derived, not stored

The bot writes one free-text string into `products.category`. Its prompts offer
only the original nine values (`Fashion, Electronics, Home & Living, Groceries,
Beauty, Toys, Sports, Books, Other`), but the live catalogue also contains
ad-hoc labels the model produced on its own, for example `Gaming Monitor`,
`50k-100k Pc Build`, `Mechanical Keyboard` and `New Graphic card`.

Nothing in the database was migrated. `placeProduct()` derives a family and
subcategory at read time, so existing rows sort correctly today and keep
working whatever the bot writes next.

## Structure

- **Family** — a browsable department with a slug used in URLs
  (`/products?family=pc-hardware`). 15 families.
- **Subcategory** — a specific label inside a family
  (`/products?family=pc-hardware&sub=Monitors`). ~130 subcategories.

Families deliberately separate the things the owner asked to keep apart:

| Separated | Family |
| --- | --- |
| Hobby-grade / RC parts | `hobby-electronics` (Hobby & RC Electronics) |
| Everyday consumer devices | `consumer-electronics` (Consumer Electronics) |
| PC components and builds | `pc-hardware` (PC & Hardware) |
| Peripherals and desk setup | `computer-accessories` (Computer Accessories) |
| Phones, tablets and their accessories | `mobiles` (Mobiles & Tablets) |
| Play, learning and collecting | `toys` (Toys & Kids) |

`Mobiles & Tablets` and `Computer Accessories` are separate families, as are
`PC & Hardware` and `Consumer Electronics`.

## How a product is placed

`placeProduct({ category, product_name })` resolves in this order:

1. **Exact match** — the stored value equals a known subcategory or family name.
2. **Keyword match** — a scored keyword table. Scoring prefers, in order:
   multi-word keywords, longer keywords, then specific over generic terms.
   Generic words listed in `WEAK` (such as `gaming`, `charger`, `monitor`) only
   win when nothing more specific is present. This matters because seller
   titles are long and full of marketing text: `"ZOTAC GAMING GeForce RTX 5070
   … | Daddu Charger Gaming Store"` must resolve to Graphics Cards, not to
   Gaming (from "GAMING") or Mobiles (from the store name "Daddu Charger").
3. **Name refinement** — only when the stored category is a vague catch-all
   (`Electronics`, `Other`, `misc`, …) is the product *name* consulted. A
   specific stored category always wins over the name.
4. **Fallback** — anything unresolved lands in `Other`. The function never
   throws and never returns null, so a listing is always reachable.

Both the stored text and the keyword table are normalised the same way
(lowercased, punctuation stripped, each word singularised). Keywords are
normalised at module load for this reason — without it a keyword such as
`"graphics card"` could never match, because the input singularises to
`"graphic card"`.

### Adding a label

Add a keyword to `KEYWORDS` in `lib/taxonomy.ts`. Put the generic single words
in `WEAK` so they cannot outrank a precise term. Add a test case to
`tests/catalog.test.mjs` alongside the existing taxonomy tests.

## Mirroring this in the bot (not yet done)

When the bot adopts the taxonomy, `SUBCATEGORIES` in `lib/taxonomy.ts` is the
list its prompts should offer. Four backend locations currently hardcode the
old nine categories:

| File | What it does |
| --- | --- |
| `index.js:658` | New-listing AI prompt category enum |
| `index.js:757` | Edit AI prompt category enum |
| `documents/core.js:7` | `CATEGORIES` array |
| `documents/core.js:35` | Coerces any unlisted value to `Other` |

That last line matters: until it is updated, a document import cannot store a
new subcategory — it would be rewritten to `Other`. The website tolerates both
old and new values, so the backend change can land whenever convenient and
needs no coordinated deploy.

## URL parameters

| Parameter | Meaning |
| --- | --- |
| `family` | Family slug, e.g. `pc-hardware` |
| `sub` | Subcategory label, e.g. `Monitors` |
| `category` | Legacy raw stored label; still honoured so old links work |
| `page` | 1-based page, clamped to the valid range |

`family`, `sub` and `category` can be combined with `search` and `sort`. All
filters are plain links and a GET form, so every view is shareable and works
without JavaScript.
