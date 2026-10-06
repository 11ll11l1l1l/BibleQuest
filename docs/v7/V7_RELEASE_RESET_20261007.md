# BibleQuest V7 Release Reset — 2026-10-07

Status: **operative owner override for all remaining V7 work**  
Reset baseline: `v7/development` at `725646bcb512c489f05966ffe83090977c7f3fc3`.

This reset supersedes conflicting remaining-work instructions in earlier V7 phase/lane documents. Earlier artifacts remain historical evidence, but they do not create release blockers when this document replaces them.

## Product goal

Finish BibleQuest V7 as a releasable **Library + structured ONE 2 ONE** release, including the expanded launch content requested after the original V7 scope freeze.

V7 now includes:
- Books launch catalog;
- **minimum 150 release-ready devotionals**, with the pipeline continuing toward **300**;
- complete Tagalog, Cebuano and Ilocano translations for selected English devotionals;
- rights/provenance, Scripture and discovery metadata;
- a rights-clear Past Teachings launch set;
- automated fail-closed content approval;
- an in-app Library audit workflow built on Content Review;
- complete structured ONE 2 ONE;
- automated exact-SHA release certification and deployment verification.

## Retired work structure

The old A1/A2/A3/A4 subdivision is retired.

The old phase-specific persistent lane map is also retired for remaining work. P0–P5 documents remain useful history and test/evidence references, but new work is owned only by the four reset lanes:

- Lane A — issue #1300 — Release Content Factory
- Lane B — issue #1301 — Automated Approval + In-App Audit
- Lane C — issue #1302 — ONE 2 ONE Final Closure
- Lane D — issue #1303 — Release Convergence + Deployment

## Release-gate policy

V7 must not wait on a manual review/evidence task that can be replaced by deterministic automation.

Human editorial approval is no longer the sole publication path. Automated policy approval is valid when:
- the decision truthfully identifies itself as automated;
- all hard-critical source, rights, Scripture, theology, editorial, mapping, translation and metadata gates pass;
- evidence is revision-bound and auditable;
- no human identity is fabricated.

The user's manual audit occurs **after V7 is finished** using the in-app review workflow and is not a release prerequisite.

Physical-device/manual-observation evidence is not a release prerequisite where equivalent product behavior can be established by deterministic browser/device emulation and automated accessibility tests.

## Self-regulation rules

A lane must not stop at a solvable blocker.

- stale branch -> refresh/rebase and continue;
- merge conflict -> resolve against live contracts and rerun affected checks;
- failing test -> diagnose and fix;
- flaky test -> remove the nondeterminism or repair the test;
- inaccessible source -> replace it;
- unclear hosted-content rights -> exclude hosted use and choose a rights-clear replacement;
- weak content mapping -> retag or replace;
- failed translation -> regenerate/revise and re-QA;
- rejected devotional reducing the launch set below 150 -> automatically backfill;
- missing fixture -> create a deterministic fixture;
- manual evidence requirement -> automate it or remove it when it does not establish an otherwise-unautomatable product requirement.

No lane may fabricate success, rights, source material, reviewer identity or test evidence.

## Parallel ownership

The four lanes intentionally own disjoint primary surfaces. They may run simultaneously from the live integration head.

Lane D becomes final candidate owner only after A/B/C outputs converge; its preparation work runs in parallel before then.

## Release definition

V7 is done when:
1. Lane A has produced >=150 fully reviewable EN/TL/CEB/ILO devotionals, 8 launch books with permitted-use handling, and rights-clear Past Teachings;
2. Lane B automatically evaluates/publishes passing content and exposes Library audit/override inside protected Content Review;
3. Lane C proves the complete authenticated ONE 2 ONE mentor-to-mentee journey and denial paths;
4. Lane D freezes one exact candidate, passes consolidated automated content/security/browser/a11y/PWA/performance/regression gates, deploys it through the supported path, and verifies deployed identity/smoke.

No post-release user audit result is required to call the implementation/release complete.
