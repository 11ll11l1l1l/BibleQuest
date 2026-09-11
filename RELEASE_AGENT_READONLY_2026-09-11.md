# BibleQuest v3 — read-only release agent instructions

Date: 2026-09-11
Deadline: **18:00 JST**
Repository: `11ll11l1l1l/BibleQuest`
Primary control: `RELEASE_6PM_2026-09-11.md`

These instructions override older agent missions until the production release is complete.

## Non-negotiable agent permissions

All five agents are **READ-ONLY INVESTIGATORS**.

They may inspect repository files, branches, commits, diffs, workflow runs/logs, existing deployment configuration, and publicly reachable production behavior when their tools allow it.

They MUST NOT:

- edit code or documentation;
- create/update/delete repository files;
- create or move branches/tags/refs;
- create commits, pull requests, issues, comments, or reviews;
- trigger, edit, rerun, or cancel workflows;
- modify `main` or any release branch;
- change Cloudflare, Supabase, DNS, secrets, data, schema, Auth settings, or production configuration;
- deploy anything;
- apply a suggested fix themselves;
- revive retired Kids/Kana work;
- investigate unrelated backlog or future roadmap items.

Their only deliverable is a **finding/report in chat** for the captain/release executor.

## Common operating rules

Before investigating, every agent must read:

1. `RELEASE_6PM_2026-09-11.md`
2. `DEVELOPMENT_HANDOFF_V3.md`
3. `DEVELOPMENT_STATUS_V3.md`
4. this file

Then recover the latest live HEAD of `feature/v3-post-parity-closeout` and state the exact SHA inspected. Never assume an old SHA remains current.

Only report issues that can materially affect today's production release or provide release evidence. Do not flood the captain with cosmetic/minor findings.

Severity:

- **P0** — blocks deployment, startup, authentication, core data integrity/security, or makes production unusable.
- **P1** — serious breakage in a core release path with no reasonable workaround; should be fixed before release.
- **P2** — nonblocking defect; record for post-release unless a trivial, proven-safe correction exists.
- **INFO** — useful release evidence, not a defect.

A suspected bug is not a P0/P1 until supported by reproducible evidence, a failing executed test/log, or a concrete code/configuration contradiction. Clearly label hypotheses as hypotheses.

Each report must include:

- agent role;
- exact branch/SHA inspected;
- severity;
- concise finding;
- evidence (file/path, workflow run/job/step, reproducible behavior, or exact configuration);
- user impact;
- recommended captain action;
- whether it is a **release blocker: YES/NO**.

Do not provide broad rewrites. If a likely correction is obvious, describe the minimal proposed change in prose and identify the exact file/symbol; the captain decides and executes it.

## Agent 1 — Cloudflare / deployment investigator

Mission: find anything that could prevent the verified v3 candidate from being deployed correctly through the existing Cloudflare Pages setup.

Focus on:

- `build.sh` and `scripts/deploy-gate.mjs` compatibility with v3;
- production entrypoint/static asset paths;
- Cloudflare clean routes/redirects/headers;
- service-worker/manifest/cache behavior relevant to deployment;
- `main` → Cloudflare project assumptions;
- canonical `mybiblequest.pages.dev` and compatibility `biblequest-7th.pages.dev` deployment identity risks;
- differences between current v3 candidate and legacy `main` that could make the existing Cloudflare build gate reject or mis-serve v3.

Do not evaluate general application features unless they directly affect deployment/runtime boot.

## Agent 2 — regression / browser / mobile / PWA investigator

Mission: inspect executed verification evidence and identify release-critical gaps or failures.

Focus on:

- latest accumulated v3 architecture/edge/browser regression evidence;
- Playwright/browser/mobile failures or missing critical coverage;
- PWA install/offline/service-worker/cache upgrade behavior;
- 320/360/390/412/430-width risks where supported by existing tests/evidence;
- accessibility failures that make a core path unusable;
- stale verifier evidence that belongs to a different SHA.

Do not change tests or workflows. Report the exact test/run that should be executed or rerun by the captain if evidence is missing.

## Agent 3 — core product smoke investigator

Mission: inspect the v3 candidate for blockers in the small set of user-visible flows that must work at release.

Focus on:

- Home/app boot/navigation;
- account/sign-in/recovery surface integration;
- Bible Reader and translation switching/recovery;
- Games launcher plus one representative game and clean return;
- Transform/Psychometrics route boot where part of the v3 release;
- obvious permanent loaders, blank states, dead navigation, missing assets, or severe mobile overflow supported by evidence.

Do not perform broad feature-parity review. Retired Kids/Kana rows are explicitly out of scope.

## Agent 4 — security / backend-boundary investigator

Mission: look only for release-critical security, auth, or backend-contract contradictions introduced or exposed by v3 promotion.

Focus on:

- accidental secret/private-key exposure;
- guest/auth boundary regressions;
- obvious production-origin/redirect mismatch;
- client use of prohibited privileged APIs;
- v3 assumptions that require a Supabase schema/data/config change not actually present;
- destructive or incompatible data writes;
- security-sensitive differences between v3 and the currently deployed environment.

Do not modify Supabase or propose unrelated security hardening. Existing known nonblocking platform limitations remain post-release unless they create a new release blocker.

## Agent 5 — release firewall / triage investigator

Mission: act as the read-only filter for findings from all investigators and current repository evidence.

This agent must NOT fix anything. It should:

- deduplicate findings;
- reject speculative, minor, historical, already-fixed, or out-of-scope reports;
- distinguish P0/P1 blockers from P2/post-release items;
- detect findings based on stale SHAs;
- identify the smallest ordered list of captain actions needed to reach a green release candidate;
- state when evidence supports **NO NEW BLOCKER FOUND**.

Triage priority is: deployment blockers → security/data integrity → startup/auth/core navigation → Reader/Games/core flows → PWA/mobile → cosmetic issues.

## Reporting cadence

Agents should report immediately when a credible P0/P1 is found. Otherwise provide one concise consolidated report after completing their assigned inspection. Do not repeatedly send unchanged status.

If no blocker is found, say so explicitly and list the evidence inspected. Absence of a finding is not permission to claim the product is bug-free.

## Captain boundary

The user/captain and designated release-execution chat are the only writers. Agent findings are advisory evidence. The release executor decides whether a finding is valid, makes any code/configuration change, runs verification, freezes the exact candidate SHA, promotes it to `main`, and verifies Cloudflare production.
