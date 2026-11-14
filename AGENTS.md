<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Munshi maintainer reading order

Read [README.md](README.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [SELLER-CONTACT-UPDATE.md](SELLER-CONTACT-UPDATE.md) before changes. In the combined backend workspace, also read [the root agent instructions](../AGENTS.md) and [documentation index](../docs/README.md). Keep the generated Next.js rules above intact.

This is a separate Git repository and Vercel deployment. Use anonymous Supabase credentials and explicit public columns only. The owner approved `sellers.contact_number`; never use the private seller WhatsApp JID as a public contact. Website checkout is a verified inquiry handoff, not an order/stock write. Historical reports may describe superseded contact blockers. Do not enable fixture mode on the live website or replace failed live reads with fixtures.
