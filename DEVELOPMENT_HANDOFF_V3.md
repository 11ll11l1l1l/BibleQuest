# BibleQuest v3 continuation handoff

Updated: 2026-09-11 JST after #84 complete functional verification.

GitHub live refs and exact executed verification evidence are authoritative. Recover live refs before writing because concurrent chats/agents may move development branches.

## Frozen baseline

- Repository: `11ll11l1l1l/BibleQuest`.
- Latest frozen release: `release/v3.56-innovation-suite`.
- Exact frozen SHA: `f04af346f651150a6726f2ae4ebd740e40cdd604`.
- Production v2, `main`, production Cloudflare, production data and production Supabase remain untouched.
- Normal v3 Actions are `workflow_dispatch` only. Temporary `push:` triggers belong only on isolated one-shot verifier branches and must be reset away after use.

## Current #84 state

- Active feature branch: `feature/v3-tutorial-onboarding`.
- Exact green functional candidate: `9f4f018356e48b4f7d7c62887761cffd8278fbd5`.
- Targeted exact-SHA run: `34495068372` — `success`.
- Complete accumulated functional run: `34495260019` — `success`.
- Earlier rejected runs retained for root-cause history: `34493685748`, `34494727258`.
- The bookkeeping transaction now represents #83 as **Regression-tested** and #84 as **Verified**.
- Provisional inventory: **83 Regression-tested / 1 Verified / 0 Implemented / 16 Not started**.
- Provisional strict implemented-or-better parity: **84/100**.
- Provisional regression stability: **83/100**.
- These bookkeeping values require their own full exact-SHA verification before v3.57 can freeze. Do not transfer the functional PASS to the changed bookkeeping SHA.

## #84 verified boundary

Tutorial/onboarding is one clean lifecycle + one presenter, composed through existing v3 owners:

- `src/app/tutorial.js` owns tutorial state and completion persistence through shared `storage` only;
- `src/features/tutorial/index.js` owns the single mounted overlay and presentation events only;
- `src/features/home/index.js` owns only the persistent `Show tutorial` launcher presentation;
- `src/features/account/index.js` remains recovery-code/security presentation owner and invokes onboarding only after the user confirms the one-time code was saved;
- no recovery-code value is passed to tutorial state/callbacks, global events, URLs, logs, analytics, or scratch session storage;
- anonymous Home is not automatically obstructed by onboarding, matching retained production behavior;
- the existing Router remains navigation/history owner;
- the existing offline-shell service remains the only PWA/cache owner;
- #85 Tutorial avatar reactions remains separate and Not started.

Permanent #84 evidence:
- `TUTORIAL_ONBOARDING_V3.md`
- `src/app/tutorial.js`
- `src/features/tutorial/index.js`
- `src/ui/tutorial.css`
- `scripts/validate-v3-tutorial-onboarding.mjs`
- `tests/v3-tutorial-onboarding-edge.mjs`
- `tests/v3-tutorial-onboarding-smoke.mjs`
- accumulated invocation in `.github/workflows/v3-regression.yml`.

## Reproduced defects and permanent protection

- Run `34493685748`: an early candidate auto-opened onboarding whenever anonymous Home rendered, intercepting existing Account interaction. Retained production `onboarding-tutorial.js`/`tutorial-launcher.js` showed this was incorrect. The trigger was restored to account-created/manual-launch semantics; shell regression remains protection against obstruction.
- Run `34494727258`: runtime and shell were green, but the new tutorial smoke advanced from step 1 through step 6 and then waited for close without clicking the distinct `Finish guide` action. This was an off-by-one test defect. Only the smoke sequence was corrected; runtime was unchanged.
- Run `34495068372`: targeted exact-SHA architecture/privacy, lifecycle, shell, account-handoff, mobile and offline checks all green against `9f4f018356e48b4f7d7c62887761cffd8278fbd5`.
- Run `34495260019`: complete accumulated architecture, edge/security and browser/mobile suite all green against the same exact functional SHA.

## #85 next boundary

#85 Tutorial avatar reactions remains **Not started** until v3.57 freezes. It must not be silently bundled into #84. Recover retained trainer reaction/sprite/state/mobile-positioning behavior read-only first, then define a single reaction-state/presentation ownership boundary before product writes.

## Exact next executable sequence

1. Confirm the live tip of `feature/v3-tutorial-onboarding` after this bookkeeping transaction; reconcile any concurrent movement.
2. Treat that exact live tip as the #84 bookkeeping candidate.
3. Create an isolated verifier from that exact SHA with only a temporary `push:` trigger plus exact checkout/assertion.
4. Run `scripts/validate-v3-inventory.mjs`, all accumulated architecture validators, all edge/security regressions, and the complete browser/mobile suite.
5. On failure, correct only the reproduced cause and verify a new exact bookkeeping SHA without weakening coverage.
6. On green, reset the verifier to the clean bookkeeping SHA and freeze `release/v3.57-tutorial-onboarding` at exactly that SHA.
7. Verify the release ref points exactly to the green bookkeeping SHA.
8. Only then create `feature/v3-tutorial-avatar-reactions` from v3.57 and begin #85 read-only recovery/implementation.

## Non-negotiable safety

Rebuild-and-verify; one source of truth per responsibility; no PASS transfer between changed SHAs; normal Actions remain manual-only; never weaken/delete/skip accumulated regression coverage to get green; never modify `main`, production v2, production Cloudflare, production data or production Supabase without separate explicit authorization.
