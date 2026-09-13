# BibleQuest V5 Coordinated Five-Agent Protocol

Updated: 2026-09-13 JST
Applies to: `v5/feature-completion`
Tracker: Issue #185

## 1. Purpose

The five agents work on one V5 product. They are not five independent implementations and they must not recreate the old V5 architecture-lab model.

V5 is feature completion on the current architecture. V6 owns architecture/engine replacement. V7 owns the later full overhaul.

## 2. Authority hierarchy

When instructions disagree, use this order:

1. Current repository/commit/CI/backend/device evidence.
2. `V5_ACTIVE_STATUS.md`.
3. `DEVELOPMENT_PLAN_V5.md`.
4. `V5_REQUESTED_FEATURES_ACCEPTANCE_CHECKLIST.md`.
5. This protocol.
6. Newest non-expired Issue #185 claim/dispatch.
7. Scheduled-agent prompt.
8. Older issue comments, chats, README prose, historical lab branches/documents.

Historical Issue #185 architecture-era comments remain evidence only. They are not active instructions.

## 3. Mandatory start of every run

Before choosing work:

1. Fetch exact current `v5/feature-completion` HEAD.
2. Read the four authority files above.
3. Read recent Issue #185 claims/releases/dispatches.
4. Inspect all open PRs targeting `v5/feature-completion` relevant to the intended owners.
5. Inspect recent V5 commits and current checks/workflow evidence.
6. Inspect the exact current owner/service/runtime files for the selected task.
7. Prefer current repository evidence over remembered state.

Do not begin writes from a stale SHA or from a lab branch.

## 4. Claim-before-write rule

Before any repository write, post one bounded `V5-CLAIM` to Issue #185 with:

`agent | phase/workstream | task | exact base commit SHA | owners/files | dependencies | exclusions | expiry (~70 min)`

Then re-fetch Issue #185 and open PRs immediately before the first write.

A claim is invalid if:

- another active claim owns the same true runtime/data owner;
- the integration HEAD changed and the task depends on that change;
- the stated base is a tree SHA rather than the commit SHA;
- the claim has expired and no active branch/PR proves work is still in flight.

If blocked or unable to write safely, post `V5-RELEASED` and choose a different independent task.

## 5. Branch and PR rule

A1-A4 use fresh short-lived branches from the exact claimed `v5/feature-completion` commit:

- A1: `agent-v5-a1/p<phase>-<task>-<YYYYMMDDHH>`
- A2: `agent-v5-a2/p<phase>-<task>-<YYYYMMDDHH>`
- A3: `agent-v5-a3/p<phase>-<task>-<YYYYMMDDHH>`
- A4: `agent-v5-a4/p<phase>-<task>-<YYYYMMDDHH>`
- A5: `agent-v5-a5/<integration-task>-<YYYYMMDDHH>` only when it must make a captain-owned integration fix.

All worker PRs target `v5/feature-completion`.

No worker writes runtime/database/workflow changes directly to `main`, V6, or V7. No worker merges its own scheduled PR into the V5 integration branch. A5 serializes integration.

## 6. Agent ownership lanes

### A1 — Product Flow / UI / Localization / Content Composition

Primary lane:

- product-flow and member-facing UI completion;
- localization foundation and screen migration;
- Today/Home and connected weekly journey composition;
- Calendar presentation when not owned by Phase 6 wiring;
- current Recordings/Media presentation and bounded latest-service surfacing;
- current-architecture content-flow implementation;
- Phase 1/3 UI support where needed.

A1 must not create security-sensitive schema/functions when A2 ownership is required, and must not absorb Push/offline/tenant work owned by A3.

Localization rule: build the small reviewed string-lookup foundation first. Do not mass-translate hard-coded strings across the app before that foundation integrates.

### A2 — Admin / Security / Supabase-Sensitive Work

Primary lane:

- Phase 2 Admin Console security/backend work;
- auth/RLS/audit/session-sensitive changes;
- controlled backend E2E harnesses/evidence;
- minimal migrations/functions needed by an accepted V5 feature when no existing owner can represent it safely.

A2 is the required security reviewer/owner for any new persisted schema, RLS policy, privileged Edge Function, or server-side push delivery storage path.

A2 must not redesign auth/database architecture or build V6 infrastructure.

### A3 — Notifications / Offline / Multi-Congregation

Primary lane:

- Phase 4 minimum Web Push;
- Phase 5 baseline offline Scripture reopening/availability;
- Phase 6 active-congregation context/switcher/downstream wiring/Gate C preparation.

A3 should remain on these gates while they are open. It should not absorb unrelated localization/content/UI work merely because another owner is busy.

A3 must preserve account/tenant isolation, never expose push secrets, and never claim real-device/backend evidence from static tests.

### A4 — Artwork / Verification / Localization QA

Primary lane:

- Phase 3 artwork completion and genuine-match validation;
- Phase 7 CEBOCB/Couples/whole-app verification;
- localization completeness/fallback/hard-coded-string scans;
- translated-layout/accessibility/mobile/browser verification;
- accumulated current-architecture regression and release-evidence support.

A4 may fix a demonstrated bounded presentation defect only after claiming its exact owner. It must not use verification work as a reason to redesign Reader/Games/UI architecture.

### A5 — Integration / Dispatch / Release-Control Captain

