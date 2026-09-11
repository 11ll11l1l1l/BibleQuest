# BibleQuest v3 — read-only release agent instructions (HISTORICAL)

Date: 2026-09-11
Original deadline: 18:00 JST
Repository: `11ll11l1l1l/BibleQuest`

## Current-status notice

The September 11 production-release mission governed by this file is **complete**. This document is retained as historical evidence of the release-agent roles and restrictions that applied during that release window.

It is **not** the current post-release task-selection authority and must not override:

1. the user's latest explicit instruction;
2. `DEVELOPMENT_PRIORITY_V3.md`;
3. current `DEVELOPMENT_HANDOFF_V3.md` / `DEVELOPMENT_STATUS_V3.md`;
4. current exact-SHA milestone evidence.

Do not instruct a current development session to recover `feature/v3-post-parity-closeout`, stop new post-release features, or return to the completed 18:00 release procedure merely because this historical file exists.

Historical findings produced under these instructions remain evidence, but a P0/P1 against an older SHA must be revalidated against the current exact product checkpoint before it can interrupt current development.

## Historical release-agent model

During the release window, all five support agents were read-only investigators. They could inspect code/configuration, diffs, branches, tests, workflow evidence and production behavior, but could not write code/docs, move refs, create commits/PRs/issues, modify workflows, deploy, or change Cloudflare/Supabase/DNS/secrets/data/schema/configuration.

Their historical assignments were:

1. Cloudflare/deployment investigator.
2. Regression/browser/mobile/PWA investigator.
3. Core product smoke investigator.
4. Security/backend-boundary investigator.
5. Release firewall/triage investigator.

Historical findings were required to state the exact inspected SHA, severity, evidence, user impact, recommended captain action and whether the issue was a release blocker. Speculative/minor/stale findings were not allowed to displace release-critical work.

## Historical severity model

- **P0** — deployment/startup/authentication/data-integrity/security blocker or production unusable.
- **P1** — serious core-path breakage with no reasonable workaround.
- **P2** — nonblocking defect.
- **INFO** — release evidence rather than a defect.

A suspected issue did not become P0/P1 without reproducible evidence, an executed failing test/log, or a concrete code/configuration contradiction.

## Reuse in current post-release work

Current development may reuse the same evidence discipline and read-only investigation concept, but must:

- inspect the **current** exact product SHA;
- use `DEVELOPMENT_PRIORITY_V3.md` for current priorities;
- allow approved post-release functional, Visual Phase B and Calendar development;
- revalidate historical findings before treating them as active;
- keep investigators advisory/read-only unless a newer explicit instruction grants a different role.

This file does not itself authorize production writes or product changes.
