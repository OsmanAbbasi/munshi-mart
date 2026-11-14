# Deployment and Google indexing handover

[Frontend README](../README.md) · [Architecture](ARCHITECTURE.md) · [Seller contact approval](../SELLER-CONTACT-UPDATE.md)

Recorded 8 November 2026 from this chat and local files/history. This documentation review did not deploy code, connect to Oracle, test the public site, or verify Search Console. Older reports describe their original local-only stages; they do not mean the website is still undeployed.

## Website and repository

- Owner-supplied production URL: **https://munshi-mart.vercel.app/**. The owner reported that it opened correctly; a Vercel screenshot showed the initial production deployment succeeded. The assistant's web tool could not independently access it at that time.
- Private GitHub repository: **OsmanAbbasi/munshi-mart**, production branch `main`. The local directory is `munshi-storefront`, a separate Git repository inside the bot workspace. `munshi-frontend` was an older repository name; do not push to it for this deployment.
- Vercel project: `munshi-mart`, Next.js preset, root directory **`./`** because this repository already starts at the frontend root. The owner selected a Hobby team. The free Hobby plan's personal/noncommercial restriction was discussed; a live commercial marketplace needs a plan/provider whose terms permit that use. No upgrade was established.
- Frontend environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, configured for Production and Preview during import. Keep `MUNSHI_CATALOG_FIXTURES` unset in production. Use the existing Supabase project; no optional Vercel Supabase integration or new database was needed.
- Keep environment files, service-role/bot credentials, `node_modules`, `.next` and ignored `.qa` artifacts out of Git. Speed Insights was discussed as optional performance measurement; it is not required for deployment or indexing, and its installation was not requested/completed in this chat.

## Updating the public frontend

VS Code's integrated terminal works just like another shell. Saving local files alone does not update the website. Run Git commands from the frontend repository and stage only the intended changes:

```powershell
cd "C:\Users\DELL\seller-ai-bot\munshi-storefront"
git status --short
# Run git add with the actual changed frontend file paths.
git diff --cached --name-only
git commit -m "Describe the frontend change"
git push
```

A push to the connected `main` branch triggers Vercel. Confirm the newest deployment shows **Ready**, then test the production URL. A pending/yellow check is not completion; a red check needs its Details inspected. A blocked or failed update does not itself establish that the previous working production deployment stopped serving.

Frontend pushes do not update or restart the Oracle bot, change Supabase policies, or apply SQL. Dependency updates must include both `package.json` and `package-lock.json`. The security update also changed `scripts/probe-live-catalog.mjs` and `scripts/verify-browser.mjs` to reflect approved live contacts; those scripts are QA tools, not runtime requirements. Local history contains `0d710ab` (`Update storefront dependencies for security fixes`), but no successful Vercel result for that revision was shown in this chat. Prior test/audit results belong to that update's report; they were not rerun for this documentation edit.

### Commit-author deployment blocks

The seller-contact push reached GitHub, but Vercel initially blocked deployment. Git attributed it to a second account, and the attempted correction then saved the literal placeholder `YOUR_VERIFIED_OSMANABBASI_EMAIL`. Vercel explicitly reported that invalid author email. GitHub browser sign-in, push authentication and the commit's embedded author identity are different settings.

The owner then configured the frontend repository's Git name/email to match the verified GitHub account connected to the Vercel owner and pushed a new empty trigger commit. The last screenshot showed the correct `OsmanAbbasi` identity with a pending check, not a confirmed Ready deployment. The local correction commits are `8d6c3c7` (placeholder attempt) and `e89a3f4` (verified-account trigger).

For recurrence, inspect the exact Vercel error, `git config user.email`, and `git log -1 --format=fuller`. Correct repository-local `user.name` and `user.email` using the owner's actual verified account values; never paste placeholder text as the email. Use a new commit to trigger deployment rather than force-pushing history or repeatedly redeploying a commit with the wrong author. Do not change another repository's identity settings incidentally.

## Seller buttons and deployment evidence

The owner explicitly approved `sellers.contact_number` for customer inquiries/orders. The server adapter now normalizes that field into the existing public contact DTO for both product joins and seller reads. Internal Baileys `whatsapp_number` IDs remain private. Invalid/missing contacts stay unavailable, and checkout still waits for a successful current-catalog check. See [the contact update](../SELLER-CONTACT-UPDATE.md) for local tests and read-only live counts.

The owner reported disabled buttons before this change and supplied a cart screenshot showing an availability check still in progress. The contact-source fix does not prove that a separately stalled availability request was resolved. Successful live chat/checkout after the update was not demonstrated; future verification should inspect recipients/messages without sending test orders.

## Oracle link configuration is separate

The intended bot link setting is `STOREFRONT_URL=https://munshi-mart.vercel.app` (no trailing slash needed). Changing the local bot `.env` does not update Oracle or deploy the website. This chat did not confirm that the Oracle setting was changed.

Earlier advice to change a source `.env` and simply restart the bot predates the current systemd layout. For the current environment deployment procedure, use the private [Oracle operations runbook](../../MUNSHI-ORACLE-OPERATIONS.md) in the combined workspace: source configuration and the effective service environment have separate paths, and the installer applies updates. A frontend-only update requires neither an Oracle restart nor a VM reboot. Do not publish the private runbook as website content.

## Google Search Console and indexing

Indexing helps buyers discover public products/stores through Google; it is not required for links or WhatsApp handoffs to work. Public production hosting can be indexed on a `vercel.app` subdomain; a paid custom domain is optional. Submission is free and does not guarantee inclusion, timing or ranking. Preview deployments are normally excluded from indexing.

The owner downloaded `google3e8b72e4a64b2250.html`. It was copied unchanged into `public/`, and source/destination hashes matched. Local history contains `51fb62d` (`Add Google Search Console verification`). Expected public URL:

```text
https://munshi-mart.vercel.app/google3e8b72e4a64b2250.html
```

Expected content:

```text
google-site-verification: google3e8b72e4a64b2250.html
```

Remaining owner steps:

1. In Google Search Console, add a **URL-prefix** property for `https://munshi-mart.vercel.app/`.
2. After the verification-file deployment is Ready, open the file URL without logging in and confirm its contents.
3. Select the HTML-file verification method and click **Verify**. Keep the file in `public/` afterward so future deployments retain it.
4. Use URL Inspection for the homepage, test the live URL, and request indexing. Monitor Search Console; repeated requests do not accelerate indexing.

Successful Search Console verification, actual indexing and rankings were **not confirmed** in this chat. The file being committed alone does not prove those outcomes.

The current inspected frontend has basic shared metadata but no sitemap or robots metadata file. A future SEO pass should add a sitemap of intended public pages/active products/stores, unique product/store titles and descriptions, canonical URLs and `noindex` for cart/wishlist pages; review filtered URL duplication too. Submit `sitemap.xml` only once that endpoint exists. Missing sitemap/robots files alone do not establish that indexing is blocked. No SEO runtime changes were made by this documentation pass.

References used during the chat: [Vercel Git deployments and author access](https://vercel.com/docs/git), [Google ownership verification](https://support.google.com/webmasters/answer/9008080), [Google crawl/indexing requests](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl). Recheck provider terms and UI when performing future hosting changes.
