# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: one serialized integration stream
Official V5 integration branch: `v5/feature-completion`
Baseline: current production `main`

## Authority

This file is the single authoritative source for current BibleQuest V5 phase, scope, blockers, candidate identity, and next work. Repository branch/commit/CI/live-backend evidence overrides stale chat context.

**Renumbering note:** the architecture-replacement program previously tracked as "V5" (branch `v5/architecture-upgrade`, `DEVELOPMENT_PLAN_V5.md` covering build tooling/real DB testing/Reader-Games decomposition/media platform/push/offline/Leader Center/multi-congregation) has been renumbered **V6**. Its documents now live at `DEVELOPMENT_PLAN_V6.md` / `V6_ACTIVE_STATUS.md` / `V6_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`, and its branch is `v6/architecture-upgrade`. The full motion/sound/polish rollout that depends on it is renumbered **V7** (`DEVELOPMENT_PLAN_V7.md`). This V5 is a new, product-completeness program on the *current* architecture, sequenced to run first.

## V5 product decision

V5 completes concrete, previously-identified missing/incomplete functionality on the current, already-working architecture. **No architecture, build-tooling, or state-ownership change is in scope for V5** - that is V6's explicit mandate, not V5's. V5 exists so that unfinished product work does not get carried forward and re-done twice across an architecture change.

V4 remains the production fallback until a V5 candidate is explicitly accepted and promoted.

## Current state

**Phase 0 — plan established, no implementation started.**

This document and `DEVELOPMENT_PLAN_V5.md` are the first V5 deliverable. Runtime work begins with Phase 1 (Leader Center) once this plan is reviewed.

## Mandatory V5 outcomes

1. A working Leader Center (previously officially skipped), built entirely from existing Phase 1/Phase 3 capabilities.
2. Admin Console UI for the already-built Phase 2 emergency actions, plus the missing email-change/recovery action.
3. Icon/artwork completion: Games' 21 remaining emoji, remaining Congregation Recognition/Couples/Notification/Encouragements icons, and deletion of the dead Media Library owner.
4. A real, minimum Web Push implementation for existing in-app notification types.
5. A real, minimum offline-reading capability for previously-opened Scripture passages.
6. Multi-congregation verification unblocked (a real second test congregation) plus a minimum active-congregation switcher.
7. Closure of three specific pieces of verification debt: CEBOCB Reader re-verification, Couples Journey bidirectional-sharing verification, and the deferred V4 whole-app audit Sections E/G.

## Phase state

- Phase 1 — Leader Center: CERTIFIED. Checkpoint `release/v5-leader-center` @ dfcb851b38326edef0e4969958eb15866c673c8d, full accumulated suite green including complete browser/mobile, run evidence recorded below.
- Phase 2 — Admin Console completion: NOT STARTED.
- Phase 3 — Icon/artwork completion: NOT STARTED.
- Phase 4 — Push notifications (minimum): NOT STARTED.
- Phase 5 — Baseline offline Bible reading: NOT STARTED.
- Phase 6 — Multi-congregation verification/tooling: NOT STARTED.
- Phase 7 — Verification debt (CEBOCB/Couples Journey/Sections E-G): NOT STARTED.
- Phase 8 — V5 certification and promotion: NOT STARTED.

## Phase 1 evidence (Leader Center)

