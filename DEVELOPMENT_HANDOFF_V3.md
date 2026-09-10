# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #85 complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.57-tutorial-onboarding`.
- Exact frozen SHA: `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and must be reset away after use.

## Current #85 state

- Active feature branch: `feature/v3-tutorial-avatar-reactions`.
- Exact green functional candidate: `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`.
- Targeted exact-SHA run: `34499623045` — `success`.
- Complete accumulated functional run: `34499796826` — `success`.
- Earlier rejected targeted runs retained for root-cause history: `34498989910`, `34499380103`.
- The bookkeeping transaction now represents #84 as **Regression-tested** and #85 as **Verified**.
- Provisional inventory: **84 Regression-tested / 1 Verified / 0 Implemented / 15 Not started**.
- Provisional strict implemented-or-better parity: **85/100**.
- Provisional regression stability: **84/100**.
- These bookkeeping values require their own full exact-SHA verification before v3.58 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #85 verified boundary

Tutorial avatar reactions remain presentation-only and compose with the already verified #84 tutorial owner:

- `src/features/tutorial/trainer.js` is static presentation configuration and deterministically maps the six #84 tutorial steps to retained trainer states;
- retained sprite states are `welcome`, `right`, `left`, `up`, `down`, `thumbs`, `surprise`, and `thoughtful` from `assets/tutorial-trainer-sprite.webp`;
- the active six-step mapping is `welcome → down → up → thumbs → thoughtful → thumbs`;
- `src/features/tutorial/index.js` remains the single tutorial overlay presenter and consumes the trainer mapping without owning lifecycle/persistence;
- `src/ui/tutorial.css` owns the retained 4×2 sprite, 122px mobile size/positioning, gentle bob animation and reduced-motion behavior;
- `src/app/tutorial.js` remains the sole tutorial lifecycle/completion owner;
- no new storage, API/backend, account, router, Progress, scoring, or second tutorial-state owner was introduced;
- existing offline-shell ownership is reused and the sprite remains available offline after normal first load.

Permanent #85 evidence:
- `TUTORIAL_AVATAR_REACTIONS_V3.md`
- `src/features/tutorial/trainer.js`
- `src/features/tutorial/index.js`
- `src/ui/tutorial.css`
- `assets/tutorial-trainer-sprite.webp`
- `scripts/validate-v3-tutorial-avatar-reactions.mjs`
- `tests/v3-tutorial-avatar-reactions-edge.mjs`
- `tests/v3-tutorial-avatar-reactions-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent protection

- Run `34498989910`: browser CSS serialization produced `0px 0px` for retained zero-percent sprite position. Product behavior was correct; only the smoke assertion was representation-sensitive. The regression now treats equivalent zero units as equal.
- Run `34499380103`: transformed bounding-box size included the retained trainer bob rotation, so a CSS 122px square measured ~124.1px. Product behavior was correct; size validation now reads computed CSS width/height, while the transformed bounding box still protects against viewport overflow.
- Run `34499623045`: targeted exact-SHA architecture, lifecycle/edge, mobile, reduced-motion and offline checks all green against `51dcc042ca8af6f321474ea3a3bd3c67cdf1650c`.
- Run `34499796826`: complete accumulated architecture, edge/security and browser/mobile suite all green against the same exact functional SHA.

## #86 next boundary

#86 Accessibility support remains **Not started** until v3.58 freezes. Read-only recovery from retained `accessibility-runtime.js`, `accessibility-runtime.css`, and `journey-accessibility.js` establishes persistent text-size/motion/contrast preferences, visible keyboard focus, dialog semantics, keyboard focus containment/restoration, Escape handling, and reduced-motion behavior. The legacy implementation uses direct browser storage, `window.BQAccessibility`, and MutationObserver; those mechanisms must not be ported into clean v3. #86 needs one clean v3 accessibility owner composed through existing storage/UI owners.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-tutorial-avatar-reactions` after this bookkeeping transaction; reconcile any concurrent movement.
2. Treat that exact live tip as the #85 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary `push:` trigger plus exact checkout/assertion.
4. Run `scripts/validate-v3-inventory.mjs`, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite.
5. On failure, correct only the reproduced cause and verify a new exact bookkeeping SHA without weakening coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.58-tutorial-avatar-reactions` at exactly that SHA.
7. Verify the release ref points exactly to the green bookkeeping SHA.
8. Only then create `feature/v3-accessibility-support` from v3.58 and begin #86 implementation from the retained contract.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; never weaken/delete/skip accumulated regression coverage to get green; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.