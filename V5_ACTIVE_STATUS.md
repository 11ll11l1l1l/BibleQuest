# BibleQuest V5 Official Active Status

Updated: 2026-09-13 JST
Execution model: coordinated five-agent implementation with serialized integration
Official V5 integration branch: `v5/feature-completion`
Current planning/integration baseline: `main` at `dbd092dd5ee0767235c259ed9d697b4a2f446f88`
Production fallback: BibleQuest V4 RC3
Agent protocol: `V5_COORDINATED_AGENT_PROTOCOL.md`
Program tracker: Issue #185

## Authority

This file is the single authoritative source for current BibleQuest V5 phase, scope, blockers, candidate identity and next work. Repository/CI/live-backend evidence overrides stale chat context.

## Version sequence

BibleQuest now follows a strict three-version sequence:

1. **V5 — Feature completion.** Finish concrete missing/incomplete functionality on the current proven architecture.
2. **V6 — Engine / architecture upgrade.** Re-platform the completed V5 product onto the new build/data/state/testing/offline/media engine.
3. **V7 — Full overhaul using the V6 engine.** Rebuild and refine the full user experience, visuals, interaction architecture, motion, sound and cross-page cohesion on the certified V6 engine.

The former architecture-upgrade V5 plan has been renumbered to V6. The former motion/sound rollout has been absorbed and expanded into V7's full-overhaul mandate.

## V5 product decision

V5 completes product functionality **without replacing the application architecture**. No build-system migration, global state rewrite, Reader/Games engine rewrite, new media engine or broad client-platform replacement belongs in V5. Architecture limitations discovered during V5 are recorded for V6 unless a minimal current-architecture fix is required to complete an accepted V5 feature safely.

V4 remains the production fallback until a V5 candidate is explicitly accepted and promoted.

## Current state

**Phase 1 — Leader Center: ACTIVE.**

The five scheduled agents are authorized to work together on one shared V5 program under `V5_COORDINATED_AGENT_PROTOCOL.md`.

- A1: Leader / Ministry / product flows.
- A2: Admin / Supabase / security-sensitive completion.
- A3: Notifications / offline / congregation context.
- A4: Artwork / Reader / Couples / verification debt.
- A5: Integration / dispatch / release-control captain.

A1-A4 may prepare independent non-overlapping tranches in parallel; A5 serializes integration into `v5/feature-completion`. The earlier five independent lab experiments are superseded historical evidence only and must not be continued or bulk-merged.

## Mandatory V5 outcomes

1. Working Leader Center using the capabilities already present in the current architecture.
2. Admin Console UI for existing emergency actions plus the missing email-change/recovery action.
3. Icon/artwork completion, including remaining Games and other documented icon gaps, plus dead Media Library cleanup.
4. Minimum real Web Push for existing notification types with the in-app inbox remaining source of truth.
5. Baseline offline Bible reading for previously-opened Scripture passages.
6. A real second test congregation, minimum active-congregation switcher and executable cross-congregation verification.
7. Closure of verification debt: CEBOCB Reader, Couples Journey bidirectional sharing and V4 whole-app Sections E/G.
8. Exact-SHA V5 certification and controlled production promotion.

## Phase state

- Phase 1 — Leader Center: **ACTIVE**.
- Phase 2 — Admin Console completion: NOT STARTED; independent preparation allowed where it does not overlap Phase 1 ownership.
- Phase 3 — Icon/artwork completion: NOT STARTED; independent preparation allowed.
- Phase 4 — Push notifications (minimum): NOT STARTED; independent preparation allowed after confirming current notification ownership.
- Phase 5 — Baseline offline Bible reading: NOT STARTED; independent preparation allowed only within current architecture.
- Phase 6 — Multi-congregation verification/tooling: NOT STARTED; controlled test-data preparation allowed.
- Phase 7 — Verification debt: NOT STARTED; read-only verification/characterization may proceed early.
- Phase 8 — V5 certification and promotion: NOT STARTED.

## Non-negotiable V5 safety contracts

- Server-side authorization remains authoritative; hidden UI is never treated as permission.
- RLS/privacy/isolation must not be weakened to complete a feature.
- Secrets/privileged credentials never move into client code.
- Copyright/licensing constraints on Bible translations remain in force.
- Real field/device evidence is never fabricated; `WAIVED` is not `PASS`.
- Valid regression/security tests are never weakened merely to get green.
- Production promotion is not performed by an hourly worker acting alone.
- V6/V7 work is not pulled forward into V5 for convenience.

## Sequencing with V6

V6 is **PLANNED / BLOCKED BY V5**. Its baseline is not the old V4 cleanup SHA. When V5 Phase 8 closes, the exact accepted V5 production SHA becomes the only valid V6 starting baseline. V6 then replaces/refactors the engine underneath the now-complete product while preserving V5 behavior/data/security contracts.

## Sequencing with V7

V7 is **PLANNED / BLOCKED BY V6**. It starts only after the V6 engine is certified. V7 may comprehensively overhaul page structure, UX composition, navigation treatment, visual language, components, motion, sound and cross-page cohesion while using the V6 engine instead of inventing another architecture.

## Immediate next gate

1. A1 begins Leader Center implementation from current `v5/feature-completion`.
2. A2-A4 take only non-overlapping V5 completion/verification tasks and use Issue #185 claims before writes.
3. A5 keeps integration serialized, rejects V6/V7 scope drift and updates this status only when phase/blocker/candidate state materially changes.
4. No V6 or V7 runtime implementation begins before its predecessor is certified.

## Release rule

There is no V5 release candidate yet. A V5 RC may be frozen only after Phases 1-7 satisfy `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` and the full accumulated regression/security/browser/PWA evidence is green on one exact candidate SHA. V4 remains rollback until V5 production acceptance is complete.