# A3 architecture/security — #85 Tutorial avatar reactions

Agent: `BQ-A3-ARCH-SECURITY`
Reviewed: 2026-09-11 JST

## Exact scope and freshness

- Active milestone: **#85 Tutorial avatar reactions**.
- Canonical: `feature/v3-tutorial-avatar-reactions` at exact `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
- Dedicated candidate: **none found** under `agent/a1-work/085*`.
- Latest frozen v3 base: `release/v3.57-tutorial-onboarding` at exact `f19d51826b9d191c221c0fdd96bda78b42e2aa95`.
- Canonical and frozen base compare **identical**: 0 commits and 0 changed files.
- Exact frozen bookkeeping run: `34496644962` — **success**. Its verifier explicitly checked out/asserted `f19d51826b9d191c221c0fdd96bda78b42e2aa95` and passed inventory, accumulated architecture validators, accumulated edge/security regressions, and accumulated browser/mobile regressions.
- This report becomes stale on movement of canonical/frozen refs, creation or movement of an `agent/a1-work/085*` candidate, any #85 product/test/workflow/schema change, or new exact-run evidence.

## Authoritative contract

**FACT** — `FEATURE_INVENTORY_V3.md` row 85 is `Tutorial avatar reactions`, old/source status `Resource retained`, current status `Not started`, with the bounded contract: **`correct reaction/state; mobile positioning`**.

**FACT** — #84 Tutorial/onboarding is already a separate verified owner. `src/app/tutorial.js` owns tutorial lifecycle/state and completion persistence through shared storage; `src/features/tutorial/index.js` owns overlay presentation/events. The current #85 branch is identical to that frozen #84 state.

**RECOMMENDATION** — #85 must remain a presentation enhancement inside the verified Tutorial owner boundary. Do not reopen #84 account-created trigger, recovery-code, Router, storage, offline-shell, or completion ownership merely to add trainer reactions.

## Retained primary evidence

**FACT** — retained `onboarding-tutorial.js` uses a local static sprite (`assets/tutorial-trainer-sprite.webp`) and a per-step fixed presentation mapping. Each retained step specifies a `trainer` reaction token and left/right `side`; render applies these as presentation classes (`bqt-trainer <reaction>` and `trainer-<side>`). Retained examples include `thoughtful`, `welcome`, `down`, `right`, `left`, `surprise`, `up`, and `thumbs`.

**FACT** — retained dynamic tutorial copy is escaped before insertion where values are variable. The reaction and side identifiers themselves come from static step definitions, not remote/user authority.

**INFERENCE** — the retained architectural intent is a closed, local **step → reaction + position** mapping. The inventory does not require persistence, cloud synchronization, scoring, unlock logic, user-profile avatar mutation, or server authority for #85.

## Current v3 owner inspection

**FACT** — `src/app/tutorial.js` currently publishes only tutorial lifecycle facts (`active`, `step`, `totalSteps`, completion state, back/last state). It does not own avatar/profile state, Supabase writes, authorization, or remote reaction data.

**FACT** — `src/features/tutorial/index.js` derives presentation from the tutorial state and owns the single mounted dialog. Its current trainer is a presentation-only `<aside>` and no #85 reaction implementation exists yet.

**RECOMMENDATION** — preserve one source of truth by deriving reaction/side from the current tutorial step in the Tutorial presentation layer (or a static Tutorial-owned presentation map). Do not create a second tutorial lifecycle store or a general/global avatar-reaction manager for this bounded milestone.

## Schema / RLS / grants / trusted server boundary

**FACT** — because canonical #85 and frozen v3.57 are byte-identical, #85 currently introduces **no changes** to `supabase/schema.sql`, migrations, RLS policies, grants, Edge Functions, trusted functions/RPCs, or API ownership. The repository still contains existing Supabase schema/migration/function surfaces from earlier milestones, but there is no #85 delta to them.

**RECOMMENDATION — safe trust boundary:** #85 should require **no server/authorization path**. Reaction IDs and positions should be a closed local allowlist derived from already-trusted tutorial step state. Static local assets/classes should render them.

**Must not be broadened:**
- no Supabase table/column, migration, RLS or grant changes;
- no RPC/Edge Function or new authenticated mutation;
- no write into Avatar Vault/congregation avatar/profile cosmetics;
- no Progress/XP/streak authority or reward interpretation;
- no recovery-code/session/auth data added to reaction state;
- no remote/user-supplied HTML, class name, asset URL, or arbitrary reaction identifier.

If a future candidate introduces any such authority or persistence, this NORMAL-RISK boundary no longer applies and A3 must reclassify/review the exact candidate before promotion.

## Security observations

**FACT** — current v3 tutorial template uses `innerHTML`, but current step text/action definitions are static module constants. At the frozen/current SHA there is no #85 user-controlled reaction content.

**RECOMMENDATION** — keep #85 reaction keys and side values fixed/allowlisted. Do not make `class`, `src`, style, or HTML fragments directly data-driven from account/profile/cloud input. If accessible reaction descriptions are introduced, use fixed local strings or text-safe DOM assignment rather than untrusted HTML.

## Verification evidence and missing evidence

**FACT** — exact run `34496644962` proves the frozen/current `f19d518...` baseline passes the complete accumulated suite. Its executed architecture list ends at #84 Tutorial/onboarding and contains no #85 validator; its edge/browser lists likewise contain no #85-specific test. That is consistent with inventory status `Not started`, not evidence that #85 works.

**Missing evidence before #85 can be architecture-cleared:**
1. an exact #85 candidate SHA;
2. permanent validation proving reaction/side mapping remains inside the Tutorial presentation owner and does not create a second lifecycle/avatar/backend owner;
3. executable tests for the bounded inventory contract: correct reaction/state transitions and mobile positioning, including back/next/reopen behavior where relevant to the existing tutorial lifecycle;
4. proof no account/recovery-code/auth/cloud/Avatar Vault authority is introduced or broadened;
5. complete accumulated exact-SHA green after the new validator/tests are wired into the permanent workflow.

## A3 disposition

**NORMAL-RISK PRE-IMPLEMENTATION BOUNDARY — NOT A PROMOTION REVIEW.**

There is no #85 candidate to approve or reject. The architecture is safe if implementation stays presentation-only: one Tutorial-owned static mapping from current step to an allowlisted local reaction and mobile side/position, with no new persistence or server authority. A3 should re-audit the exact implementation candidate once it exists; any backend/profile/avatar/auth expansion escalates the review.

## Post-provisional TRIAGE comparison

`automation/TRIAGE.md` was read only after the independent findings above were formed. It is materially stale: it still identifies #82 Avatar Vault at `60100f0c...` as active and blocks #83, while live refs/inventory now show frozen `release/v3.57-tutorial-onboarding` and active #85 at `f19d518...`. TRIAGE therefore is not evidence for this report and should be refreshed by A5 independently.