# BibleQuest V7 starting point

Updated: 2026-10-04 JST

## Baseline

Production V6: `7997d60e6069aa406ec005c32e33e46fee39bc12` on `main`.
Development preparation includes V6 closeout evidence through `894ee1396e88704a6d552722a3498ddf2d6f57ae`, followed by repository documentation cleanup. Start new work from `v7/development`.

## Preserved contracts

- Production Cloudflare project: `mybiblequest`; `npm run build:v6` → `dist-v6`.
- Existing exact-SHA gates, deployment verifier, inherited regression suites and migrations.
- V5 rollback: `rollback/v5-pre-v6-production-20261003` at `1cab2110cd15285e9ee388f7889b9fd284823274`.
- V6 release: `release/v6-rc-final-20261003` at the production SHA.
- Eight V6 acceptance rows remain OPEN. Physical/manual waivers are not PASS; authenticated production session observation remains unperformed.

## Start V7 work

Use the pinned Node version and lockfile. Select the first V7 objective before implementing features or changing architecture. Use existing checks affected by each change. Keep production main pinned until an explicitly authorized V7 promotion; retain rollback references.

Historical documents, runtime compatibility modules, tests and workflows are distinct. Archive stale narrative material; preserve executable dependencies and historical evidence. Do not remove migrations or reset acceptance evidence to make the workspace appear complete.

## Cleanup verification

The existing deployment gate and every command in `.github/actions/inherited-regression-static/action.yml` passed after archival. `git diff --check` passed. These checks ran locally on Node 24.19.0; production remains certified on the repository's pinned Node 22.23.2. No runtime files, tests, workflow definitions or migrations changed.

Superseded PR #1120 (older RC marker) and #1109 (assignment-push evidence superseded by final acceptance) were closed. PR #1119 is retained: its UI changes differ from the released baseline and must not be silently deleted or merged. Existing historical branches are retained for traceability; the frozen release and rollback references were checked remotely.

Existing exact-SHA workflows remain available through `workflow_dispatch` with a candidate SHA. A V7 implementation change must explicitly adopt the existing PR gate branch filters before relying on automatic V7 checks. This documentation cleanup does not create replacement infrastructure.