Built as pure composition over `assignments.js` and `presence.js` - both already server-authorized owners. No new Supabase query, no new RLS, no new state ownership. Un-deferred the Leader Dashboard tool in `ministry-hub.js` (previously blocked on milestone #76) and wired a real `leader-center` route.

**One real correction made mid-build, not shipped as a bug:** the first draft invented a "published/scheduled/closed" categorization and a "total completions" aggregate using fields that do not exist on the assignment row as loaded (`progress` reflects the caller's own status, not a cross-member aggregate). Corrected to only surface what the data actually supports (open vs. scheduled counts); a real per-assignment completion count would need `assignments.loadReview(id)` per assignment and is recorded as a deferred enhancement, not fabricated.

**Two stale test assertions found and fixed while gating** (both from un-deferring a tool that two separate tests had hardcoded as permanently unavailable): `tests/v3-ministry-hub-edge.mjs` and the browser-level `tests/v3-ministry-hub-smoke.mjs` (the second one only surfaced after the edge suite already passed - found by running the actual gate, not local checks alone).

Verification executed and passed on the exact candidate SHA: Cloudflare deployment gate, full accumulated architecture validators, full accumulated edge regressions (including new `v5-leader-center-edge.mjs`), guarded-field-harness syntax checks, and the full accumulated browser/mobile Playwright suite (including new `v5-leader-center-smoke.mjs`: leader sees real data, member sees an honest denied state, 44px mobile targets).

**Deferred, recorded honestly:** per-assignment completion counts on the Overview (needs a per-assignment review call or a new lightweight aggregate, neither built here); Groups & Teams composition currently just links out to the existing Journey Groups/Team Center pages rather than summarizing them inline.

## Sequencing with V6 and V7

`DEVELOPMENT_PLAN_V6.md` (architecture upgrade, formerly numbered V5) and `DEVELOPMENT_PLAN_V7.md` (full motion/sound/polish rollout, formerly numbered V6) are already scoped and do not change. Neither begins until this V5 completes Phase 8 certification. This is a strict sequence, not parallel tracks: complete the product first, transform the base second, apply full polish third.

## How to execute a V5 phase (any agent, with or without prior context)

This is the exact, reproducible pipeline used to certify every V4/V5 checkpoint so far. Follow it precisely - do not shortcut steps even under time pressure, since every shortcut taken this way has previously caused a real regression to slip through.

1. **Clone the current tip of `v5/feature-completion` fresh** (not a stale local copy). Verify the specific gap you're about to fix still exists against this exact tip - repository evidence, not this document, is authoritative.
2. **Implement using only patterns already proven in this codebase**: single-owner services, server-authoritative RLS (never client-side-only gating), the existing `data-*` hook conventions, existing CSS token layers. No new architecture - that is out of scope for V5 by definition.
3. **Write real regression coverage** for the new behavior before considering it done - an edge test for logic, a static contract test for anything CI cannot execute for real (e.g. new SQL/RLS - document this limitation honestly in the test's own comments, per the established pattern), and a browser smoke test for anything user-facing.
4. **Run the complete local suite before every push** - not a partial spot-check. Get the exact list of CI-registered edge tests from the workflow file itself (`grep` the `for test in ...` loop), and run every one of them plus every `scripts/validate-*.mjs`. Partial local checks have missed real regressions multiple times this project; full local runs catch them before they cost a wasted CI cycle.
5. **Commit, then clone fresh again** (a brand-new clone, not your working copy) and re-run step 4 against that fresh clone. This has caught real bugs that a dirty working directory hid.
6. **Fire the real gate**: create an isolated `verify/<short-description>-<short-sha>-<date>` branch from the exact candidate commit, temporarily add a `push:` trigger plus an exact-SHA assertion step to that branch's own copy of the CI workflow, push, and poll until the run completes. Never assume a change is safe without this step - static local checks alone have missed real regressions (an RLS policy text check is not proof RLS works; a unit test mocking a dependency is not proof the real dependency wiring is correct).
7. **If it fails**: get the exact failure (add a debug annotation wrapper to the smoke-test loop if the browser suite fails opaquely - this has been necessary multiple times), fix the *real* cause (which is sometimes your new code, and sometimes a stale assertion in an *older* test that legitimately needs updating - tell these apart by checking whether the underlying behavior actually changed on purpose), then delete the failed verify branch and repeat from step 6 with a fresh one.
8. **Once green on every step including the full browser/mobile suite**: restore the verify branch's workflow file to manual-trigger-only (remove the temporary push trigger and any debug wrapper), then freeze the checkpoint by creating a `release/v5-<phase-name>` branch pointing at the exact verified commit. Never freeze a SHA that has not itself passed the gate - a later commit "probably being fine" is not evidence.
9. **Update `V5_ACTIVE_STATUS.md`** (this file) with the real checkpoint name, exact SHA, and CI run ID as evidence, an honest note of anything genuinely deferred, and any workflow/process issue discovered along the way (with the specific fix, not just the symptom) - the same way every prior phase in this project has been recorded. Move the phase's line in "Phase state" above from NOT STARTED to the real status.
10. **Never claim something is verified that only passed a static/text-matching check** if the real thing (a live database, a live push send, a physical device) was never actually exercised - record that honestly as a known limitation rather than silently upgrading confidence.

If you hit a genuine architecture question mid-phase (something that cannot be solved without changing build tooling, state ownership, or module boundaries), stop and record it as a note for `DEVELOPMENT_PLAN_V6.md` rather than solving it with a V5-scoped workaround that will need to be redone.
