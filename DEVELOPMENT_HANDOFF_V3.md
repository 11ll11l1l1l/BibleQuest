# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #86 complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.58-tutorial-avatar-reactions`.
- Exact frozen SHA: `c71db1502618a0a5679bf880fbd830762f9f5ef4`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and must be reset away after use.

## Current #86 state

- Active feature branch: `feature/v3-accessibility-support`.
- Exact green functional candidate: `168a2b32d96d9c999cd6e93879d3215bebfe25da`.
- Targeted exact-SHA run: `34501867982` — `success`.
- Complete accumulated functional run: `34502063494` — `success`.
- The bookkeeping transaction now represents #85 as **Regression-tested** and #86 as **Verified**.
- Provisional inventory: **85 Regression-tested / 1 Verified / 0 Implemented / 14 Not started**.
- Provisional strict implemented-or-better parity: **86/100**.
- Provisional regression stability: **85/100**.
- These bookkeeping values require their own complete exact-SHA verification before v3.59 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #86 verified boundary

- `src/app/accessibility.js` is the only accessibility preference owner; it persists normalized text/motion/contrast state only through shared `storage`.
- `src/ui/accessibility.js` is the single global accessibility presentation runtime; it applies root data attributes and keeps Tab focus inside the visible modal dialog.
- `src/features/accessibility/index.js` owns the explicit Accessibility page reached from More.
- Text options are normal/large/xlarge; motion options are system/reduce/full; contrast options are normal/strong.
- System motion follows live `prefers-reduced-motion`; explicit full/reduce choices remain deterministic.
- Visible keyboard focus, 390px readability/no overflow, preference reload persistence and tutorial reduced-motion integration are regression tested.
- Existing shell route focus and feature-specific Escape/dialog lifecycle remain owned by their existing modules.
- No direct browser storage, `window.BQAccessibility`, MutationObserver, Progress mutation, new API/backend state or new Router owner was introduced.

## Verification evidence

- Targeted run `34501867982`: all exact-SHA targeted architecture/edge/browser integration checks passed.
- Full functional run `34502063494`: complete accumulated architecture, edge/security and browser/mobile suite passed against the same exact product candidate.

## #87 next boundary

#87 Content reporting remains **Not started** until v3.59 freezes. Recover retained reporting behavior and backend/RLS contracts read-only first. Define a single report submission owner, validation and success/error states without bundling #88 moderation or admin review scope into #87.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-accessibility-support` after this bookkeeping transaction.
2. Verify that exact bookkeeping SHA with `scripts/validate-v3-inventory.mjs`, all accumulated architecture validators, all edge/security regressions and the complete browser/mobile suite.
3. Correct only a reproduced failure; do not weaken coverage.
4. On green, reset the verifier and freeze `release/v3.59-accessibility-support` at exactly the green bookkeeping SHA.
5. Verify the release ref.
6. Only then create the #87 feature branch and perform retained-contract recovery before product writes.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; never weaken/delete/skip accumulated regression coverage to get green; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.