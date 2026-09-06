# BibleQuest v3 Development Status

Updated: 2026-09-06

This is the working execution ledger. `FEATURE_INVENTORY_V3.md` remains the authoritative 100-capability parity matrix.

## Deployment safety

- Production GitHub Pages: **v2 unchanged** (`gh-pages` is not used for v3 development).
- Last frozen milestone: `release/v3.1-session-core`.
- Current work branch: `feature/v3-account-completion`.
- No Cloudflare changes are part of v3 development.

## Progress summary

| State | Count |
|---|---:|
| Regression-tested | 7 |
| Verified | 3 |
| Implemented | 0 |
| Not started | 90 |
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

**Regression-tested**

- Authentication/session lifecycle
- Guest mode

Single owners:

- `src/app/session.js` — session state/transitions and password change lifecycle
- `src/core/api.js` — Supabase/browser API adapter
- `src/features/account/index.js` — account UI only

Verified workflows include guest boot, controlled login success/failure, reload restoration, expiry fallback, device-local logout, subscription cleanup, zero guest cloud mutation, and desktop/mobile route regression.

### Milestone 2B — Account completion

**Verified**

- Signup
- Recovery code/password recovery
- Remembered device/security

New owner:

- `src/app/account.js` — signup, recovery and remembered-device workflow orchestration

Boundary extensions:

- `src/core/api.js` — only owner of `bq-signup`, `bq-password-reset` and `bible_devices` backend contracts
- `src/core/storage.js` — only owner of persistent browser device identity
- `src/app/session.js` — only owner of current-password verification/password update session transitions
- `src/features/account/index.js` — presentation/events only; no direct Supabase calls

Verified account workflows include:

- signup input validation
- duplicate-account rejection before sign-in/device mutation
- recovery code returned after successful signup
- recovery code preserved even when automatic post-signup sign-in fails
- post-signup sign-in and remembered-device registration
- password recovery with replacement recovery code
- invalid recovery-code rejection contract
- post-recovery sign-in using the new password
- authenticated recovery-code rotation
- current-password verification before password change
- persistent device UUID across service recreation/reload
- idempotent remembered-device upsert (no duplicate on reload)
- current-device identification
- removal of another remembered device
- local prevention of current-device removal
- guest device operations rejected before backend mutation
- signup/recovery/login tab switching and mobile layout regression

Live Supabase was audited read-only for this milestone. `bible_devices` has RLS for authenticated users scoped to `user_id = auth.uid()` on SELECT/INSERT/UPDATE/DELETE and a unique `(user_id, device_key)` index. Existing trusted Edge Functions provide signup and recovery-code hashing/rate-limit/lockout behavior. No Supabase schema or production data was modified to complete this milestone, and automated tests did not create throwaway production users.

## Next major milestone

Milestone 3 — Bible data/content loading and reader core:

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

The milestone must first normalize all Bible sources behind one v3 data-service contract. Reader UI must not load translation packs directly.

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

### V3-SIGNUP-001 — successful signup could lose the one-time recovery code

- **Root cause:** account creation and the optional automatic sign-in were treated as one client success condition. If the trusted signup function created the user and issued the recovery code but automatic sign-in then failed, the client threw away the successful signup result.
- **Fix:** trusted account creation/recovery-code issuance is now the transaction boundary. Auto-sign-in and device registration are follow-up outcomes; a successful recovery code is always returned and shown even when auto-sign-in fails.
- **Regression test:** injected post-signup sign-in failure must still return the exact issued recovery code, report `signedIn=false`, skip device registration and route the user to manual sign-in only after the code is saved.

### V3-ACCOUNT-ACCEPTANCE-001 — two parity requirements were not explicit assertions

- **Root cause:** duplicate-account behavior and post-recovery sign-in were represented by backend/mock capability but were not individually asserted before status promotion.
- **Fix:** status promotion was blocked; explicit transaction tests were added for duplicate rejection and sign-in with the newly reset password.
- **Regression prevention:** `tests/v3-account-edge.mjs` runs before Playwright on every v3 feature-branch candidate.

## Release rule

A release snapshot is created only after the exact ledger/status commit passes all configured v3 gates, including:

1. architecture validation;
2. account transaction-edge regression; and
3. full browser regression.

No feature status is advanced merely because its screen renders.
