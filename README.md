# BibleQuest

BibleQuest is a mobile-first Bible learning PWA built around one clear Daily Journey instead of a menu-first quiz experience.

## Public app

Canonical deployment: `https://mybiblequest.pages.dev/` (Cloudflare Pages)

Compatibility deployment: `https://biblequest-7th.pages.dev/` (Cloudflare Pages)

Both Cloudflare projects are currently attached to this repository and deploy current `main`. Deployment previews use subdomains of the corresponding project host and are not canonical public URLs.

Legacy/fallback deployment: `https://11ll11l1l1l.github.io/BibleQuest/`

Cloudflare Pages is the normal production host. GitHub Pages deployment is manual-only and is not part of the normal release path.

## Core learning loop

The home screen centers on **Continue My Journey — 4 min**. A Daily Journey contains five movements:

1. Retrieve — answer from memory before revealing.
2. Context — read the actual passage and surrounding context.
3. Learn — strengthen one new or weak connection.
4. Apply — use biblical wisdom in a real situation.
5. Reflect — write one concise takeaway or next action.

One meaningful Bible activity is enough to protect the daily streak. Completing all five movements gives the full Daily Journey progress and reveal.

Personal-focus Scripture support is deliberately opt-in from the Daily Journey card; it does not block first visit with an extra chooser.

## Bible World

Learning evidence is visualized as a journey through Scripture:

Creation → Patriarchs → Exodus → Kingdom → Wisdom → Prophets → Jesus → Early Church → Letters

The map reveals as mastery evidence grows. Scripture itself is never locked. World progress is a learning aid, not a measure of spiritual maturity.

Bible World also connects to guided study, adaptive recall, characters, places, short seasons, challenges, avatars, and discovery rewards.

## Bible resources and translations

- Berean Standard Bible (BSB) — bundled/on-demand BibleQuest packs.
- Tagalog ULB / banal na Bibliya — bundled/on-demand with source attribution.
- Japanese 口語訳 — live chapter loading with optional furigana and Japanese vocabulary support.
- NLT — live in-app integration where the official source is available.
- ESV, NIV, AMP — secondary licensed-reader links rather than bulk redistribution.
- STEPBible Hebrew/Greek context packs — all 66 books, used as lexical/context aids.
- Open/public Bible learning resources — see `DATA_SOURCES.md`.

Copyrighted translation text is not relicensed by the BibleQuest MIT code license.

## Doctrinal safety

BibleQuest uses a Scripture-first content policy. Scored material distinguishes direct textual recall from interpretation, doctrinal claims, and application. Sensitive questions are context-framed or quarantined until reviewed.

See `DOCTRINAL_SAFETY.md`.

## Cloud and accounts

BibleQuest currently shares the existing Supabase project used by Karimen to remain within the free-plan project limit. BibleQuest data is isolated with `bible_*` tables, policies, functions, and storage conventions.

Current cloud capabilities include:

- email/password accounts
- cross-device progress snapshots
- private notes and remembered devices
- daily journey sync
- congregation membership and roles
- trusted score events and leaderboards
- assignments and presence
- Journey Groups and encouragements
- couples and congregation challenge infrastructure
- owner/admin tools and password-reset email support

The browser contains only the Supabase project URL and publishable key. Privileged keys stay in server-side Edge Functions.

## Deployment behavior

`cloud-config.js` derives the app root from the current deployment URL. The trusted admin/recovery server boundary accepts the canonical `mybiblequest.pages.dev` host, the `biblequest-7th.pages.dev` compatibility host, their Cloudflare preview subdomains, and the legacy GitHub Pages path.

Cloudflare-specific security headers are defined in `_headers`.

When a new production/custom domain is introduced, update both the Supabase Auth redirect allow-list and the trusted Edge Function origin list. Legacy signup/recovery Edge endpoints are retired and return HTTP 410.

## GitHub Actions policy

All workflows in `.github/workflows/` are intentionally **manual-only** (`workflow_dispatch`). Normal pushes and Cloudflare deployments must not start GitHub Actions jobs.

The repository validator checks this invariant so a later workflow edit cannot silently re-enable automatic Actions usage.

## Validation

Run before release:

```bash
node scripts/validate-release.mjs
```

The validator checks JavaScript syntax, required static assets, service-worker coverage, PWA manifest basics, Bible context-pack integrity, doctrinal/content audits, browser-secret invariants, production auth/admin invariants, and the manual-only GitHub Actions policy.

Browser smoke tests remain available as a manual workflow when a real browser regression run is needed.

## Licensing

Original BibleQuest application code is MIT licensed. Third-party Scripture texts, datasets, libraries, and services retain their own licenses and terms.

See:

- `LICENSE`
- `THIRD_PARTY_NOTICES.md`
- `DATA_SOURCES.md`
