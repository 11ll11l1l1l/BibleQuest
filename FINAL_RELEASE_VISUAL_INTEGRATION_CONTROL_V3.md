# BibleQuest v3 — final release visual + functional integration control

Status: **MANDATORY PRE-RELEASE CONTROL**
Repository: `11ll11l1l1l/BibleQuest`
Functional rollback baseline: `release/v3-production-20260911-r3` / `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
Visual exact-green checkpoint: `postrelease/v3-visual-shell-tranche16` product SHA `406c34dcdf904b7483bf4381be774a908738e60c`
Release tracker: Issue #94

## Operating model

There is **NO autonomous agent captain**. The five BibleQuest automations are read-only investigators only. They gather evidence and produce actionable owner-level findings. A separate single release-execution chat may later implement accepted findings and perform integration/promotion. Investigators never write product changes or deploy.

## Objective

The final official BibleQuest v3 release must include the accepted visual/artwork work and the verified functional behavior together. Functional parity alone is not sufficient. A visually polished branch that is not integrated, or a functional production build that omits the required visual program, is not the final release.

The required result is one exact final candidate SHA that contains:

1. complete accepted BibleQuest v3 functionality;
2. the completed architecture-preserving visual/artwork program;
3. correct mobile/responsive behavior;
4. correct accessibility, PWA/offline, security, auth, storage and backend boundaries;
5. complete exact-SHA verification evidence;
6. successful production promotion and Cloudflare smoke verification.

## Engineering standard — develop correctly, do not patch around problems

This release must not be assembled through speculative CSS overrides, emergency DOM hacks, duplicated feature owners, one-off JavaScript shims, hidden exceptions, test weakening, skipped validators, copied legacy implementations, or changes that merely mask a root cause.

Every release change must follow rebuild-and-verify discipline:

- reproduce or establish the requirement;
- identify the true owning component/file;
- understand existing architecture/contracts before editing;
- make the change in the correct owner rather than layering a parallel implementation;
- preserve one owner per responsibility;
- update focused regression protection when behavior or a required visual contract changes;
- run focused checks first, then the required accumulated suite;
- if the product SHA changes, that changed SHA must earn its own verification;
- reject fixes whose only justification is "it makes the test pass" without preserving the intended product contract.

A smaller correct change is preferred to a broad refactor, but "minimal" must never mean a brittle workaround.

## Required visual direction

The final app must clearly read as **Bible Quest**: Bible + journey/adventure + learning/game progression.

Preserve established interface/routes while improving presentation through the accepted visual system:

- coherent color and theme tokens;
- intentional typography treatment and spacing;
- polished cards, surfaces, chips, badges and navigation chrome;
- consistent iconography;
- purposeful illustrations/backgrounds/decorative assets;
- game/achievement/journey cues where appropriate;
- warmer and more playful Games/Kids surfaces;
- calm, readable and trustworthy Reader, Study, Account, Ministry, privacy-sensitive and pastor surfaces;
- clear asset provenance or original/generated artwork;
- safe missing-asset fallbacks;
- reduced-motion-safe decoration and animation;
- no visual dependence that makes controls or meaning disappear if an asset fails.

Do not convert the app into a generic corporate dashboard or sterile minimalist shell. Do not make serious study/ministry surfaces excessively childish.

## Hard architectural boundaries

Visual integration must not silently change router/routes, information architecture, primary navigation, feature ownership, Supabase/RLS/Auth/API/storage ownership, persistence semantics, gameplay rules, service-worker/PWA ownership, privacy boundaries, or established mobile/desktop interaction contracts.

If a legitimate requirement needs one of those changes, the release executor must treat it as an explicit functional change with its own owner, rationale, regression protection and full verification. It may not be smuggled in as "visual polish."

## Five read-only investigators

### Agent 1 — visual system / asset integrity

Inspect all release surfaces for missing/inconsistent visual treatment, stale/generic assets, broken icons/illustrations/backgrounds/fallbacks, inconsistent BibleQuest identity, asset provenance/licensing, load-order conflicts, first-load asset cost, and accidental DOM/layout behavior changes. Deliver PASS / GAP / BLOCKER per surface with exact owning files/assets and durable owner-level recommendations.

### Agent 2 — responsive / accessibility / browser / PWA

Inspect 320/360/390/412/430 px plus representative desktop. Check overflow, clipping, hidden/blocked controls, labels, touch targets, focus/keyboard/contrast/semantics, reduced motion, asset/style load order, console/page errors, PWA install/offline/update/cache behavior, service-worker ownership, deployment/browser implications, and stale exact-SHA evidence.

### Agent 3 — architecture / security / backend boundary

Compare functional r3, exact-green visual checkpoint and proposed final candidate. Confirm no duplicate owners, auth/permission/storage/API/Supabase/privacy boundary regressions, secret exposure, privileged client calls, undeployed schema assumptions, service-worker ownership errors, hidden persistence/gameplay changes, or broad unrelated refactors.

### Agent 4 — functional UX integrity

Verify actual controls, state transitions, persistence, navigation, back/return paths, recovery/error states and cross-surface flows across Home, Account, Reader, Games, Progress/Daily Journey, Bible World, Transform, Study/Deep Questions/Story/Wisdom, Notes, Couples, Community, Media, Adaptive/Open Review, Ministry/Assignments/Notifications/Workspace, PWA/offline, and other authoritative release surfaces.

### Agent 5 — release firewall / action compiler

Aggregate A1-A4 plus primary repository/workflow evidence. Deduplicate findings; reject stale-SHA conclusions, speculation, hacks, owner bypasses and test weakening; distinguish required release gaps from optional future enhancements; identify the true owner/file/symbol; order accepted actions by dependency/risk; and compile the exact verification required after each change and before final promotion.

## Investigator report contract

Every GAP/BLOCKER finding must include:

- agent role;
- exact branch/SHA inspected;
- exact surface/route/viewport where relevant;
- category: VISUAL / FUNCTIONAL / RESPONSIVE / ACCESSIBILITY / PWA / SECURITY / ARCHITECTURE / RELEASE-EVIDENCE;
- severity: BLOCKER / REQUIRED / NONBLOCKING / INFO;
- concrete evidence;
- proven root cause or explicitly labeled hypothesis;
- correct architectural owner/file/symbol/asset;
- durable recommended release-executor action;
- tests/validators/browser checks required afterward;
- release blocker: YES/NO;
- architecture risk: YES/NO.

Vague findings such as "improve UI" or "fix CSS" are not acceptable.

## Final integration sequence for the later release-execution chat

1. Recover live refs/concurrent work; never trust stale chat state.
2. Preserve `release/v3-production-20260911-r3` as rollback/reference.
3. Recover exact-green visual product SHA `406c34dcdf904b7483bf4381be774a908738e60c` separately from later docs-only commits.
4. Read Issue #94, visual contracts/inventory/progress, current handoff/status, and all five investigator outputs.
5. Establish one integration branch from the correct verified product lineage; do not merge unrelated experimental/post-release work.
6. Accept only evidence-backed release gaps and implement them in the true owners.
7. Add/retain focused regression protection and run focused checks after each owned correction.
8. Freeze one exact candidate SHA.
9. Run the complete final exact-SHA verification cycle.
10. Promote only that exact green state to production.
11. Verify both Cloudflare hosts visually and functionally against the exact verified candidate.
12. Update durable handoff/status with final SHA, evidence and any unexecuted physical-device acceptance.

## Mandatory final verification

The exact promoted SHA must pass:

- Cloudflare deployment gate / production build entry;
- complete accumulated architecture/static validators;
- complete accumulated edge/security regressions;
- complete accumulated browser/mobile regression suite;
- visual static contracts and asset/fallback checks;
- explicit 320/360/390/412/430 mobile width acceptance;
- accessibility and reduced-motion checks;
- PWA install/offline/service-worker/cache-upgrade checks;
- core functional smoke across all included release surfaces;
- no integration-caused console/page errors;
- exact-SHA/diff hygiene;
- production propagation/smoke on both Cloudflare hosts.

No PASS may be transferred from r3 or tranche 16 after the final product SHA changes.

## Stop rules

Do not declare the final release complete while required visual work remains isolated from production. Do not paper over regressions with `!important`, duplicated DOM, hidden controls, catch-all exception swallowing, test exclusions, parallel legacy copies, auth/storage bypasses or validator weakening. Do not merge unrelated roadmap features, revive retired Kids/Kana rows unless explicitly reopened, or change production Supabase/data without a reproduced requirement and correct migration/rollback plan.

## Success condition

The final official BibleQuest v3 release is complete only when one exact product SHA contains the accepted functionality and accepted visual program, passes the complete verification cycle, is promoted to production, and both Cloudflare hosts are confirmed to serve that verified state.