# BibleQuest

BibleQuest is a Bible learning, study, family, community and ministry web application with games, assignments, Bible reading, congregation features, administrative tools, PWA/offline support and related learning experiences.

## Production

**BibleQuest V4 RC3 remains the active production release.**

- production host: `https://mybiblequest.pages.dev`
- exact promoted V4 application candidate: `7de1c53ddd33c028498b35bee77be30e56878dec`
- exact production merge: `3c74d4f3600dbb05070ba57adb7c3c0b539a9aeb`
- frozen V4 production/acceptance record: `V4_ACTIVE_STATUS.md`

## Current development — V5 feature completion

The active development line is `v5/feature-completion`.

V5 finishes concrete missing/incomplete functionality on the current proven architecture. It does **not** perform the architecture replacement.

Current V5 scope includes:

- Leader Center;
- Admin Console completion;
- remaining artwork/icon cleanup and dead Media Library cleanup;
- minimum real Web Push;
- baseline offline Scripture reopening;
- second test congregation + active-congregation switcher + isolation verification;
- CEBOCB/Couples Journey/V4 whole-app verification debt;
- exact-SHA V5 certification/promotion.

Five scheduled agents work together on this one V5 program under `V5_COORDINATED_AGENT_PROTOCOL.md`, with parallel non-overlapping implementation and serialized integration.

## Roadmap after V5

### V6 — Engine / architecture upgrade

V6 starts only after V5 is certified. Its baseline is the exact accepted V5 production SHA.

V6 builds the new engine: Vite/TypeScript build system, real Supabase/Postgres CI, typed app kernel/state/data/tenant boundaries, decomposed Reader/Games engines, media engine, push/background-sync engine, security hardening, design/component platform, observability/performance, and foundational motion/sound infrastructure.

Authority: `V6_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V6.md`

### V7 — Full overhaul using the V6 engine

V7 starts only after V6 engine certification. It is the full application overhaul: page structure, UX composition, navigation treatment, visuals, responsive behavior, components, artwork, motion, sound and cross-page cohesion across every active route family.

Authority: `V7_ACTIVE_STATUS.md`
Plan: `DEVELOPMENT_PLAN_V7.md`

Strict order: **V5 feature completion → V6 engine upgrade → V7 full overhaul**.

## Before changing anything

Read these in order:

1. `DOCUMENTATION_INDEX.md` — cross-version authority map.
2. `V5_ACTIVE_STATUS.md` — current active development authority.
3. `DEVELOPMENT_PLAN_V5.md` — current feature-completion plan.
4. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md` — V5 release-blocking inventory.
5. `V5_COORDINATED_AGENT_PROTOCOL.md` — five-agent execution rules.
6. `V6_ACTIVE_STATUS.md` / `DEVELOPMENT_PLAN_V6.md` — future engine plan; blocked by V5.
7. `V7_ACTIVE_STATUS.md` / `DEVELOPMENT_PLAN_V7.md` — future overhaul plan; blocked by V6.
8. `BACKUP_MANIFEST.md` — canonical frozen backups.

## Version archives

- V3 archive: `docs/archive/v3/README.md`
- V4 archive: `docs/archive/v4/README.md`
- archive policy/index: `docs/archive/README.md`

Historical V3/V4 documents intentionally remain where tests, workflows, validators or old links may still reference them.

## Active V5 execution rules

- V5 stays on the current architecture; architecture work belongs to V6.
- Five agents may prepare independent non-overlapping V5 tranches, but integration into `v5/feature-completion` is serialized.
- Server authorization remains authoritative; client visibility is never permission.
- Do not weaken RLS/security/tests merely to finish a feature.
- Do not fabricate field/device evidence; `WAIVED` is not `PASS`.
- Do not pull V7 visual-overhaul work into V5.
- Preserve V4 rollback until V5 production acceptance is complete.

## Validation transition

The repository still contains accumulated V3/V4-named validators/workflows because they protect current behavior. V5 continues using them where applicable. V6 is the version that replaces them with reusable/version-neutral build, database, security, browser, offline and release infrastructure after equivalent-or-stronger coverage exists.