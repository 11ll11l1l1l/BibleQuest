# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen foundation: `release/v3.0-base`.
- Current work branch: `feature/v3-auth-session`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 5 |
| Verified | 2 |
| Implemented | 0 |
| Not started | 93 |
| Total | 100 |

## Done

### Milestone 1 — Foundation

**Regression-tested**

- App shell
- Primary navigation
- Mobile shell/layout
- Global application state
- Storage boundary

Owners:

- `src/app/router.js` — navigation only
- `src/app/store.js` — global state only
- `src/core/storage.js` — browser persistence only
- `src/ui/shell.js` — shell/page lifecycle only

### Milestone 2A — Session core

**Verified**

- Authentication/session lifecycle
- Guest mode

New single owners:

- `src/app/session.js` — all session state/transitions
- `src/core/api.js` — Supabase/browser API adapter
- `src/features/account/index.js` — account/session UI

Verified workflows include:

- guest boot
- controlled invalid login
- successful login contract
- session restoration/reload semantics
- expired-session fallback
- device-local logout
- auth subscription cleanup
- no auth mutation during guest boot
- account UI + guest continuation
- desktop/mobile navigation regression

Production Supabase credentials were **not** used by the browser regression and no throwaway live user was created. The production adapter uses the existing public project configuration while automated successful-login behavior is verified through an injected auth contract.

## Still required before leaving the account/auth domain

- #8 Signup
- #9 Recovery code/password recovery
- #10 Remembered device/security

These must be rebuilt through the same `session`/`api` boundaries; they must not revive `BQAccount` or direct Supabase access from feature code.

## Next major milestone after account/auth

Milestone 3 — Bible data/content loading:

- #11 Bible data service
- #12 English BSB Bible
- #13 Tagalog Bible
- #14 Japanese 口語訳
- #15 Japanese furigana
- #16 Japanese vocabulary learning
- #17 NLT live path
- #18 ESV/NIV/AMP reader links
- #19 Verse Peek
- #20 STEPBible lexical/context tools
- #21 Reader navigation
- #22 Reader search
- #23 Reader read-progress marking

## Defect / root-cause ledger

### V3-ROUTER-001 — URL/view could become temporarily inconsistent

- **Root cause:** router changed `location.hash` and relied on the later asynchronous `hashchange` event to render.
- **Fix:** the single router owner updates history and resolves the route synchronously.
- **Regression test:** Home → Learn → reload → Play → Back → Learn → Forward → Play.

### V3-AUTH-GATE-001 — Supabase version pin was not statically provable

- **Root cause:** runtime URL assembled the pinned version through a template variable, while the architecture gate intentionally requires a literal dependency/version that can be audited without executing code.
- **Fix:** use a literal pinned Supabase ESM URL in `src/core/api.js`.
- **Regression prevention:** architecture validator requires `@supabase/supabase-js@2.112.4` and rejects privileged browser credentials.

### V3-SHELL-001 — duplicate primary-navigation selector contract

- **Root cause:** the top BibleQuest brand reused `data-route-link="home"`, making the primary Home route selector non-unique.
- **Fix:** brand navigation now has `data-brand-home` and calls the same single router; `data-route-link` is reserved for primary navigation.
- **Regression test:** mobile/desktop route loop requires a unique primary route control for every primary destination.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes both:

1. architecture validation; and
2. full browser regression.

No feature status is advanced merely because its screen renders.
