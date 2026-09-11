# BibleQuest v3 — read-only final-release investigator instructions

Date: 2026-09-11
Repository: `11ll11l1l1l/BibleQuest`
Primary control: `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`
Release tracker: Issue #94
Functional rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
Exact-green visual product checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c`

There is **NO autonomous agent captain**. All five BibleQuest automations are read-only investigators. Their purpose is to give the user or a later single release-execution chat precise evidence and correct owner-level actions. They do not implement, integrate, promote or deploy.

## Permissions

All five agents may inspect repository files, branches, commits, diffs, workflows/logs, test evidence, deployment configuration and public production behavior when tools permit.

They MUST NOT edit code/docs/tests/workflows, create or move branches/commits/PRs/issues/comments/reviews, modify `main` or release refs, change Cloudflare/Supabase/DNS/Auth/secrets/data/schema/production configuration, trigger/rerun/cancel workflows, deploy, weaken tests, or apply fixes themselves.

## Mandatory reading

Every investigator must read:

1. Issue #94 and latest release-status comments.
2. `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`.
3. `DEVELOPMENT_HANDOFF_V3.md`.
4. `DEVELOPMENT_STATUS_V3.md`.
5. `VISUAL_REPLACEMENT_CONTRACT_V3.md`.
6. `VISUAL_SURFACE_INVENTORY_V3.md`.
7. `VISUAL_POLISH_PROGRESS_V3.md`.
8. `FEATURE_INVENTORY_V3.md` and `ARCHITECTURE_V3.md` as needed.
9. This file.

Then recover live refs for `main`, `release/v3-production-20260911-r3`, `postrelease/v3-visual-shell-tranche16`, any newer final-integration branch, and exact workflow evidence. Always state the exact product SHA inspected. Do not mistake later documentation-only commits for verified product SHAs.

## Engineering-quality filter

Investigators must reject patch-around recommendations. Flag **ARCHITECTURE RISK** for speculative global CSS overrides, uncontrolled `!important`, duplicate DOM/features/owners, wrong-owner JavaScript shims, hidden controls, catch-all error swallowing, state/storage/API bypasses, copied legacy parallel implementations, test weakening/skipping, or validator changes whose only purpose is to obtain green.

A valid recommendation identifies the true owner/component/file/symbol/asset, explains the intended contract/root cause, proposes the durable correction, and names focused plus accumulated verification required afterward.

## Agent 1 — visual system / asset integrity

Inspect every authoritative release surface for visual completeness and coherence: Home/hero, global shell/navigation, Reader, Games/Kids, Bible World, Progress/Daily Journey, Transform, Study/Deep Questions/Story/Wisdom, Account/Tutorial, Context/Japanese/source presentation, Notes, Couples, Community, Media/Recordings, Adaptive/Open Review, Accessibility, Ministry/Assignments/Notifications/Workspace and any other inventoried surface.

Check visual identity, theme/token consistency, typography/spacing, cards/chips/badges/navigation chrome, iconography, illustrations/backgrounds/assets, stale placeholders, missing assets/fallbacks, asset provenance/licensing, first-load payload impact, stylesheet/load order, and accidental behavior/layout ownership changes. Deliver PASS / GAP / BLOCKER per surface.

## Agent 2 — responsive / accessibility / browser / PWA

Inspect explicit 320/360/390/412/430 px plus representative desktop. Check overflow, clipping, hidden/blocked controls, unreadable labels, cramped navigation, touch targets, focus/keyboard/contrast/semantics, reduced motion, stylesheet/asset loading, console/page errors, PWA install/offline/update/cache behavior, service-worker ownership, deployment/browser implications, and exact-SHA evidence freshness.

## Agent 3 — architecture / security / backend boundary

Compare production r3, exact-green visual checkpoint and any proposed final integration candidate. Check for duplicate owners, route/bootstrap ownership errors, auth/session/permission/privacy regressions, storage/persistence/API/Supabase/RLS/Edge Function boundary changes, privileged client calls, secrets, destructive/incompatible writes, undeployed backend/schema assumptions, service-worker ownership errors, and functional changes hidden inside presentation work.

## Agent 4 — functional UX integrity

Verify actual controls, state transitions, save/persistence behavior, navigation and return paths, recovery/error states and cross-surface flows. Cover Home, Account/sign-in/recovery/tutorial, Reader/translation flows, Games and representative game return, Progress/Daily Journey, Bible World, Transform/Psychometrics, Study/Deep Questions/Story/Wisdom, Notes, Couples, Community, Media/Recordings, Adaptive/Open Review, Ministry/Assignments/Notifications/Workspace, PWA/offline and all other authoritative release surfaces. Do not stop at 'page renders'.

## Agent 5 — release firewall / action compiler

Independently verify primary repository/workflow evidence, then aggregate A1-A4. Deduplicate findings; reject stale-SHA conclusions, speculation, quick hacks, owner bypasses and test weakening; separate required release gaps from optional future improvements; identify the true owner/file/symbol and dependency order for each accepted item; state focused verification required after each action; and compile the complete exact-SHA final release checklist.

## Report contract

Every GAP/BLOCKER finding must include:

- agent role;
- exact branch/SHA inspected;
- exact surface/route/viewport where relevant;
- category: VISUAL / FUNCTIONAL / RESPONSIVE / ACCESSIBILITY / PWA / SECURITY / ARCHITECTURE / RELEASE-EVIDENCE;
- severity: BLOCKER / REQUIRED / NONBLOCKING / INFO;
- concrete evidence/reproduction;
- proven root cause or clearly labeled hypothesis;
- correct owner/file/symbol/asset;
- durable recommended action for the later release executor;
- focused + accumulated verification required;
- `RELEASE BLOCKER: YES/NO`;
- `ARCHITECTURE RISK: YES/NO`.

Vague findings like `improve UI` or `fix CSS` are not acceptable.

## Final-release rule

Investigators are advisory only. The final release must not be called complete while visual work is isolated from production or while the final integrated product SHA lacks complete exact-SHA verification and production smoke evidence on both Cloudflare hosts.