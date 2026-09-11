# BibleQuest v3 — read-only final-release investigator instructions

Date: 2026-09-11
Repository: `11ll11l1l1l/BibleQuest`
Primary final-release control: `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`
Release tracker: Issue #94
Functional rollback/reference: `release/v3-production-20260911-r3` at `77bd0772cb002371cb3ddaa57cf51cd2bea6b7ac`
Exact-green visual product checkpoint: `406c34dcdf904b7483bf4381be774a908738e60c`

These instructions supersede the older release-agent mission that treated visual findings as post-release/cosmetic work. The final official BibleQuest v3 release is not complete until the accepted visual program and required functionality are integrated into one exact verified production candidate.

## Permissions

All five agents remain **READ-ONLY INVESTIGATORS**.

They may inspect repository files, branches, commits, diffs, workflows/logs, test evidence, deployment configuration, and public production behavior when tools permit.

They MUST NOT:

- edit code or documentation;
- create/update/delete files, branches, commits, PRs, issues, comments or reviews;
- trigger/rerun/cancel workflows;
- modify `main`, release branches, Cloudflare, Supabase, DNS, secrets, schema, Auth, data or production configuration;
- deploy anything;
- apply fixes themselves;
- weaken tests or recommend bypassing architecture merely to get green;
- revive retired Kids/Kana work unless the user explicitly reopens it.

Their job is to give the captain precise evidence and owner-level recommendations so the work can be developed correctly rather than patched.

## Mandatory reading before investigation

Every agent must read:

1. `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`
2. Issue #94 and its latest release-status comment
3. `DEVELOPMENT_HANDOFF_V3.md`
4. `DEVELOPMENT_STATUS_V3.md`
5. `VISUAL_REPLACEMENT_CONTRACT_V3.md`
6. `VISUAL_SURFACE_INVENTORY_V3.md`
7. `VISUAL_POLISH_PROGRESS_V3.md`
8. this file

Then recover live refs for `main`, `release/v3-production-20260911-r3`, `postrelease/v3-visual-shell-tranche16`, and any newer final-integration branch. State the exact product SHA inspected. Never treat later documentation-only HEADs as verified product SHAs unless product files changed and were reverified.

## Engineering-quality filter

Agents must explicitly reject recommendations that amount to a patch-around rather than a correct fix. Flag as **ARCHITECTURE RISK** any proposal that relies on:

- speculative global CSS overrides or uncontrolled `!important` layering;
- duplicated DOM/features/owners;
- one-off JavaScript shims in the wrong owner;
- hidden controls or catch-all error swallowing;
- bypassing state/storage/API ownership;
- weakening or skipping tests;
- copying legacy implementation into a parallel path;
- modifying tests solely to fit current broken behavior.

A valid recommendation should identify the correct component/file/owner, explain the intended contract, and name the focused + accumulated verification needed afterward.

## Agent 1 — visual system / asset integrity investigator

Mission: determine whether the final candidate actually contains the accepted visual/artwork program and whether it is coherent, intentional, performant and architecture-preserving.

Inspect Home/hero, global shell, Reader, Games, Bible World, Progress/Daily Journey, PWA icon treatment, Transform, Study/Deep Questions/Story/Wisdom, Account/Tutorial, Context/Japanese/source presentation, Notes, Couples, Community, Media/Recordings, Adaptive/Open Review and accessibility-related presentation.

Focus on:

- inconsistent/missing visual tranches;
- generic placeholders or stale assets;
- broken/missing icons, illustrations, backgrounds and fallbacks;
- inconsistent BibleQuest adventure/game identity;
- asset provenance/licensing concerns;
- CSS/load-order conflicts;
- visual changes that silently alter layout/DOM behavior;
- decorative payload patterns that could damage first-load/PWA behavior.

Deliver a surface matrix: PASS / GAP / BLOCKER, exact files/classes/assets, and correct owner-level captain action.

## Agent 2 — responsive / accessibility / browser / PWA investigator

Mission: prove that the integrated visual candidate remains usable and correct across the required viewport/accessibility/runtime matrix.

Focus on:

- 320/360/390/412/430 px plus representative desktop behavior;
- overflow, clipping, hidden controls, blocked touch targets, unreadable labels;
- keyboard/focus/contrast/semantic regressions;
- reduced-motion violations;
- asset and stylesheet load-order errors;
- browser console/page errors caused by integration;
- PWA install/offline/service-worker/cache upgrade behavior;
- stale workflow/test evidence from another SHA.

Report exact route, viewport, evidence, likely owner and exact tests the captain must execute or repair.

## Agent 3 — functional surface / UX integrity investigator

Mission: verify the full release surface still works after visual integration. Do not limit inspection to whether a page renders.

Check intended controls, state transitions and return paths across:

- Home/primary navigation;
- Account/sign-in/recovery;
- Reader/translation switching/recovery;
- Games launcher + representative game + clean return;
- Progress/Daily Journey;
- Transform/Psychometrics;
- Study/Deep Questions/Story/Wisdom;
- Notes/Couples/Community/Media where included;
- Ministry/Assignments/Notifications/Workspace where included;
- PWA/offline entry and recovery.

Identify real regressions caused by visual or final-integration work and distinguish them from unrelated future enhancements.

## Agent 4 — architecture / security / backend-boundary investigator

Mission: compare functional r3, exact-green visual checkpoint and proposed final candidate to ensure the release was developed in the correct owners.

Focus on:

- duplicate/parallel feature owners;
- auth/permission/storage/API/Supabase/privacy boundary changes;
- secrets or privileged calls exposed to clients;
- frontend assumptions requiring an undeployed backend/schema change;
- service-worker/offline ownership;
- accidental persistence/gameplay/feature behavior changes hidden inside visual work;
- broad refactors not required for release.

Any legitimate functional change must be explicit, correctly owned, regression-protected and fully verified.

## Agent 5 — release firewall / captain action compiler

Mission: combine the other four reports with repository/workflow evidence into one ordered captain execution plan.

The firewall must:

- deduplicate findings;
- reject speculative/no-evidence work;
- reject hacks, owner bypasses and test weakening;
- separate release-required integration gaps from optional future improvements;
- identify the correct owner/file/symbol for each accepted item;
- order fixes by dependency/risk;
- state required focused verification after each class of change;
- state the complete exact-SHA release gate required before promotion;
- preserve r3 as rollback without allowing it to be mislabeled as the final visual release.

## Report contract

Every finding must include:

- agent role;
- exact branch/SHA inspected;
- exact surface/route/viewport where relevant;
- category: VISUAL / FUNCTIONAL / RESPONSIVE / ACCESSIBILITY / PWA / SECURITY / ARCHITECTURE / RELEASE-EVIDENCE;
- severity: BLOCKER / REQUIRED / NONBLOCKING / INFO;
- evidence;
- root-cause hypothesis, explicitly labeled if not proven;
- correct owner/file/symbol;
- recommended captain action;
- verification required after the correction;
- release blocker: YES/NO;
- architecture-risk flag: YES/NO.

Vague findings such as "improve UI" or "fix CSS" are not acceptable. Reports must be actionable enough that a later captain can implement the correct solution without repeating the investigation.

## Captain boundary

Investigators remain advisory. The user/captain or designated release-execution chat is the only writer. The captain must follow `FINAL_RELEASE_VISUAL_INTEGRATION_CONTROL_V3.md`, implement accepted findings in the correct owners, add/retain regression protection, freeze one exact candidate SHA, run the complete accumulated release suite, promote only the exact green state, and verify both Cloudflare hosts.

The official release must not be marked complete until the required visual program and required functionality coexist in the exact production-verified candidate.