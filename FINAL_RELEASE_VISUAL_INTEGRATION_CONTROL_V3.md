# BibleQuest v3 — final release visual + functional integration control

Status: **MANDATORY PRE-RELEASE CONTROL**
Repository: `11ll11l1l1l/BibleQuest`
Functional rollback baseline: `release/v3-production-20260911-r3` / `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
Visual exact-green checkpoint: `postrelease/v3-visual-shell-tranche16` product SHA `406c34dcdf904b7483bf4381be774a908738e60c`
Release tracker: Issue #94

## Objective

The final official BibleQuest v3 release must include the accepted visual/artwork work and the verified functional behavior together. Functional parity alone is not sufficient. A visually polished branch that is not integrated, or a functional production build that omits the required visual program, is not the final release.

The required result is one exact final candidate SHA that contains:

1. the complete accepted BibleQuest v3 functionality;
2. the completed architecture-preserving visual/artwork program;
3. correct mobile/responsive behavior;
4. correct accessibility, PWA/offline, security, auth, storage and backend boundaries;
5. complete exact-SHA verification evidence;
6. successful production promotion and Cloudflare smoke verification.

## Engineering standard — develop correctly, do not patch around problems

This release must not be assembled through speculative CSS overrides, emergency DOM hacks, duplicated feature owners, one-off JavaScript shims, hidden exceptions, test weakening, skipped validators, copied legacy implementations, or changes that merely mask a root cause.

Every captain change must follow rebuild-and-verify discipline:

- reproduce or establish the requirement;
- identify the true owning component/file;
- understand the existing architecture and contracts before editing;
- make the change in the correct owner rather than layering a parallel implementation;
- preserve one owner per responsibility;
- update focused regression protection when behavior or a required visual contract changes;
- run focused checks first, then the required accumulated suite;
- if the product SHA changes, the changed SHA must earn its own verification;
- reject any fix whose only justification is "it makes the test pass" without preserving the intended product contract.

A smaller correct change is preferred to a broad refactor, but "minimal" must never mean a brittle workaround.

## Required visual direction

The final app must clearly read as **Bible Quest**: Bible + journey/adventure + learning/game progression.

Preserve the established interface and routes while improving presentation through the accepted visual system:

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

Do not convert the app into a generic corporate dashboard or a sterile minimalist shell. Do not make serious study/ministry surfaces excessively childish.

## Hard architectural boundaries

Visual integration must not silently change:

- router or route names;
- information architecture or primary navigation model;
- feature ownership or duplicate feature implementations;
- Supabase schema/RLS/Auth/Edge Function/API/storage ownership;
- persistence semantics or storage keys;
- gameplay rules or core feature behavior;
- service-worker/PWA/offline ownership;
- privacy boundaries;
- established mobile/desktop interaction contracts.

If a legitimate requirement needs one of those changes, the captain must treat it as an explicit functional change with its own owner, rationale, regression protection and full verification. It may not be smuggled in as "visual polish."

## Release investigators — five read-only roles

The five investigators remain read-only. Their job is to make the captain faster and more accurate by producing evidence, concrete gaps, exact file/owner references and ordered recommendations. They do not write fixes.

### Agent 1 — visual system / asset integrity investigator

Inspect the completed visual tranches and final integration candidate for:

- missing or inconsistent theme/application of the accepted visual system;
- generic placeholders or stale assets that undermine the BibleQuest identity;
- broken/missing icons, illustrations, backgrounds or fallbacks;
- inconsistent treatment between Home, shell, Reader, Games, Progress, Transform, Study, Account, Community, Media and other classified visual surfaces;
- accidental architecture/DOM/layout behavior changes introduced by visual work;
- asset provenance/licensing risk;
- first-load payload or asset patterns that could materially damage performance/PWA behavior.

Deliver a surface-by-surface matrix: PASS / GAP / BLOCKER, with exact files/classes/assets and recommended owner-level captain action.

### Agent 2 — responsive / accessibility / browser investigator

Inspect the exact candidate at 320/360/390/412/430 widths plus representative desktop coverage. Look for:

- overflow, clipping, hidden controls, blocked touch targets or unreadable labels;
- focus, keyboard, contrast and semantic regressions;
- reduced-motion violations;
- visual loading/order problems;
- browser console/page errors caused by presentation integration;
- stale verification evidence that belongs to another SHA.

Report exact routes, widths, evidence and tests the captain must execute or correct.

### Agent 3 — functional surface / UX integrity investigator

Verify that visual integration did not degrade functionality across the actual release surface, including:

- Home/navigation;
- Account/sign-in/recovery;
- Reader/translation flows;
- Games and representative game return flow;
- Progress/Daily Journey;
- Transform/Psychometrics;
- Study/Deep Questions/Story/Wisdom;
- Notes/Couples/Community/Media where included;
- Ministry/Assignments/Notifications/Workspace surfaces where included;
- PWA/offline entry and recovery.

Do not merely check that pages render. Check that the intended controls, state transitions and return paths still work.

### Agent 4 — architecture / security / backend boundary investigator

Inspect diffs between the functional r3 baseline, completed visual checkpoint and proposed final integration candidate. Confirm:

- no duplicate owners or parallel implementations;
- no visual changes have altered auth, permissions, storage, APIs, Supabase or privacy boundaries;
- no secrets or privileged calls are exposed;
- no frontend assumption now requires an undeployed backend/schema change;
- service-worker/offline ownership remains correct;
- any legitimate functional change is explicitly owned and tested rather than hidden in presentation files.

### Agent 5 — release firewall / captain action compiler

Aggregate the other four agents plus workflow/repository evidence. Produce one ordered captain execution list.

The firewall must:

- deduplicate findings;
- reject speculative/no-evidence changes;
- reject quick hacks and owner-bypassing fixes;
- flag recommendations that would weaken tests or architecture to get green;
- distinguish required release integration gaps from optional future enhancements;
- identify the correct owner/file for each accepted gap;
- state the exact verification needed after each class of change;
- preserve r3 as rollback while ensuring the final official release includes the mandatory visual milestone.

## Investigator report contract

Every finding must include:

- agent role;
- exact branch/SHA inspected;
- exact surface/route/width where relevant;
- category: VISUAL / FUNCTIONAL / RESPONSIVE / ACCESSIBILITY / PWA / SECURITY / ARCHITECTURE / RELEASE-EVIDENCE;
- severity: BLOCKER / REQUIRED / NONBLOCKING / INFO;
- evidence;
- root-cause hypothesis, clearly labeled if not proven;
- correct architectural owner/file/symbol;
- recommended captain action;
- tests/validators that must prove the correction;
- release blocker: YES/NO.

Agents should not send vague requests such as "improve UI" or "fix CSS." Findings must be actionable enough that a later captain can make the correct owner-level change without rediscovering the entire problem.

## Captain integration sequence

1. Recover live refs and concurrent work; never assume chat context is current.
2. Preserve `release/v3-production-20260911-r3` as rollback/reference.
3. Recover exact-green visual product SHA `406c34dcdf904b7483bf4381be774a908738e60c` and all later evidence-only/docs commits separately.
4. Read Issue #94, `VISUAL_REPLACEMENT_CONTRACT_V3.md`, `VISUAL_SURFACE_INVENTORY_V3.md`, `VISUAL_POLISH_PROGRESS_V3.md`, current handoff/status and investigator reports.
5. Establish the intended integration branch from the correct verified product lineage. Do not merge unrelated experimental/post-release feature work.
6. Reconcile any functional work that is explicitly required for final release; use the correct architectural owner and add regression protection.
7. Integrate the accepted visual state without reverting working functional fixes.
8. Run focused checks after each owned correction.
9. Freeze one exact candidate SHA.
10. Run the complete final exact-SHA verification cycle.
11. Promote only that exact green state to production.
12. Verify both Cloudflare hosts and confirm production visually/functionally matches the verified candidate.
13. Update status/handoff with the exact final product SHA, workflow evidence and any unexecuted physical-device acceptance.

## Mandatory final verification

The final candidate must pass, on the exact SHA promoted:

- Cloudflare deployment gate / production build entry;
- complete accumulated architecture/static validators;
- complete accumulated edge/security regressions;
- complete accumulated browser/mobile regression suite;
- visual static contracts and asset/fallback checks;
- explicit 320/360/390/412/430 mobile width acceptance;
- accessibility and reduced-motion checks;
- PWA install/offline/service-worker/cache-upgrade checks;
- core functional smoke across Home, Account, Reader, Games, Transform and the other included release surfaces;
- no console/page errors attributable to integration;
- exact-SHA/diff hygiene;
- production propagation/smoke on both Cloudflare hosts.

No PASS may be transferred from r3 or from tranche 16 after the final product SHA changes.

## Stop rules

Do not:

- declare final release complete while required visual work remains isolated from production;
- paper over regressions with `!important`, duplicated DOM, hidden controls, catch-all exception swallowing or test exclusions unless that is genuinely the correct owned design and is justified/tested;
- disable or weaken failing tests merely to obtain green;
- merge unrelated roadmap features into the release candidate;
- revive retired Kids/Kana rows unless the user explicitly reopens them;
- change production Supabase/data without a reproduced requirement and correct migration/rollback plan;
- call the app bug-free.

## Success condition

The final official BibleQuest v3 release is complete only when one exact product SHA contains the accepted functionality and accepted visual program, passes the complete verification cycle, is promoted to production, and both Cloudflare hosts are confirmed to serve that verified state.