Primary lane:

- maintain one coherent integration line;
- review every open PR for overlap, stale base, scope drift, test weakening, privacy/security risk, and missing evidence;
- merge one PR at a time;
- re-fetch integration HEAD and checks after every merge;
- keep Issue #185 ranked queue current;
- keep `V5_ACTIVE_STATUS.md` and checklist synchronized only when status materially changes;
- freeze/report the exact release candidate when gates pass.

A5 may make narrow integration-only fixes, conflict reconciliation, test-gate plumbing, or authority-doc maintenance only when no worker owns those files.

A5 does not autonomously promote to production.

## 7. Safe parallelization model

Maximize throughput through independent ownership, not more simultaneous writes to the same surface.

Preferred concurrent lanes while current gates remain open:

- A1: localization foundation / independent product-composition tranche.
- A2: Phase 2 security/evidence or independently-required minimal backend support.
- A3: Phase 4/5/6 tranche.
- A4: Phase 3/7 verification/artwork/localization-QA tranche.
- A5: integration review, CI/runbook plumbing, queue dispatch, serialized merges.

Work stealing is allowed only when the task is:

- unclaimed;
- dependency-satisfied;
- within V5 current-architecture scope;
- outside another agent's true owner;
- small enough for one coherent PR.

Do not stack dependent PRs when the dependency has not integrated unless A5 explicitly authorizes the stack and the ownership remains isolated.

## 8. Dependency rules for the accepted content/UX track

- Broad Tagalog/Cebuano screen migration waits for the localization foundation to integrate.
- Cebuano uses the same key inventory/mechanism as English/Tagalog; no second mechanism.
- Reader offline-availability UI should consume the integrated Phase 5 contract rather than copy/reimplement it.
- Calendar active-congregation behavior should consume the integrated Phase 6 context rather than invent local membership selection.
- Latest-service surfacing may use only completion/stable identity already known to current BibleQuest/Recordings. External YouTube polling/webhooks/scheduled discovery are V6.
- New content tables/columns are not assumed. Existing owners must be evaluated first; any required schema change is a separate A2-reviewed tranche.

## 9. Evidence and validation

Every PR and Issue #185 completion comment must label what evidence exists:

- `STATIC`
- `BROWSER-AUTO`
- `BACKEND-E2E`
- `DEVICE/FIELD`

Required real gates:

- Web Push final PASS: actual closed-app delivery/tap — `DEVICE/FIELD`.
- Offline final PASS: actual no-network reopen — `DEVICE/FIELD` or equivalent browser network-disabled evidence.
- Multi-congregation Gate C: real cross-congregation execution — `BACKEND-E2E/DEVICE/FIELD`.
- Admin email-change: controlled real Supabase Auth — `BACKEND-E2E`.
- Tagalog/Cebuano final UI acceptance: representative exact-head browser/mobile layout plus completeness scan — `BROWSER-AUTO` + static completeness.

Pending/skipped is not PASS. An older green run on a similar SHA is not proof for a new head.

Never weaken a valid security/privacy/regression test merely to obtain green status.

## 10. Integration policy

A5 reviews and integrates in this order unless a dependency or security issue requires otherwise:

1. current-phase exit blockers;
2. small security/privacy fixes;
3. dependency foundations needed by multiple later tasks;
4. independent feature-completion PRs;
5. verification-only PRs that unlock acceptance evidence;
6. low-risk polish/content-depth work.

One PR is merged at a time. After each merge, re-fetch exact integration SHA and relevant checks before the next merge.

Hold/reject a PR when:

- its base/owner assumptions are stale;
- it overlaps another active PR/claim;
- required exact-head checks are red or absent for a risky change;
- it introduces V6/V7 architecture;
- it weakens auth/RLS/privacy/tests;
- it claims real evidence that was not executed.

## 11. Production and secrets

Scheduled agents must not:

- merge V5 runtime work to `main`;
- deploy/promote production;
- mutate production Supabase/Cloudflare except an explicitly-authorized minimal controlled verification action;
- expose service-role keys, VAPID private keys, auth tokens, recovery codes, temporary passwords, or private user content;
- create permissive RLS/public grants to make a feature pass.

## 12. End-of-run contract

Every worker run ends with exactly one Issue #185 state message:

### `V5-DONE`
Include start SHA, end/head SHA, branch/PR, owners/files, behavior changed, tests, evidence class, known gaps, next action, and release of claim.

### `V5-BLOCKED`
Include start/head state, exact blocker, work already completed, evidence, why further writes are unsafe, and safe next action. Release the claim unless the blocker is a short external check and ownership must remain reserved.

### `V5-RELEASED`
Use when no useful code was produced or when abandoning/releasing ownership. State whether any branch/files changed.

A5 uses `V5-DISPATCH` for ranked tasks and must include current integration SHA.

## 13. Stale-instruction cleanup rule

Do not delete useful historical evidence merely because it is old. Instead:

- mark old lab branches/readmes as historical when touched;
- never cite historical architecture-era Issue #185 comments as current instructions;
- prefer updating the four authority files rather than creating new overlapping planning files;
- avoid new status/roadmap documents unless a genuinely new responsibility has no existing owner.

The goal is one target, one checklist, one protocol, one current status, and one shared Issue #185 queue.
